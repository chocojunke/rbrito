import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { About } from '@/components/about'
import { Works } from '@/components/works'
import { Location } from '@/components/location'
import { Contact } from '@/components/contact'
import { SiteFooter } from '@/components/site-footer'
import { BookingFlow } from '@/components/booking-flow'
import { ensureBookingSchema, getBarbers, getServices, pool } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ debugBookings?: string }>
}) {
  await ensureBookingSchema()
  const [barbers, services, session] = await Promise.all([
    getBarbers(),
    getServices(),
    auth.api.getSession({ headers: await headers() }),
  ])
  const params = await searchParams
  const debugBookings = process.env.NODE_ENV === 'development' && params.debugBookings === '1'
  const debugEmail = debugBookings
    ? (await pool.query(`SELECT customer_email FROM bookings WHERE status = 'confirmed' AND appointment_date >= CURRENT_DATE AND customer_phone IS NOT NULL ORDER BY appointment_date, start_time LIMIT 1`)).rows[0]?.customer_email
    : undefined
  const bookingEmail = session?.user?.email ?? debugEmail
  const bookings = bookingEmail
    ? (await pool.query(`SELECT b.id, b.appointment_date AS date, b.start_time AS time, s.name AS service, br.name AS barber FROM bookings b JOIN services s ON s.id = b.service_id JOIN barbers br ON br.id = b.barber_id WHERE lower(b.customer_email) = lower($1) AND b.customer_phone IS NOT NULL AND b.status = 'confirmed' AND b.appointment_date >= CURRENT_DATE ORDER BY b.appointment_date, b.start_time`, [bookingEmail])).rows
    : []

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <Works />
        <section id="booking" className="border-t border-border py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
                Marcação
              </p>
              <h2 className="mt-4 text-balance font-serif text-4xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-5xl">
                Agende a sua sessão
              </h2>
            </div>
            <BookingFlow barbers={barbers} services={services} />
          </div>
        </section>
        {(session?.user || debugBookings) && (
          <section id="agendamentos" className="border-t border-border py-16 md:py-20">
            <div className="mx-auto max-w-6xl px-5 md:px-8">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">A sua conta</p>
                  <h2 className="mt-3 text-balance font-serif text-3xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-4xl">Os meus agendamentos</h2>
                </div>
                <a href="/conta" className="text-sm font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">Ver todos</a>
              </div>
              {bookings.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {bookings.map((booking) => (
                    <article key={booking.id} className="flex flex-wrap items-center justify-between gap-4 border border-border p-5">
                      <div>
                        <strong className="block text-base">{booking.service}</strong>
                        <span className="mt-1 block text-sm text-muted-foreground">{booking.barber}</span>
                      </div>
                      <time className="text-sm font-semibold" dateTime={`${booking.date}T${String(booking.time).slice(0, 5)}`}>
                        {new Date(booking.date).toLocaleDateString('pt-PT')} · {String(booking.time).slice(0, 5)}
                      </time>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border border-border p-5 text-muted-foreground">
                  Ainda não tem agendamentos futuros confirmados.
                </div>
              )}
            </div>
          </section>
        )}
        <Location />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
