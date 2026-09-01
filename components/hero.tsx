import Image from 'next/image'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { site } from '@/lib/site'

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/works/hero-barbershop.png"
          alt="Interior da barbearia RBrito Studio durante um corte"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
      </div>

      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-32 md:px-8 md:pb-24">
        <p className="mb-5 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.25em] text-primary">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Barbearia em Lisboa
        </p>
        <h1 className="max-w-4xl text-balance font-serif text-5xl font-bold uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-8xl">
          RBrito Studio
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          Cortes de precisão, barba desenhada ao detalhe e um ambiente pensado
          para o homem que valoriza o cuidado bem feito.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={site.bookingUrl}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            Marcar sessão
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="#trabalhos"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary"
          >
            Ver trabalhos
          </a>
        </div>
      </div>
    </section>
  )
}
