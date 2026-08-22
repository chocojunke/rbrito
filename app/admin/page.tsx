'use client'

import { useState } from 'react'
import { addAdminBlocker, addNextMonthAvailability, adminLogin, cancelAdminBooking, getAdminBlockers, getAdminBookings, updateAdminBooking } from '@/app/actions/admin'
import { AdminCalendar } from '@/components/admin-calendar'

type Booking = { id: number; date: string; time: string; name: string; email: string; phone: string; status: string; service: string; barber: string; duration: number }

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [logged, setLogged] = useState(false)
  const [error, setError] = useState('')
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [addingAvailability, setAddingAvailability] = useState(false)

  async function loadBookings() { const [confirmed, blockers] = await Promise.all([getAdminBookings(), getAdminBlockers()]); setBookings([...confirmed, ...blockers]) }
  async function addBlocker(date: string, time: string) { const description = window.prompt('Descrição do bloqueio'); const duration = Number(window.prompt('Duração em minutos (30, 60, 90...)', '60')); if (!description || !duration) return; const barberId = Number(window.prompt('ID do barbeiro', '1')); if (!barberId) return; try { await addAdminBlocker({ barberId, date, time, duration, description }); await loadBookings() } catch { setError('Não foi possível adicionar o bloqueio.') } }
  async function login(event: React.FormEvent) { event.preventDefault(); setError(''); const result = await adminLogin(password); if (result.success) { setLogged(true); await loadBookings() } else setError(result.error ?? 'Não foi possível iniciar sessão.') }
  async function cancel(id: number) { await cancelAdminBooking(id); await loadBookings() }
  async function edit(item: Booking) { const date = window.prompt('Data (AAAA-MM-DD)', item.date); const time = window.prompt('Hora (HH:MM)', item.time); if (date && time) { await updateAdminBooking(item.id, date, time); await loadBookings() } }
  async function addAvailability() { setAddingAvailability(true); setAvailabilityMessage(''); try { const result = await addNextMonthAvailability(); setAvailabilityMessage((result.added ?? 0) > 0 ? `Disponibilidade adicionada (${result.added ?? 0} períodos).` : 'A disponibilidade já estava configurada.') } catch { setAvailabilityMessage('Não foi possível atualizar a disponibilidade.') } finally { setAddingAvailability(false) } }

  if (!logged) return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6"><p className="text-sm uppercase tracking-widest text-primary">RBrito Studio</p><h1 className="font-serif text-5xl uppercase">Painel admin</h1><form onSubmit={login} className="flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm">Password<input autoFocus type="password" value={password} onChange={event => setPassword(event.target.value)} className="min-h-12 rounded-sm border border-input bg-background px-4 py-3 text-base" /></label>{error && <p role="alert" className="text-destructive">{error}</p>}<button className="min-h-12 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Entrar</button></form></main>

  return <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-16"><div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><p className="text-sm uppercase tracking-widest text-primary">Gestão de agenda</p><h1 className="font-serif text-5xl uppercase">Marcações</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Uma vista semanal com cada marcação posicionada na hora respetiva e dimensionada de acordo com a duração do serviço.</p></div><div className="flex flex-wrap items-center gap-3"><button onClick={addAvailability} disabled={addingAvailability} className="min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{addingAvailability ? 'A adicionar...' : 'Adicionar próximo mês'}</button><button onClick={loadBookings} className="flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><span aria-hidden>↻</span> Atualizar</button></div></div>{availabilityMessage && <p role="status" className="mb-5 text-sm text-primary">{availabilityMessage}</p>}<AdminCalendar bookings={bookings} onEdit={edit} onCancel={cancel} onAddBlocker={addBlocker} /></main>
}
