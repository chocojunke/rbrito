'use server'

import crypto from 'node:crypto'
import { createBooking, getAvailability, getBarbers, getServices, isValidEmail, isValidPhone, sanitizeName, type BookingResponse } from '@/lib/db'
import { sendBookingEmail } from '@/lib/booking-email'

export async function loadBookingOptions() { return { barbers: await getBarbers(), services: await getServices() } }
export async function loadAvailableSlots(barberId: number, serviceId: number, from: string, to: string) { return getAvailability(barberId, serviceId, from, to) }

export async function submitBooking(input: { barberId: number; serviceId: number; date: string; time: string; name: string; email: string; phone: string }): Promise<BookingResponse & { token?: string }> {
  const name = sanitizeName(input.name), email = input.email.trim().toLowerCase(), phone = input.phone.trim()
  if (!name || name.length > 100 || !isValidEmail(email) || !isValidPhone(phone)) return { error: 'Preencha o nome, email e contacto com dados válidos.' }
  const token = crypto.randomBytes(32).toString('hex')
  try {
    const id = await createBooking({ ...input, name, email, phone, cancellationTokenHash: crypto.createHash('sha256').update(token).digest('hex') })
    const options = await loadBookingOptions()
    const barber = options.barbers.find((item) => item.id === input.barberId), service = options.services.find((item) => item.id === input.serviceId)
    await sendBookingEmail({ email, name, date: input.date, time: input.time, service: service?.name ?? 'serviço', barber: barber?.name ?? 'barbeiro', token }).catch(() => undefined)
    return { success: true, id, token }
  } catch (error) {
    if (error instanceof Error && error.message.includes('bookings_unique_slot')) return { error: 'Esse horário acabou de ser ocupado. Escolha outra vaga.' }
    return { error: 'Não foi possível concluir a marcação. Tente novamente.' }
  }
}
