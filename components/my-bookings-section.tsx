'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { cancelMyBooking } from '@/app/actions/booking'

type Booking = {
  id: number
  date: string | Date
  time: string
  service: string
  barber: string
}

export function MyBookingsSection({ initialBookings, allowCancel = false }: { initialBookings: Booking[]; allowCancel?: boolean }) {
  const [bookings, setBookings] = useState(initialBookings)
  const [pending, startTransition] = useTransition()

  function cancelBooking(id: number) {
    if (!window.confirm('Tem a certeza de que pretende cancelar esta marcação?')) return
    startTransition(async () => {
      const result = await cancelMyBooking(id)
      if (result.error) {
        window.alert(result.error)
        return
      }
      setBookings((current) => current.filter((booking) => booking.id !== id))
    })
  }

  return (
    <section className="mt-10 flex flex-col gap-3" aria-label="Os meus agendamentos">
      {bookings.length ? bookings.map((booking) => (
        <article key={booking.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5">
          <div>
            <strong className="block">{booking.service}</strong>
            <span className="text-sm text-muted-foreground">{booking.barber}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{new Date(booking.date).toLocaleDateString('pt-PT')} · {String(booking.time).slice(0, 5)}</span>
            {allowCancel && (
              <button type="button" onClick={() => cancelBooking(booking.id)} disabled={pending} aria-label={`Cancelar marcação de ${booking.service}`} title="Cancelar marcação" className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50">
                <X aria-hidden="true" />
              </button>
            )}
          </div>
        </article>
      )) : <p className="border border-border p-5 text-muted-foreground">Não encontrámos marcações futuras associadas aos seus dados.</p>}
    </section>
  )
}
