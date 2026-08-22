'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react'

type Booking = { id: number; date: string; time: string; name: string; email: string; phone: string; status: string; service: string; barber: string; duration: number }
type Props = { bookings: Booking[]; onEdit: (booking: Booking) => void; onCancel: (id: number) => void }

const START_HOUR = 9
const END_HOUR = 18
const SLOT_HEIGHT = 48
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function dateKey(date: Date) { return date.toISOString().slice(0, 10) }
function formatDay(date: Date) { return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(date).replace('.', '') }
function mondayOf(date: Date) { const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0, 0, 0, 0); return d }

export function AdminCalendar({ bookings, onEdit, onCancel }: Props) {
  const [week, setWeek] = useState(() => mondayOf(new Date()))
  const weekDays = useMemo(() => Array.from({ length: 6 }, (_, i) => { const d = new Date(week); d.setDate(week.getDate() + i); return d }), [week])
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const range = `${formatDay(weekDays[0])} — ${formatDay(weekDays[5])}`

  return <section className="overflow-hidden rounded-sm border border-border bg-card shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
      <div><p className="text-xs uppercase tracking-[0.2em] text-primary">Agenda semanal</p><h2 className="mt-1 font-serif text-2xl uppercase">{range}</h2></div>
      <div className="flex items-center gap-2"><button aria-label="Semana anterior" onClick={() => { const d = new Date(week); d.setDate(d.getDate() - 7); setWeek(d) }} className="flex size-11 items-center justify-center rounded-full border border-border" title="Semana anterior"><ChevronLeft /></button><button onClick={() => setWeek(mondayOf(new Date()))} className="h-11 rounded-full border border-border px-4 text-sm">Hoje</button><button aria-label="Próxima semana" onClick={() => { const d = new Date(week); d.setDate(d.getDate() + 7); setWeek(d) }} className="flex size-11 items-center justify-center rounded-full border border-border" title="Próxima semana"><ChevronRight /></button></div>
    </div>
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[64px_repeat(6,minmax(110px,1fr))] border-b border-border"><div /><div className="col-span-6 grid grid-cols-6">{weekDays.map((d, i) => <div key={dateKey(d)} className={`border-l border-border px-2 py-3 text-center ${dateKey(d) === dateKey(new Date()) ? 'bg-primary/10' : ''}`}><p className="text-xs uppercase tracking-wider text-muted-foreground">{days[i]}</p><p className="mt-1 font-semibold">{formatDay(d)}</p></div>)}</div></div>
        <div className="grid grid-cols-[64px_repeat(6,minmax(110px,1fr))]">
          <div className="relative">{hours.map(h => <div key={h} className="h-24 border-b border-border pr-2 pt-1 text-right text-[11px] text-muted-foreground">{String(h).padStart(2, '0')}:00</div>)}</div>
          <div className="col-span-6 grid grid-cols-6">{weekDays.map(d => <div key={dateKey(d)} className="relative border-l border-border">{hours.map(h => <div key={h} className="h-24 border-b border-border"><div className="h-12 border-b border-dashed border-border/60" /></div>)}{bookings.filter(b => b.date === dateKey(d)).map(item => { const [h, m] = item.time.split(':').map(Number); const top = ((h - START_HOUR) * 60 + m) / 30 * SLOT_HEIGHT; const height = Math.max((item.duration || 30) / 30 * SLOT_HEIGHT - 3, 42); const cancelled = item.status === 'cancelled'; return <article key={item.id} style={{ top, height }} className={`absolute inset-x-1 overflow-hidden rounded-sm border p-2 text-xs shadow-sm ${cancelled ? 'border-destructive/30 bg-destructive/10 opacity-60' : 'border-primary/40 bg-primary/15'}`}><div className="flex items-start justify-between gap-1"><strong className="truncate text-primary">{item.time} · {item.name}</strong><span className="shrink-0 text-[10px]">{cancelled ? 'Cancelada' : `${item.duration}m`}</span></div><p className="mt-1 truncate text-foreground">{item.service}</p><p className="truncate text-muted-foreground">{item.barber}</p>{!cancelled && <div className="mt-2 flex gap-1"><button onClick={() => onEdit(item)} className="min-h-8 rounded-full border border-border bg-card/70 px-2 text-[10px]">Editar</button><button onClick={() => onCancel(item.id)} aria-label={`Cancelar marcação de ${item.name}`} className="flex min-h-8 min-w-8 items-center justify-center rounded-full border border-destructive/40 text-destructive"><X /></button></div>}</article> })}</div>)}</div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-4 border-t border-border px-4 py-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-primary" />Confirmada</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-destructive" />Cancelada</span><span className="ml-auto">09:00 — 18:00 · intervalos de 30 min</span></div>
  </section>
}
