'use client'
import { useState } from 'react'
import { addNextMonthAvailability, adminLogin, cancelAdminBooking, getAdminBookings, updateAdminBooking } from '@/app/actions/admin'

type Booking = { id:number; date:string; time:string; name:string; email:string; phone:string; status:string; service:string; barber:string }
export default function AdminPage() {
  const [password,setPassword]=useState(''), [bookings,setBookings]=useState<Booking[]>([]), [logged,setLogged]=useState(false), [error,setError]=useState('')
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [addingAvailability, setAddingAvailability] = useState(false)
  async function login(e: React.FormEvent){e.preventDefault();const r=await adminLogin(password);if(r.success){setLogged(true);setBookings(await getAdminBookings())}else setError(r.error ?? 'Não foi possível iniciar sessão.') }
  async function cancel(id:number){await cancelAdminBooking(id);setBookings(await getAdminBookings())}
  async function addAvailability(){
    setAddingAvailability(true)
    setAvailabilityMessage('')
    try {
      const result = await addNextMonthAvailability()
      setAvailabilityMessage((result.added ?? 0) > 0 ? `Disponibilidade adicionada para a agenda recorrente (${result.added ?? 0} períodos).` : 'A disponibilidade já estava configurada.')
    } catch { setAvailabilityMessage('Não foi possível atualizar a disponibilidade.') }
    finally { setAddingAvailability(false) }
  }
  async function edit(item:Booking){const date=window.prompt('Data (AAAA-MM-DD)',item.date);const time=window.prompt('Hora (HH:MM)',item.time);if(date&&time){await updateAdminBooking(item.id,date,time);setBookings(await getAdminBookings())}}
  if(!logged)return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6"><p className="text-sm uppercase tracking-widest text-primary">RBrito Studio</p><h1 className="font-serif text-5xl uppercase">Painel admin</h1><form onSubmit={login} className="flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="rounded-sm border border-input bg-background px-4 py-3" /></label>{error&&<p role="alert" className="text-destructive">{error}</p>}<button className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Entrar</button></form></main>
  return <main className="mx-auto max-w-6xl px-6 py-16"><div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><p className="text-sm uppercase tracking-widest text-primary">Gestão de agenda</p><h1 className="font-serif text-5xl uppercase">Marcações</h1></div><div className="flex flex-wrap items-center gap-3"><button onClick={addAvailability} disabled={addingAvailability} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{addingAvailability ? 'A adicionar...' : 'Adicionar próximo mês'}</button><button onClick={()=>location.reload()} className="rounded-full border border-border px-4 py-2 text-sm">Atualizar</button></div></div>{availabilityMessage&&<p role="status" className="mb-6 text-sm text-primary">{availabilityMessage}</p>}<div className="mb-6 rounded-sm border border-border bg-card p-4 text-sm text-muted-foreground">O horário padrão é de segunda a sábado, das 09:00 às 18:00, em intervalos de 30 minutos. A disponibilidade é recorrente e será aplicada automaticamente ao próximo mês.</div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{bookings.map(item=><article key={item.id} className="rounded-sm border border-border p-5"><div className="mb-4 flex justify-between"><strong className="text-primary">{item.date} · {item.time}</strong><span className={item.status==='cancelled'?'text-destructive':'text-primary'}>{item.status==='cancelled'?'Cancelada':'Confirmada'}</span></div><h2 className="text-xl">{item.name}</h2><p className="text-sm text-muted-foreground">{item.service} · {item.barber}</p><p className="mt-3 text-sm">{item.email}<br/>{item.phone}</p>{item.status==='confirmed'&&<div className="mt-5 flex gap-2"><button onClick={()=>edit(item)} className="rounded-full border border-border px-3 py-2 text-xs">Editar</button><button onClick={()=>cancel(item.id)} className="rounded-full border border-destructive px-3 py-2 text-xs text-destructive">Cancelar</button></div>}</article>)}{!bookings.length&&<p className="text-muted-foreground">Sem marcações futuras.</p>}</div></main>
}
