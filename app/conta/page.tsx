import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MyBookingsSection } from '@/components/my-bookings-section'

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/')
  const result = await pool.query(`SELECT b.id, b.appointment_date AS date, b.start_time AS time, s.name AS service, br.name AS barber FROM bookings b JOIN services s ON s.id = b.service_id JOIN barbers br ON br.id = b.barber_id WHERE lower(b.customer_email) = lower($1) AND b.customer_phone IS NOT NULL AND b.status = 'confirmed' AND b.appointment_date >= CURRENT_DATE ORDER BY b.appointment_date, b.start_time`, [session.user.email])
  return <main className="mx-auto min-h-screen max-w-3xl px-5 pb-20 pt-32"><p className="mb-2 text-sm uppercase tracking-widest text-primary">A sua conta</p><h1 className="font-serif text-4xl uppercase md:text-5xl">Olá, {session.user.name}</h1><p className="mt-3 text-muted-foreground">As suas marcações futuras aparecem aqui quando o email e o contacto coincidem.</p><MyBookingsSection initialBookings={result.rows} allowCancel={false} /></main>
}
