'use client'

import { useEffect, useState } from 'react'
import { addAdminBlocker, adminLogin, cancelAdminBooking, getAdminBarbers, getAdminBlockers, getAdminBookings, updateAdminBooking } from '@/app/actions/admin'
import { AdminBookingEditor, type AdminBooking } from '@/components/admin-booking-editor'
import { AdminCalendar } from '@/components/admin-calendar'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [barbers, setBarbers] = useState<{ id: number; name: string; role: string }[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null)
  const [logged, setLogged] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [editing, setEditing] = useState<AdminBooking | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function loadBookings() {
    const [confirmed, blockers, activeBarbers] = await Promise.all([getAdminBookings(), getAdminBlockers(), getAdminBarbers()])
    setBookings([...confirmed, ...blockers])
    setBarbers(activeBarbers)
  }

  async function addBlocker(date: string, time: string) {
    const description = window.prompt('Descrição do bloqueio')
    const duration = Number(window.prompt('Duração em minutos (30, 60, 90...)', '60'))
    if (!description || !duration) return

    const barberId = selectedBarberId ?? Number(window.prompt('ID do barbeiro', String(barbers[0]?.id ?? '')))
    if (!barberId) return

    try {
      await addAdminBlocker({ barberId, date, time, duration, description })
      await loadBookings()
    } catch {
      setError('Não foi possível adicionar o bloqueio.')
    }
  }

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    const result = await adminLogin(password)
    if (result.success) {
      setLogged(true)
      await loadBookings()
      return
    }

    setError(result.error ?? 'Não foi possível iniciar sessão.')
  }

  async function cancel(id: number) {
    const result = await cancelAdminBooking(id)
    if (!result.success) {
      setError(result.error ?? 'Não foi possível concluir a operação.')
      return
    }

    setEditing(null)
    await loadBookings()
    setError('')
  }

  async function saveBooking(item: AdminBooking, input: { date: string; time: string; name: string; email: string; phone: string }) {
    setSaving(true)
    const result = await updateAdminBooking(item.id, input)
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Não foi possível concluir a operação.')
      return
    }

    setEditing(null)
    await loadBookings()
    setError('')
  }

  async function moveBooking(item: AdminBooking, date: string, time: string) {
    if (item.kind === 'blocker') return
    const result = await updateAdminBooking(item.id, { date, time, name: item.name, email: item.email, phone: item.phone })
    if (!result.success) {
      setError(result.error ?? 'Não foi possível concluir a operação.')
      await loadBookings()
      return
    }

    await loadBookings()
    setError('')
  }

  if (!logged) {
    const formMarkup = (
      <main suppressHydrationWarning className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
        <p className="text-sm uppercase tracking-widest text-primary">RBrito Studio</p>
        <h1 className="font-serif text-5xl uppercase">Painel admin</h1>
        <form onSubmit={login} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            Password
            <input autoFocus={!mounted ? false : true} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 rounded-sm border border-input bg-background px-4 py-3 text-base" />
          </label>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <button className="min-h-12 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Entrar</button>
        </form>
      </main>
    )

    if (!mounted) {
      return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
          <p className="text-sm uppercase tracking-widest text-primary">RBrito Studio</p>
          <h1 className="font-serif text-5xl uppercase">Painel admin</h1>
          <div className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-muted-foreground">A preparar o painel...</div>
        </main>
      )
    }

    return formMarkup
  }

  return (
    <main suppressHydrationWarning className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-16">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-primary">Gestão de agenda</p>
          <h1 className="font-serif text-5xl uppercase">Marcações</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Arraste uma marcação para mudar o dia e a hora. Clique para editar os detalhes ou cancelar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => window.alert('Botão temporário')} className="min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Botão temporário
          </button>
          <button onClick={loadBookings} className="flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
            <span aria-hidden>↻</span> Atualizar
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mb-5 text-sm text-destructive">{error}</p>}

      <AdminCalendar
        bookings={bookings}
        barbers={barbers}
        selectedBarberId={selectedBarberId}
        onBarberChange={setSelectedBarberId}
        onEdit={(item) => { if (item.kind === 'blocker') return; setEditing(item) }}
        onMove={moveBooking}
        onCancel={cancel}
        onAddBlocker={addBlocker}
      />

      {editing && (
        <AdminBookingEditor
          booking={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={(input) => saveBooking(editing, input)}
          onCancelBooking={() => cancel(editing.id)}
        />
      )}
    </main>
  )
}
