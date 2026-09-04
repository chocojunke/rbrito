'use server'
import { cookies } from 'next/headers'
import { pool } from '@/lib/db'
import { sendCancellationEmail } from '@/lib/booking-email'

export async function adminLogin() {
  const isProd = process.env.NODE_ENV === 'production'
  ;(await cookies()).set('rbrito-admin', '1', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 })
  return { success: true }
}

export async function adminLogout() { (await cookies()).delete('rbrito-admin') }

export async function getAdminSession() {
  return (await cookies()).get('rbrito-admin')?.value === '1'
}

function normalizeDateValue(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value ?? '')
}

function normalizeTimeValue(value: unknown) {
  if (value instanceof Date) return value.toTimeString().slice(0, 5)
  return String(value ?? '')
}

export async function addNextMonthAvailability() {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')

  await pool.query(`
    UPDATE barber_availability
    SET start_time = '09:00'::time, end_time = '18:00'::time, active = true
    WHERE weekday BETWEEN 1 AND 6
  `)

  const result = await pool.query(`
    INSERT INTO barber_availability (barber_id, weekday, start_time, end_time, active)
    SELECT b.id, days.weekday, '09:00'::time, '18:00'::time, true
    FROM barbers b
    CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6)) AS days(weekday)
    WHERE b.active = true
      AND NOT EXISTS (
        SELECT 1 FROM barber_availability a
        WHERE a.barber_id = b.id AND a.weekday = days.weekday
      )
    RETURNING id
  `)

  return { success: true, added: result.rowCount ?? 0 }
}

export async function getAdminBarbers() {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')

  const result = await pool.query(`
    SELECT id, name, role
    FROM barbers
    WHERE active = true
    ORDER BY name
  `)

  return result.rows as { id: number; name: string; role: string }[]
}

export async function getAdminBookings() {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')

  try {
    const result = await pool.query(`
      SELECT
        b.id,
        to_char(b.appointment_date, 'YYYY-MM-DD') AS date,
        to_char(b.start_time, 'HH24:MI') AS time,
        b.customer_name AS name,
        b.customer_email AS email,
        b.customer_phone AS phone,
        b.status,
        b.barber_id AS "barberId",
        b.service_id AS "serviceId",
        s.name AS service,
        s.duration_minutes AS duration,
        br.name AS barber
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      JOIN barbers br ON br.id = b.barber_id
      WHERE b.appointment_date >= CURRENT_DATE
      ORDER BY b.appointment_date, b.start_time
    `)

    return result.rows.map((row) => ({
      ...row,
      date: normalizeDateValue(row.date),
      time: normalizeTimeValue(row.time),
      barberId: Number(row.barberId),
      serviceId: Number(row.serviceId),
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido da base de dados.'
    console.error('getAdminBookings failed:', error)
    throw new Error(`Base de dados indisponível: ${message}`)
  }
}

export async function cancelAdminBooking(id: number) {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')

  try {
    const result = await pool.query(`UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = $1 AND status = 'confirmed' RETURNING customer_email AS email, customer_name AS name`, [id])
    if (result.rowCount) await sendCancellationEmail(result.rows[0].email, result.rows[0].name).catch(() => undefined)
    return { success: true }
  } catch (error) {
    console.error('cancelAdminBooking failed:', error)
    return { success: false, error: 'Não foi possível cancelar a marcação. Verifique a base de dados.' }
  }
}

export async function updateAdminBooking(
  id: number,
  input: { date: string; time: string; name?: string; email?: string; phone?: string },
) {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}/.test(input.time)) {
    return { success: false, error: 'Data ou hora inválida.' }
  }

  const time = input.time.slice(0, 5)

  try {
    const booking = await pool.query(
      `SELECT barber_id, service_id FROM bookings WHERE id = $1 AND status = 'confirmed'`,
      [id],
    )
    if (!booking.rowCount) return { success: false, error: 'Marcação não encontrada.' }

    const service = await pool.query('SELECT duration_minutes FROM services WHERE id = $1', [booking.rows[0].service_id])
    const duration = service.rows[0]?.duration_minutes ?? 30
    await pool.query(
      `UPDATE bookings SET
         appointment_date = $2,
         start_time = $3,
         end_time = ($3::time + make_interval(mins => $4))::time,
         customer_name = COALESCE($5, customer_name),
         customer_email = COALESCE($6, customer_email),
         customer_phone = COALESCE($7, customer_phone),
         updated_at = NOW()
       WHERE id = $1 AND status = 'confirmed'`,
      [
        id,
        input.date,
        time,
        duration,
        input.name?.trim() || null,
        input.email?.trim().toLowerCase() || null,
        input.phone?.trim() || null,
      ],
    )
    return { success: true }
  } catch (error) {
    console.error('updateAdminBooking failed:', error)
    return { success: false, error: 'Não foi possível atualizar a marcação. Verifique a base de dados.' }
  }
}

export async function getAdminBlockers() {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')

  const result = await pool.query(`
    SELECT
      bl.id,
      to_char(bl.blocker_date, 'YYYY-MM-DD') AS date,
      to_char(bl.start_time, 'HH24:MI') AS time,
      to_char(bl.end_time, 'HH24:MI') AS end_time,
      bl.description AS name,
      bl.status,
      bl.barber_id AS "barberId",
      br.name AS barber,
      'Bloqueio' AS service,
      EXTRACT(EPOCH FROM (bl.end_time - bl.start_time)) / 60 AS duration
    FROM blockers bl
    JOIN barbers br ON br.id = bl.barber_id
    WHERE bl.blocker_date >= CURRENT_DATE AND bl.status = 'active'
    ORDER BY bl.blocker_date, bl.start_time
  `)

  return result.rows.map((row) => ({
    ...row,
    kind: 'blocker' as const,
    email: '',
    phone: '',
    date: normalizeDateValue(row.date),
    time: normalizeTimeValue(row.time),
    end_time: normalizeTimeValue(row.end_time),
    barberId: Number(row.barberId),
  }))
}

export async function getAdminExceptions() {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')
  const result = await pool.query(`SELECT ex.id, ex.barber_id AS "barberId", br.name AS barber, to_char(COALESCE(ex.start_date, ex.exception_date), 'YYYY-MM-DD') AS "startDate", to_char(ex.exception_date, 'YYYY-MM-DD') AS "endDate", to_char(ex.start_time, 'HH24:MI') AS "startTime", to_char(ex.end_time, 'HH24:MI') AS "endTime", ex.description FROM barber_availability_exceptions ex JOIN barbers br ON br.id = ex.barber_id WHERE ex.active = true AND ex.exception_date >= CURRENT_DATE ORDER BY COALESCE(ex.start_date, ex.exception_date), ex.start_time NULLS FIRST`)
  return result.rows.map((row) => ({ ...row, barberId: Number(row.barberId), startDate: normalizeDateValue(row.startDate), endDate: normalizeDateValue(row.endDate), startTime: normalizeTimeValue(row.startTime), endTime: normalizeTimeValue(row.endTime) }))
}

export async function addAdminException(input: { barberId: number; startDate: string; endDate: string; startTime?: string; endTime?: string; description: string }) {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')
  if (!Number.isInteger(input.barberId) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(input.startDate) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(input.endDate) || input.startDate > input.endDate || !input.description.trim()) throw new Error('Dados da exceção inválidos')
  const closed = !input.startTime && !input.endTime
  if (!closed && (!/^\\d{2}:\\d{2}$/.test(input.startTime ?? '') || !/^\\d{2}:\\d{2}$/.test(input.endTime ?? '') || input.startTime! >= input.endTime!)) throw new Error('Horário da exceção inválido')
  const result = await pool.query(`INSERT INTO barber_availability_exceptions (barber_id, exception_date, start_date, start_time, end_time, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`, [input.barberId, input.endDate, input.startDate, closed ? null : input.startTime, closed ? null : input.endTime, input.description.trim()])
  return { success: true, id: result.rows[0].id as number }
}

export async function deleteAdminException(id: number) {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')
  await pool.query('UPDATE barber_availability_exceptions SET active = false, updated_at = NOW() WHERE id = $1', [id])
  return { success: true }
}

export async function addAdminBlocker(input: { barberId: number; date: string; time: string; duration: number; description: string }) {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')
  if (!input.description.trim() || input.duration < 30 || input.duration % 30 !== 0) throw new Error('Dados do bloqueio inválidos')

  const result = await pool.query(`
    INSERT INTO blockers (barber_id, blocker_date, start_time, end_time, description)
    VALUES ($1, $2, $3, ($3::time + make_interval(mins => $4))::time, $5)
    RETURNING id
  `, [input.barberId, input.date, input.time, input.duration, input.description.trim()])

  return { success: true, id: result.rows[0].id }
}
