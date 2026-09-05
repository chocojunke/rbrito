'use client'

import { useState } from 'react'
import { addAdminException, deleteAdminException } from '@/app/actions/admin'

type Exception = { id: number; barberId: number; barber: string; startDate: string; endDate: string; startTime: string; endTime: string; description: string }
type Barber = { id: number; name: string; role: string }

const initialForm = (barbers: Barber[]) => ({ barberId: String(barbers[0]?.id ?? ''), startDate: '', endDate: '', closed: true, startTime: '09:00', endTime: '18:00', description: '' })

export function AdminExceptions({ initial, barbers, onChanged }: { initial: Exception[]; barbers: Barber[]; onChanged: () => Promise<void> }) {
  const [items, setItems] = useState(initial)
  const [form, setForm] = useState(() => initialForm(barbers))
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await addAdminException({ barberId: Number(form.barberId), startDate: form.startDate, endDate: form.endDate || form.startDate, startTime: form.closed ? undefined : form.startTime, endTime: form.closed ? undefined : form.endTime, description: form.description })
      setForm(initialForm(barbers))
      await onChanged()
      setItems([])
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-8 min-w-0 max-w-full overflow-hidden rounded-sm border border-border bg-card p-4 sm:p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-primary">Exceções de disponibilidade</p>
      <h2 className="mt-1 font-serif text-2xl uppercase">Feriados e horários especiais</h2>
      <form onSubmit={submit} className="mt-5 flex min-w-0 max-w-full flex-col gap-4">
        <div className="grid min-w-0 max-w-full gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            Barbeiro
            <select required value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })} className="block min-h-11 w-full min-w-0 max-w-full appearance-none rounded-sm border border-border bg-background px-3 text-base text-foreground box-border">
              <option value="">Selecionar barbeiro</option>
              {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            Data inicial
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="block min-h-11 w-full min-w-0 max-w-full appearance-none rounded-sm border border-border bg-background px-3 text-base text-foreground box-border" />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            Data final
            <input type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="block min-h-11 w-full min-w-0 max-w-full appearance-none rounded-sm border border-border bg-background px-3 text-base text-foreground box-border" />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            Descrição
            <input required placeholder="Ex.: Férias" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="block min-h-11 w-full min-w-0 max-w-full appearance-none rounded-sm border border-border bg-background px-3 text-base text-foreground box-border" />
          </label>
        </div>
        <div className="flex flex-col gap-3 rounded-sm border border-border/70 bg-background/50 p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex min-h-11 items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.closed} onChange={(e) => setForm({ ...form, closed: e.target.checked })} className="size-4 accent-primary" /> Fechado todo o dia</label>
          {!form.closed && <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:max-w-sm"><label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">Abre<input required type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="block min-h-11 w-full min-w-0 max-w-full appearance-none rounded-sm border border-border bg-background px-3 text-base text-foreground box-border" /></label><label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">Fecha<input required type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="block min-h-11 w-full min-w-0 max-w-full appearance-none rounded-sm border border-border bg-background px-3 text-base text-foreground box-border" /></label></div>}
          <button disabled={saving} className="min-h-11 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:ml-auto">{saving ? 'A guardar…' : 'Adicionar exceção'}</button>
        </div>
      </form>
      <div className="mt-5 flex flex-col gap-2">
        {items.map((item) => <div key={item.id} className="flex flex-col gap-2 border-t border-border pt-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span><strong>{item.barber}</strong> · {item.startDate}{item.endDate !== item.startDate ? ` — ${item.endDate}` : ''} · {item.startTime ? `${item.startTime}–${item.endTime}` : 'Fechado'} · {item.description}</span><button type="button" onClick={async () => { await deleteAdminException(item.id); setItems(items.filter((entry) => entry.id !== item.id)); await onChanged() }} className="min-h-11 self-start text-xs uppercase tracking-wider text-destructive sm:self-auto">Remover</button></div>)}
      </div>
    </section>
  )
}
