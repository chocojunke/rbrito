'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BookingSlot } from '@/lib/booking-types'

type Props = {
  slots: BookingSlot[]
  selected: BookingSlot | null
  onSelect: (slot: BookingSlot | null) => void
  loading?: boolean
  daysAhead?: number
}

function lisbonDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function addDays(iso: string, days: number) {
  const next = new Date(`${iso}T12:00:00`)
  next.setDate(next.getDate() + days)
  const year = next.getFullYear()
  const month = String(next.getMonth() + 1).padStart(2, '0')
  const day = String(next.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dayParts(iso: string) {
  const date = new Date(`${iso}T12:00:00`)
  const weekday = new Intl.DateTimeFormat('pt-PT', { weekday: 'long' }).format(date).replace('-feira', '')
  const month = new Intl.DateTimeFormat('pt-PT', { month: 'short' }).format(date).replace('.', '')
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day: date.getDate(),
    month: month.charAt(0).toUpperCase() + month.slice(1),
  }
}

export function formatBookingDate(iso: string) {
  const { weekday, day, month } = dayParts(iso)
  return `${weekday} ${day} ${month}`
}

export function BookingDateTime({ slots, selected, onSelect, loading = false, daysAhead = 365 }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const days = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() + 1)
    const startKey = lisbonDateKey(start)
    return Array.from({ length: daysAhead }, (_, index) => addDays(startKey, index))
  }, [daysAhead])

  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, BookingSlot[]>()
    for (const slot of slots) {
      const date = String(slot.date).slice(0, 10)
      const list = grouped.get(date) ?? []
      list.push({ ...slot, date })
      grouped.set(date, list)
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time))
    }
    return grouped
  }, [slots])

  const firstOpenDay = useMemo(
    () => days.find((date) => (slotsByDate.get(date)?.length ?? 0) > 0) ?? days[0],
    [days, slotsByDate],
  )
  const [userDate, setUserDate] = useState<string | null>(null)

  useEffect(() => {
    setUserDate(null)
  }, [slots])

  const selectedDate = userDate ?? (selected?.date && days.includes(selected.date) ? selected.date : firstOpenDay)
  const times = slotsByDate.get(selectedDate) ?? []

  useEffect(() => {
    const scroller = scrollerRef.current
    const card = scroller?.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)
    if (!scroller || !card) return
    const left = card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2
    scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [selectedDate])

  function scrollDays(direction: -1 | 1) {
    const scroller = scrollerRef.current
    if (!scroller) return
    const card = scroller.querySelector<HTMLElement>('[data-date]')
    const step = card ? card.offsetWidth + 12 : 140
    scroller.scrollBy({ left: direction * step * 3, behavior: 'smooth' })
  }

  function chooseDay(date: string) {
    if (date === selectedDate) return
    setUserDate(date)
    onSelect(null)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Dia</p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Dias anteriores"
              onClick={() => scrollDays(-1)}
              className="flex size-11 items-center justify-center rounded-full border border-border hover:border-primary"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Dias seguintes"
              onClick={() => scrollDays(1)}
              className="flex size-11 items-center justify-center rounded-full border border-border hover:border-primary"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {days.map((date) => {
            const parts = dayParts(date)
            const available = (slotsByDate.get(date)?.length ?? 0) > 0
            const active = date === selectedDate

            return (
              <button
                key={date}
                type="button"
                data-date={date}
                aria-pressed={active}
                onClick={() => chooseDay(date)}
                className={`flex w-[6.75rem] shrink-0 snap-start flex-col items-center rounded-sm border px-3 py-4 text-center transition-colors ${
                  active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{parts.weekday}</span>
                <span className="mt-1 font-serif text-3xl leading-none">{parts.day}</span>
                <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{parts.month}</span>
                <span className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                  <i className={`size-1.5 rounded-full ${available ? 'bg-primary' : 'bg-muted-foreground/40'}`} aria-hidden="true" />
                  <span className={available ? 'text-primary' : 'text-muted-foreground'}>{available ? 'Vagas' : 'Fechado'}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Horários</p>
        {loading ? (
          <p className="text-muted-foreground">A consultar disponibilidade...</p>
        ) : times.length === 0 ? (
          <p className="rounded-sm border border-border p-5 text-muted-foreground">Não existem horários disponíveis neste dia.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {times.map((slot) => {
              const active = selected?.date === slot.date && selected.time === slot.time
              return (
                <button
                  key={`${slot.date}-${slot.time}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(slot)}
                  className={`min-h-12 rounded-sm border px-3 py-3 text-sm transition-colors ${
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'
                  }`}
                >
                  {slot.time}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
