'use server'
import { cookies } from 'next/headers'
import { pool } from '@/lib/db'
import { sendCancellationEmail } from '@/lib/booking-email'

export async function adminLogin(password: string) { if (password !== process.env.ADMIN_BOOKING_PASSWORD) return { error: 'Password incorreta.' }; (await cookies()).set('rbrito-admin', '1', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 }); return { success: true } }
export async function adminLogout() { (await cookies()).delete('rbrito-admin') }

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

export async function getAdminBookings() {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')
  const result = await pool.query(`
    SELECT
      b.id,
      to_char(b.appointment_date, 'YYYY-MM-DD') AS date,
      to_char(b.start_time, 'HH24:MI') AS time,
      b.customer_name AS name,
      b.customer_email AS email,
      b.customer_phone AS phone,
      b.status,
      s.name AS service,
      br.name AS barber
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN barbers br ON br.id = b.barber_id
    WHERE b.appointment_date >= CURRENT_DATE
    ORDER BY b.appointment_date, b.start_time
  `)
  return result.rows
}
export async function cancelAdminBooking(id: number) { if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado'); const result = await pool.query(`UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = $1 AND status = 'confirmed' RETURNING customer_email AS email, customer_name AS name`, [id]); if (result.rowCount) await sendCancellationEmail(result.rows[0].email, result.rows[0].name).catch(() => undefined); return { success: true } }
export async function updateAdminBooking(id: number, date: string, time: string) { if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado'); await pool.query(`UPDATE bookings SET appointment_date = $2, start_time = $3, updated_at = NOW() WHERE id = $1 AND status = 'confirmed'`, [id, date, time]); return { success: true } }
