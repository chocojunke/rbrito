'use server'

import { createBooking, ensureBookingSchema, getAvailability, getBarbers, getServices, isValidEmail, isValidPhone, sanitizeName, type BookingResponse } from '@/lib/db'

export async function loadBookingOptions() {
  const [barbers, services] = await Promise.all([getBarbers(), getServices()])
  return { barbers, services }
}

export async function loadAvailableSlots(barberId: number, serviceId: number, from: string, to: string) {
  return getAvailability(barberId, serviceId, from, to)
}

export async function submitBooking(input: { barberId: number; serviceId: number; date: string; time: string; name: string; email: string; phone: string }): Promise<BookingResponse> {
  const name = sanitizeName(input.name)
  if (!name || name.length > 100 || !isValidEmail(input.email) || !isValidPhone(input.phone)) return { error: 'Preencha o nome, email e contacto com dados válidos.' }
  try {
    const id = await createBooking({ ...input, name, email: input.email.trim().toLowerCase(), phone: input.phone.trim() })
    return { success: true, id }
  } catch (error) {
    if (error instanceof Error && error.message.includes('bookings_unique_slot')) return { error: 'Esse horário acabou de ser ocupado. Escolha outra vaga.' }
    return { error: 'Não foi possível concluir a marcação. Tente novamente.' }
  }
}
