'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, Euro, Scissors, UserRound } from 'lucide-react'
import { loadAvailableSlots, loadMyBookingPhone, submitBooking } from '@/app/actions/booking'
import { BookingDateTime, formatBookingDate } from '@/components/booking-datetime'
import { GoogleLogin } from '@/components/google-login'
import { formatDuration, formatPrice, type Barber, type Service } from '@/lib/booking-types'
import { useSession } from '@/lib/auth-client'

type Props = { barbers: Barber[]; services: Service[] }
type Slot = { date: string; time: string; endTime: string }

function lisbonDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`)
  date.setDate(date.getDate() + days)
  return lisbonDateKey(date)
}

function nextMonthStart(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  date.setMonth(date.getMonth() + 1, 1)
  return lisbonDateKey(date)
}

export function BookingFlow({ barbers, services }: Props) {
  const [step, setStep] = useState(1)
  const canVisitStep = (targetStep: number) => targetStep <= step
  const [barberId, setBarberId] = useState<number | null>(null)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const { data: session } = useSession()
  const selectedService = services.find((service) => service.id === serviceId)

  useEffect(() => {
    if (session?.user) {
      setCustomer((current) => ({ ...current, name: current.name || session.user.name, email: current.email || session.user.email }))
      void loadMyBookingPhone().then((phone) => {
        if (phone) setCustomer((current) => ({ ...current, phone: current.phone || phone }))
      })
      const saved = sessionStorage.getItem('rbrito-booking-state')
      if (saved) {
        try {
          const state = JSON.parse(saved) as { step?: number; barberId?: number; serviceId?: number; selected?: Slot | null; customer?: typeof customer }
          if (state.barberId && state.serviceId && state.selected) {
            setBarberId(state.barberId)
            setServiceId(state.serviceId)
            setSelected(state.selected)
            setCustomer((current) => ({ ...current, ...state.customer, name: state.customer?.name || session.user.name, email: state.customer?.email || session.user.email }))
            setStep(4)
          }
        } catch { /* Ignore stale booking state. */ }
        sessionStorage.removeItem('rbrito-booking-state')
      }
    }
  }, [session])

  function preserveBookingBeforeLogin() {
    sessionStorage.setItem('rbrito-booking-state', JSON.stringify({ step, barberId, serviceId, selected, customer }))
  }

  function goToNextStep() {
    setStep((current) => Math.min(4, current + 1))
  }

  useEffect(() => {
    if (!barberId || !serviceId) return
    let active = true
    const selectedBarberId = barberId
    const selectedServiceId = serviceId
    const tomorrow = addDays(lisbonDateKey(), 1)
    const lastDate = addDays(tomorrow, 364)

    setLoading(true)
    setError('')
    setSelected(null)

    async function loadAvailability() {
      setSlots([])

      async function loadRange(from: string, to: string) {
        if (!active) return
        try {
          const nextSlots = await loadAvailableSlots(selectedBarberId, selectedServiceId, from, to)
          if (!active) return
          setSlots((current) => [...current, ...nextSlots])
        } catch {
          if (active) setError('Não foi possível carregar as vagas.')
        }
      }

      await loadRange(tomorrow, tomorrow)
      if (!active) return
      setLoading(false)

      await loadRange(addDays(tomorrow, 1), addDays(tomorrow, 7))
      await loadRange(addDays(tomorrow, 8), addDays(tomorrow, 14))

      let monthFrom = addDays(tomorrow, 15)
      while (active && monthFrom <= lastDate) {
        const nextMonth = nextMonthStart(monthFrom)
        const monthTo = nextMonth <= lastDate ? addDays(nextMonth, -1) : lastDate
        await loadRange(monthFrom, monthTo)
        monthFrom = nextMonth
      }
    }

    void loadAvailability()
    return () => { active = false }
  }, [barberId, serviceId])

  function handleSlotSelect(slot: Slot | null) {
    setSelected(slot)
    if (slot) setStep(4)
  }

  const canNext = step === 1 ? barberId !== null : step === 2 ? serviceId !== null : step === 3 ? selected !== null : true

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!barberId || !serviceId || !selected) return
    setLoading(true); setError('')
    const result = await submitBooking({ barberId, serviceId, date: selected.date, time: selected.time, ...customer })
    if ('success' in result) setSuccess(true); else setError(result.error)
    setLoading(false)
  }

  if (success) return <div className="flex flex-col items-center gap-5 py-16 text-center"><span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check aria-hidden="true" /></span><h2 className="font-serif text-4xl uppercase">Marcação confirmada</h2><p className="max-w-md text-muted-foreground">Obrigado, {customer.name}. Enviámos os detalhes da sua sessão para {customer.email}.</p><a href="#booking" onClick={(event) => { event.preventDefault(); setSuccess(false); setStep(1); setBarberId(null); setServiceId(null); setSelected(null); setSlots([]); setError(''); window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`); requestAnimationFrame(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })) }} className="mt-3 rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-secondary">Voltar ao estúdio</a></div>

  return <div className="mx-auto max-w-3xl">
    <div className="mb-10 grid grid-cols-4 border-b border-border pb-5 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground" role="tablist" aria-label="Passos da marcação">{['01 Barbeiro', '02 Serviço', '03 Horário', '04 Dados'].map((label, index) => { const targetStep = index + 1; return <button key={label} type="button" role="tab" aria-selected={step === targetStep} disabled={!canVisitStep(targetStep)} onClick={() => setStep(targetStep)} className={`min-h-11 px-1 transition-colors ${step === targetStep ? 'text-primary' : canVisitStep(targetStep) ? 'text-foreground hover:text-primary' : 'cursor-not-allowed opacity-40'}`}>{label}</button> })}</div>
    {step === 1 && <section><div className="mb-7"><p className="mb-2 text-sm uppercase tracking-widest text-primary">Passo 01</p><h1 className="font-serif text-4xl uppercase md:text-5xl">Escolha o barbeiro</h1></div><div className="grid gap-3 sm:grid-cols-2">{barbers.map((barber) => <button key={barber.id} type="button" onClick={() => { setBarberId(barber.id); goToNextStep() }} className={`flex items-center justify-between rounded-sm border p-5 text-left transition-colors ${barberId === barber.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}><span><strong className="block text-lg">{barber.name}</strong><span className="text-sm text-muted-foreground">{barber.role}</span></span><UserRound className="text-primary" aria-hidden="true" /></button>)}</div></section>}
    {step === 2 && <section><div className="mb-7"><p className="mb-2 text-sm uppercase tracking-widest text-primary">Passo 02</p><h1 className="font-serif text-4xl uppercase md:text-5xl">Escolha o serviço</h1></div><div className="flex flex-col gap-3">{services.map((service) => <button key={service.id} type="button" onClick={() => { setServiceId(service.id); goToNextStep() }} className={`flex items-center justify-between gap-4 rounded-sm border p-5 text-left transition-colors ${serviceId === service.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}><span><strong className="block text-lg">{service.name}</strong><span className="mt-1 block text-sm text-muted-foreground">{service.description}</span><span className="mt-3 flex gap-4 text-xs uppercase tracking-wider text-primary"><span className="flex items-center gap-1"><Clock3 size={14} />{formatDuration(service.durationMinutes)}</span><span className="flex items-center gap-1"><Euro size={14} />{formatPrice(service.priceCents)}</span></span></span><Scissors className="shrink-0 text-primary" aria-hidden="true" /></button>)}</div></section>}
    {step === 3 && (
      <section>
        <div className="mb-7">
          <p className="mb-2 text-sm uppercase tracking-widest text-primary">Passo 03</p>
          <h1 className="font-serif text-4xl uppercase md:text-5xl">Escolha o horário</h1>
          <p className="mt-3 text-muted-foreground">Escolha o dia e depois o horário disponível.</p>
        </div>
        <BookingDateTime slots={slots} selected={selected} onSelect={handleSlotSelect} loading={loading} />
      </section>
    )}
    {step === 4 && <section><div className="mb-7"><p className="mb-2 text-sm uppercase tracking-widest text-primary">Passo 04</p><h1 className="font-serif text-4xl uppercase md:text-5xl">Os seus dados</h1><p className="mt-3 text-muted-foreground">{selectedService?.name} · {selected?.date && formatBookingDate(selected.date)} às {selected?.time}</p></div><div className="mb-6 flex flex-col gap-3 rounded-sm border border-border bg-secondary/30 p-4"><p className="text-sm text-muted-foreground">Já tem conta? Entre com Google para preencher os seus dados automaticamente.</p><GoogleLogin callbackURL="/#booking" onBeforeSignIn={preserveBookingBeforeLogin} /></div><form onSubmit={handleSubmit} className="flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-semibold">Nome<input required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="rounded-sm border border-input bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="O seu nome" /></label><label className="flex flex-col gap-2 text-sm font-semibold">Email<input required type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="rounded-sm border border-input bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="nome@email.com" /></label><label className="flex flex-col gap-2 text-sm font-semibold">Contacto<input required type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="rounded-sm border border-input bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="+351 900 000 000" /></label><p className="text-xs text-muted-foreground">Os seus dados são usados apenas para gerir esta marcação.</p></form></section>}
    {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85"><div className="mx-auto flex max-w-3xl justify-between gap-3 pb-[env(safe-area-inset-bottom)]"><button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold uppercase tracking-wider disabled:opacity-30"><ArrowLeft size={16} />Anterior</button>{step < 4 ? <button type="button" onClick={() => setStep(step + 1)} disabled={!canNext || loading} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-40">Continuar<ArrowRight size={16} /></button> : <button type="button" onClick={() => document.querySelector('form')?.requestSubmit()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-40">{loading ? 'A confirmar...' : 'Confirmar marcação'}<Check size={16} /></button>}</div></div><div className="h-24" aria-hidden="true" />
  </div>
}
