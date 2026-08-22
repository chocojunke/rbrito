import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BookingFlow } from '@/components/booking-flow'
import { ensureBookingSchema, getBarbers, getServices } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function BookingPage() {
  await ensureBookingSchema()
  const [barbers, services] = await Promise.all([getBarbers(), getServices()])
  return (
    <main className="min-h-screen bg-background px-5 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-16 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar ao estúdio
        </Link>
        <BookingFlow barbers={barbers} services={services} />
      </div>
    </main>
  )
}
