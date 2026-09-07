'use server'

import crypto from 'node:crypto'
import { createBooking, getAvailability, getBarbers, getServices, isValidEmail, isValidPhone, sanitizeName, pool, type BookingResponse } from '@/lib/db'
import { sendBookingEmail, sendCancellationEmail } from '@/lib/booking-email'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function loadBookingOptions() { return { barbers: await getBarbers(), services: await getServices() } }
export async function loadAvailableSlots(barberId: number, serviceId: number, from: string, to: string) { return getAvailability(barberId, serviceId, from, to) }

export async function cancelMyBooking(bookingId: number) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: 'Inicie sessão para cancelar a marcação.' }
  const result = await pool.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status = 'confirmed' AND appointment_date >= CURRENT_DATE RETURNING customer_email, customer_name`, [bookingId, session.user.id])
  if (!result.rowCount) return { error: 'Não foi possível cancelar esta marcação.' }
  await sendCancellationEmail(result.rows[0].customer_email, result.rows[0].customer_name).catch(() => undefined)
  return { success: true }
}

export async function submitBooking(input: { barberId: number; serviceId: number; date: string; time: string; name: string; email: string; phone: string }): Promise<BookingResponse & { token?: string }> {
  const name = sanitizeName(input.name), email = input.email.trim().toLowerCase(), phone = input.phone.trim()
  if (!name || name.length > 100 || !isValidEmail(email) || !isValidPhone(phone)) return { error: 'Preencha o nome, email e contacto com dados válidos.' }
  const session = await auth.api.getSession({ headers: await headers() })
  const token = crypto.randomBytes(32).toString('hex')
  try {
    const id = await createBooking({ ...input, name, email, phone, userId: session?.user.id, cancellationTokenHash: crypto.createHash('sha256').update(token).digest('hex') })
    const options = await loadBookingOptions()
    const barber = options.barbers.find((item) => item.id === input.barberId), service = options.services.find((item) => item.id === input.serviceId)
    await sendBookingEmail({ email, name, date: input.date, time: input.time, service: service?.name ?? 'serviço', barber: barber?.name ?? 'barbeiro', token }).catch(() => undefined)
    return { success: true, id, token }
  } catch (error) {
    if (error instanceof Error && error.message.includes('bookings_unique_slot')) return { error: 'Esse horário acabou de ser ocupado. Escolha outra vaga.' }
    return { error: 'Não foi possível concluir a marcação. Tente novamente.' }
  }
}
