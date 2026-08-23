'use client'
import { useState } from 'react'
import { adminLogin, cancelAdminBooking, getAdminBookings, updateAdminBooking } from '@/app/actions/admin'

type Booking = { id:number; date:string; time:string; name:string; email:string; phone:string; status:string; service:string; barber:string }

export default function AdminPage() {
  const [password,setPassword]=useState('')
  const [bookings,setBookings]=useState<Booking[]>([])
  const [logged,setLogged]=useState(false)
  const [error,setError]=useState('')

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const result = await adminLogin(password)
    if (!result.success) {
      setError(result.error)
      return
    }

    try {
      setLogged(true)
      setBookings(await getAdminBookings())
    } catch (requestError) {
      setLogged(false)
      const message = requestError instanceof Error ? requestError.message : 'Erro ao carregar as marcações.'
      setError(message)
    }
  }

  async function cancel(id:number) {
    const result = await cancelAdminBooking(id)
    if (!result.success) {
      setError(result.error)
      return
    }

    try {
      setBookings(await getAdminBookings())
      setError('')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Erro ao carregar as marcações.'
      setError(message)
    }
  }

  async function edit(item:Booking) {
    const date = window.prompt('Data (AAAA-MM-DD)', item.date)
    const time = window.prompt('Hora (HH:MM)', item.time)
    if (!date || !time) return

    const result = await updateAdminBooking(item.id, date, time)
    if (!result.success) {
      setError(result.error)
      return
    }

    try {
      setBookings(await getAdminBookings())
      setError('')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Erro ao carregar as marcações.'
      setError(message)
    }
  }

  if (!logged) return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6"><p className="text-sm uppercase tracking-widest text-primary">RBrito Studio</p><h1 className="font-serif text-5xl uppercase">Painel admin</h1><form onSubmit={login} className="flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="rounded-sm border border-input bg-background px-4 py-3" /></label>{error&&<p role="alert" className="text-destructive">{error}</p>}<button className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Entrar</button></form></main>

  return <main className="mx-auto max-w-6xl px-6 py-16"><div className="mb-10 flex items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-widest text-primary">Gestão de agenda</p><h1 className="font-serif text-5xl uppercase">Marcações</h1></div><button onClick={()=>location.reload()} className="rounded-full border border-border px-4 py-2 text-sm">Atualizar</button></div>{error&&<p role="alert" className="mb-6 text-destructive">{error}</p>}<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{bookings.map(item=><article key={item.id} className="rounded-sm border border-border p-5"><div className="mb-4 flex justify-between"><strong className="text-primary">{item.date} · {item.time}</strong><span className={item.status==='cancelled'?'text-destructive':'text-primary'}>{item.status==='cancelled'?'Cancelada':'Confirmada'}</span></div><h2 className="text-xl">{item.name}</h2><p className="text-sm text-muted-foreground">{item.service} · {item.barber}</p><p className="mt-3 text-sm">{item.email}<br/>{item.phone}</p>{item.status==='confirmed'&&<div className="mt-5 flex gap-2"><button onClick={()=>edit(item)} className="rounded-full border border-border px-3 py-2 text-xs">Editar</button><button onClick={()=>cancel(item.id)} className="rounded-full border border-destructive px-3 py-2 text-xs text-destructive">Cancelar</button></div>}</article>)}{!bookings.length&&<p className="text-muted-foreground">Sem marcações futuras.</p>}</div></main>
}
