'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { AdminBooking } from '@/components/admin-booking-editor'

type BarberOption = { id: number; name: string; role: string }

type Props = {
  bookings: AdminBooking[]
  barbers: BarberOption[]
  selectedBarberId: number | null
  onBarberChange: (id: number | null) => void
  onEdit: (booking: AdminBooking) => void
  onMove: (booking: AdminBooking, date: string, time: string) => void
  onCancel: (id: number) => void
  onAddBlocker: (date: string, time: string) => void
}

const START_HOUR = 9
const END_HOUR = 20
const SLOT_HEIGHT = 48
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type DragState = {
  id: number
  date: string
  time: string
  startX: number
  startY: number
  moved: boolean
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(date).replace('.', '')
}

function mondayOf(date: Date) {
  const next = new Date(date)
  const day = next.getDay()
  next.setDate(next.getDate() - (day === 0 ? 6 : day - 1))
  next.setHours(0, 0, 0, 0)
  return next
}

function snapTime(minutesFromStart: number) {
  const max = (END_HOUR - START_HOUR) * 60 - 30
  const snapped = Math.max(0, Math.min(max, Math.round(minutesFromStart / 30) * 30))
  const hour = START_HOUR + Math.floor(snapped / 60)
  const minute = snapped % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function cardTop(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return ((hour - START_HOUR) * 60 + minute) / 30 * SLOT_HEIGHT
}

function bookingDateKey(value: string) {
  return String(value).slice(0, 10)
}

export function AdminCalendar({ bookings, barbers, selectedBarberId, onBarberChange, onEdit, onMove, onCancel, onAddBlocker }: Props) {
  const [week, setWeek] = useState(() => mondayOf(new Date()))
  const [mobileDayIndex, setMobileDayIndex] = useState(() => {
    const day = new Date().getDay()
    return day === 0 ? 5 : Math.min(day - 1, 5)
  })
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const dayRefs = useRef<(HTMLDivElement | null)[]>([])
  const weekDays = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const next = new Date(week)
    next.setDate(week.getDate() + i)
    return next
  }), [week])
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const range = `${formatDay(weekDays[0])} — ${formatDay(weekDays[5])}`
  const visibleBookings = useMemo(
    () => selectedBarberId === null ? bookings : bookings.filter((item) => Number(item.barberId) === selectedBarberId),
    [bookings, selectedBarberId],
  )

  function hitTest(clientX: number, clientY: number) {
    for (let index = 0; index < dayRefs.current.length; index += 1) {
      const column = dayRefs.current[index]
      if (!column) continue
      const rect = column.getBoundingClientRect()
      if (clientX < rect.left || clientX > rect.right) continue
      const minutes = ((clientY - rect.top) / SLOT_HEIGHT) * 30
      return { date: dateKey(weekDays[index]), time: snapTime(minutes) }
    }
    return null
  }

  function displayed(item: AdminBooking) {
          if (drag && drag.id === item.id && item.kind !== 'blocker') return { ...item, date: drag.date, time: drag.time }
    return item
  }

  function startDrag(event: React.PointerEvent<HTMLElement>, item: AdminBooking) {
    if (item.kind === 'blocker' || item.status === 'cancelled') return
    if ((event.target as HTMLElement).closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const next = { id: item.id, date: item.date, time: item.time, startX: event.clientX, startY: event.clientY, moved: false }
    dragRef.current = next
    setDrag(next)
  }

  function onBookingPointerUp(event: React.PointerEvent<HTMLElement>, item: AdminBooking) {
    const current = dragRef.current
    if (!current || current.id !== item.id) {
      onEdit(item)
      return
    }
    endDrag(event, item)
  }

  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    const current = dragRef.current
    if (!current) return
    const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY)
    if (!current.moved && distance < 8) return
    const hit = hitTest(event.clientX, event.clientY)
    const next = { ...current, moved: true, date: hit?.date ?? current.date, time: hit?.time ?? current.time }
    dragRef.current = next
    setDrag(next)
  }

  function endDrag(event: React.PointerEvent<HTMLElement>, item: AdminBooking) {
    const current = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!current) return
    if (!current.moved) {
      onEdit(item)
      return
    }
    if (current.date !== item.date || current.time !== item.time) onMove(item, current.date, current.time)
  }

  return (
    <section className="overflow-hidden rounded-sm border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Agenda semanal</p>
          <h2 className="mt-1 font-serif text-2xl uppercase">{range}</h2>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Barbeiro</span>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar barbeiro">
            <button type="button" aria-pressed={selectedBarberId === null} onClick={() => onBarberChange(null)} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm transition-colors ${selectedBarberId === null ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary'}`}>Todos</button>
            {barbers.map((barber) => <button type="button" key={barber.id} aria-pressed={selectedBarberId === barber.id} onClick={() => onBarberChange(barber.id)} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm transition-colors ${selectedBarberId === barber.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary'}`}>{barber.name}</button>)}
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Semana anterior" onClick={() => { const next = new Date(week); next.setDate(next.getDate() - 7); setWeek(next) }} className="flex size-11 items-center justify-center rounded-full border border-border" title="Semana anterior"><ChevronLeft /></button>
            <button onClick={() => setWeek(mondayOf(new Date()))} className="h-11 rounded-full border border-border px-4 text-sm">Hoje</button>
            <button aria-label="Próxima semana" onClick={() => { const next = new Date(week); next.setDate(next.getDate() + 7); setWeek(next) }} className="flex size-11 items-center justify-center rounded-full border border-border" title="Próxima semana"><ChevronRight /></button>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-3 py-3 md:hidden">
        <div className="flex snap-x gap-2 overflow-x-auto pb-1">
          {weekDays.map((day, index) => (
            <button
              key={dateKey(day)}
              type="button"
              onClick={() => setMobileDayIndex(index)}
              aria-pressed={mobileDayIndex === index}
              className={`min-h-11 min-w-20 snap-start rounded-full border px-3 text-xs ${mobileDayIndex === index ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
            >
              <span className="block uppercase tracking-wider">{days[index]}</span>
              <span className="font-semibold">{formatDay(day)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-0 md:min-w-[760px]">
          <div className="grid grid-cols-[52px_minmax(0,1fr)] md:grid-cols-[64px_repeat(6,minmax(110px,1fr))] border-b border-border">
            <div />
            <div className="col-span-1 grid grid-cols-1 md:col-span-6 md:grid-cols-6">
              {weekDays.map((day, index) => (
                <div key={dateKey(day)} className={`border-l border-border px-2 py-3 text-center md:block ${index === mobileDayIndex ? '!block' : '!hidden'} ${dateKey(day) === dateKey(new Date()) ? 'bg-primary/10' : ''}`}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{days[index]}</p>
                  <p className="mt-1 font-semibold">{formatDay(day)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[52px_minmax(0,1fr)] md:grid-cols-[64px_repeat(6,minmax(110px,1fr))]">
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="h-24 border-b border-border pr-2 pt-1 text-right text-[11px] text-muted-foreground">{String(hour).padStart(2, '0')}:00</div>
              ))}
            </div>

            <div className="col-span-1 grid grid-cols-1 md:col-span-6 md:grid-cols-6">
              {weekDays.map((day, index) => (
                <div
                  key={dateKey(day)}
                  ref={(node) => { dayRefs.current[index] = node }}
                  className={`relative min-h-[72rem] border-l border-border md:block ${index === mobileDayIndex ? '!block' : '!hidden'}`}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      onDoubleClick={() => onAddBlocker(dateKey(day), `${String(hour).padStart(2, '0')}:00`)}
                      title="Duplo clique para adicionar bloqueio"
                      className="h-24 cursor-crosshair border-b border-border"
                    >
                      <div className="h-12 border-b border-dashed border-border/60" />
                    </div>
                  ))}

                  {visibleBookings
                    .map(displayed)
                    .filter((item) => bookingDateKey(item.date) === dateKey(day))
                    .map((item) => {
                      const original = bookings.find((booking) => booking.id === item.id && booking.kind === item.kind) ?? item
                      const height = Math.max((item.duration || 30) / 30 * SLOT_HEIGHT - 3, 42)
                      const cancelled = item.status === 'cancelled'
                      const moving = drag?.id === item.id && drag.moved

                      return (
                        <article
                          key={`${item.kind ?? 'booking'}-${item.id}`}
                          style={{ top: cardTop(item.time), height }}
                          onPointerDown={(event) => startDrag(event, original)}
                          onPointerMove={moveDrag}
                          onPointerUp={(event) => onBookingPointerUp(event, original)}
                          onPointerCancel={() => { dragRef.current = null; setDrag(null) }}
                          className={`absolute inset-x-1 overflow-hidden rounded-sm border p-2 text-xs shadow-sm touch-none ${
                            item.kind === 'blocker'
                              ? 'border-destructive/50 bg-destructive/15'
                              : cancelled
                                ? 'border-destructive/30 bg-destructive/10 opacity-60'
                                : moving
                                  ? 'z-20 cursor-grabbing border-primary bg-primary/25'
                                  : 'cursor-grab border-primary/40 bg-primary/15'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <strong className="truncate text-primary">{item.time} · {item.name}</strong>
                            <span className="shrink-0 text-[10px]">{cancelled ? 'Cancelada' : `${item.duration}m`}</span>
                          </div>
                          <p className="mt-1 truncate text-foreground">{item.service}</p>
                          <p className="truncate text-muted-foreground">{item.barber}</p>

                          {!cancelled && item.kind !== 'blocker' && (
                            <div className="mt-2 flex gap-1">
                              <button type="button" onClick={() => onEdit(original)} className="min-h-8 rounded-full border border-border bg-card/70 px-2 text-[10px]">Editar</button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!window.confirm(`Cancelar a marcação de ${original.name}?`)) return
                                  onCancel(original.id)
                                }}
                                aria-label={`Cancelar marcação de ${original.name}`}
                                className="flex min-h-8 min-w-8 items-center justify-center rounded-full border border-destructive/40 text-destructive"
                              >
                                <X />
                              </button>
                            </div>
                          )}
                        </article>
                      )
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-primary" />Confirmada</span>
          <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-destructive" />Cancelada</span>
        </div>
        <span className="sm:ml-auto">Arrastar para mudar data/hora · 09:00 — 20:00</span>
      </div>
    </section>
  )
}
