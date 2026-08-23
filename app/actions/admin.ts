'use server'
import { cookies } from 'next/headers'
import { pool } from '@/lib/db'
import { sendCancellationEmail } from '@/lib/booking-email'

export async function adminLogin(password: string) {
  if (!process.env.ADMIN_BOOKING_PASSWORD) return { error: 'Variável ADMIN_BOOKING_PASSWORD não configurada.' }
  if (password !== process.env.ADMIN_BOOKING_PASSWORD) return { error: 'Password incorreta.' }

  const isProd = process.env.NODE_ENV === 'production'
  ;(await cookies()).set('rbrito-admin', '1', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 })
  return { success: true }
}

export async function adminLogout() { (await cookies()).delete('rbrito-admin') }

export async function getAdminBookings() {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')

  try {
    const result = await pool.query(`SELECT b.id, b.appointment_date AS date, to_char(b.start_time, 'HH24:MI') AS time, b.customer_name AS name, b.customer_email AS email, b.customer_phone AS phone, b.status, s.name AS service, br.name AS barber FROM bookings b JOIN services s ON s.id = b.service_id JOIN barbers br ON br.id = b.barber_id WHERE b.appointment_date >= CURRENT_DATE ORDER BY b.appointment_date, b.start_time`)
    return result.rows.map((row) => ({
      ...row,
      date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date ?? ''),
      time: row.time instanceof Date ? row.time.toTimeString().slice(0, 5) : String(row.time ?? ''),
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

export async function updateAdminBooking(id: number, date: string, time: string) {
  if ((await cookies()).get('rbrito-admin')?.value !== '1') throw new Error('Não autorizado')

  try {
    await pool.query(`UPDATE bookings SET appointment_date = $2, start_time = $3, updated_at = NOW() WHERE id = $1 AND status = 'confirmed'`, [id, date, time])
    return { success: true }
  } catch (error) {
    console.error('updateAdminBooking failed:', error)
    return { success: false, error: 'Não foi possível atualizar a marcação. Verifique a base de dados.' }
  }
}
