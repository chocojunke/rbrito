'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, Euro, Scissors, UserRound } from 'lucide-react'
import { loadAvailableSlots, submitBooking } from '@/app/actions/booking'
import { formatDuration, formatPrice, type Barber, type Service } from '@/lib/booking-types'

type Props = { barbers: Barber[]; services: Service[] }
type Slot = { date: string; time: string; endTime: string }

export function BookingFlow({ barbers, services }: Props) {
  const [step, setStep] = useState(1)
  const [barberId, setBarberId] = useState<number | null>(null)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const selectedService = services.find((service) => service.id === serviceId)

  useEffect(() => {
    if (!barberId || !serviceId) return
    const from = new Date().toISOString().slice(0, 10)
    const toDate = new Date(); toDate.setDate(toDate.getDate() + 14)
    setLoading(true); setError('')
    loadAvailableSlots(barberId, serviceId, from, toDate.toISOString().slice(0, 10))
      .then(setSlots).catch(() => setError('Não foi possível carregar as vagas.')).finally(() => setLoading(false))
  }, [barberId, serviceId])

  const days = useMemo(() => Array.from(new Set(slots.map((slot) => slot.date))), [slots])
  const labelDate = (value: string) => new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`))
  const canNext = step === 1 ? barberId !== null : step === 2 ? serviceId !== null : step === 3 ? selected !== null : true

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!barberId || !serviceId || !selected) return
    setLoading(true); setError('')
    const result = await submitBooking({ barberId, serviceId, date: selected.date, time: selected.time, ...customer })
    if ('success' in result) setSuccess(true); else setError(result.error)
    setLoading(false)
  }

  if (success) return <div className="flex flex-col items-center gap-5 py-16 text-center"><span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check aria-hidden="true" /></span><h2 className="font-serif text-4xl uppercase">Marcação confirmada</h2><p className="max-w-md text-muted-foreground">Obrigado, {customer.name}. Enviámos os detalhes da sua sessão para {customer.email}.</p><a href="/" className="mt-3 rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-secondary">Voltar ao estúdio</a></div>

  return <div className="mx-auto max-w-3xl">
    <div className="mb-10 flex items-center justify-between border-b border-border pb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><span className={step >= 1 ? 'text-primary' : ''}>01 Barbeiro</span><span className={step >= 2 ? 'text-primary' : ''}>02 Serviço</span><span className={step >= 3 ? 'text-primary' : ''}>03 Horário</span><span className={step >= 4 ? 'text-primary' : ''}>04 Dados</span></div>
    {step === 1 && <section><div className="mb-7"><p className="mb-2 text-sm uppercase tracking-widest text-primary">Passo 01</p><h1 className="font-serif text-4xl uppercase md:text-5xl">Escolha o barbeiro</h1></div><div className="grid gap-3 sm:grid-cols-2">{barbers.map((barber) => <button key={barber.id} type="button" onClick={() => setBarberId(barber.id)} className={`flex items-center justify-between rounded-sm border p-5 text-left transition-colors ${barberId === barber.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}><span><strong className="block text-lg">{barber.name}</strong><span className="text-sm text-muted-foreground">{barber.role}</span></span><UserRound className="text-primary" aria-hidden="true" /></button>)}</div></section>}
    {step === 2 && <section><div className="mb-7"><p className="mb-2 text-sm uppercase tracking-widest text-primary">Passo 02</p><h1 className="font-serif text-4xl uppercase md:text-5xl">Escolha o serviço</h1></div><div className="flex flex-col gap-3">{services.map((service) => <button key={service.id} type="button" onClick={() => setServiceId(service.id)} className={`flex items-center justify-between gap-4 rounded-sm border p-5 text-left transition-colors ${serviceId === service.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}><span><strong className="block text-lg">{service.name}</strong><span className="mt-1 block text-sm text-muted-foreground">{service.description}</span><span className="mt-3 flex gap-4 text-xs uppercase tracking-wider text-primary"><span className="flex items-center gap-1"><Clock3 size={14} />{formatDuration(service.durationMinutes)}</span><span className="flex items-center gap-1"><Euro size={14} />{formatPrice(service.priceCents)}</span></span></span><Scissors className="shrink-0 text-primary" aria-hidden="true" /></button>)}</div></section>}
    {step === 3 && <section><div className="mb-7"><p className="mb-2 text-sm uppercase tracking-widest text-primary">Passo 03</p><h1 className="font-serif text-4xl uppercase md:text-5xl">Escolha o horário</h1><p className="mt-3 text-muted-foreground">Vagas disponíveis nos próximos 14 dias.</p></div>{loading && <p className="text-muted-foreground">A consultar disponibilidade...</p>}{!loading && days.length === 0 && <p className="rounded-sm border border-border p-5 text-muted-foreground">Não existem vagas disponíveis para esta combinação.</p>}<div className="flex flex-col gap-6">{days.map((day) => <div key={day}><h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{labelDate(day)}</h3><div className="flex flex-wrap gap-2">{slots.filter((slot) => slot.date === day).map((slot) => <button key={`${slot.date}-${slot.time}`} type="button" onClick={() => setSelected(slot)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${selected?.date === slot.date && selected.time === slot.time ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}>{slot.time}</button>)}</div></div>)}</div></section>}
    {step === 4 && <section><div className="mb-7"><p className="mb-2 text-sm uppercase tracking-widest text-primary">Passo 04</p><h1 className="font-serif text-4xl uppercase md:text-5xl">Os seus dados</h1><p className="mt-3 text-muted-foreground">{selectedService?.name} · {selected?.date && labelDate(selected.date)} às {selected?.time}</p></div><form onSubmit={handleSubmit} className="flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-semibold">Nome<input required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="rounded-sm border border-input bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="O seu nome" /></label><label className="flex flex-col gap-2 text-sm font-semibold">Email<input required type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="rounded-sm border border-input bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="nome@email.com" /></label><label className="flex flex-col gap-2 text-sm font-semibold">Contacto<input required type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="rounded-sm border border-input bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="+351 900 000 000" /></label><p className="text-xs text-muted-foreground">Os seus dados são usados apenas para gerir esta marcação.</p></form></section>}
    {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
    <div className="mt-10 flex justify-between gap-3"><button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold uppercase tracking-wider disabled:opacity-30"><ArrowLeft size={16} />Anterior</button>{step < 4 ? <button type="button" onClick={() => setStep(step + 1)} disabled={!canNext || loading} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-40">Continuar<ArrowRight size={16} /></button> : <button type="button" onClick={() => document.querySelector('form')?.requestSubmit()} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-40">{loading ? 'A confirmar...' : 'Confirmar marcação'}<Check size={16} /></button>}</div>
  </div>
}
