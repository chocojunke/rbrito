import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { About } from '@/components/about'
import { Works } from '@/components/works'
import { Location } from '@/components/location'
import { Contact } from '@/components/contact'
import { SiteFooter } from '@/components/site-footer'
import { BookingFlow } from '@/components/booking-flow'
import { ensureBookingSchema, getBarbers, getServices } from '@/lib/db'

export default async function Page() {
  await ensureBookingSchema()
  const [barbers, services] = await Promise.all([getBarbers(), getServices()])

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
        <Location />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
