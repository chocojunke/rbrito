'use client'

export type AdminBooking = {
  id: number
  date: string
  time: string
  name: string
  email: string
  phone: string
  status: string
  service: string
  barber: string
  barberId: number
  duration: number
  kind?: 'booking' | 'blocker'
}

type Props = {
  booking: AdminBooking
  saving?: boolean
  onClose: () => void
  onSave: (input: { date: string; time: string; name: string; email: string; phone: string }) => Promise<void>
  onCancelBooking: () => Promise<void>
}

export function AdminBookingEditor({ booking, saving = false, onClose, onSave, onCancelBooking }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <form
        className="w-full max-w-md rounded-sm border border-border bg-card p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
        onSubmit={async (event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          await onSave({
            date: String(data.get('date') ?? ''),
            time: String(data.get('time') ?? ''),
            name: String(data.get('name') ?? ''),
            email: String(data.get('email') ?? ''),
            phone: String(data.get('phone') ?? ''),
          })
        }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Marcação</p>
        <h2 className="mt-1 font-serif text-2xl uppercase">{booking.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{booking.service} · {booking.barber} · {booking.duration} min</p>

        <div className="mt-5 grid gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider">
            Nome
            <input name="name" required defaultValue={booking.name} className="min-h-11 rounded-sm border border-input bg-background px-3 text-sm font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider">
            Email
            <input name="email" type="email" required defaultValue={booking.email} className="min-h-11 rounded-sm border border-input bg-background px-3 text-sm font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider">
            Contacto
            <input name="phone" required defaultValue={booking.phone} className="min-h-11 rounded-sm border border-input bg-background px-3 text-sm font-normal" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider">
              Data
              <input name="date" type="date" required defaultValue={booking.date} className="min-h-11 rounded-sm border border-input bg-background px-3 text-sm font-normal" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider">
              Hora
              <input name="time" type="time" step={1800} required defaultValue={booking.time} className="min-h-11 rounded-sm border border-input bg-background px-3 text-sm font-normal" />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-border px-4 text-sm">Fechar</button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              if (!window.confirm(`Cancelar a marcação de ${booking.name}?`)) return
              await onCancelBooking()
            }}
            className="ml-auto min-h-11 rounded-full border border-destructive/40 px-4 text-sm text-destructive"
          >
            Cancelar marcação
          </button>
        </div>
      </form>
    </div>
  )
}
