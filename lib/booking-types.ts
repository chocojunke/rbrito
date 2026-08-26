export type Barber = { id: number; name: string; role: string }
export type Service = { id: number; name: string; description: string; durationMinutes: number; priceCents: number }
export type BookingSlot = { date: string; time: string; endTime: string }
export const formatPrice = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €`
export const formatDuration = (minutes: number) => `${minutes} min`
export type BookingResponse = { success: true; id: number } | { error: string }
