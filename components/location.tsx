import { MapPin, Navigation, Clock } from 'lucide-react'
import { site, mapsEmbedUrl, mapsLinkUrl } from '@/lib/site'

export function Location() {
  return (
    <section id="localizacao" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Localização
            </p>
            <h2 className="mt-4 text-balance font-serif text-4xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-5xl">
              Onde nos encontra
            </h2>

            <div className="mt-8 flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">{site.address.line1}</p>
                <p className="text-muted-foreground">{site.address.line2}</p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <ul className="space-y-1.5">
                {site.hours.map((h) => (
                  <li key={h.day} className="flex justify-between gap-6 text-sm">
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-medium text-foreground">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={mapsLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Abrir no Google Maps
            </a>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title={`Mapa da localização de ${site.name}`}
                src={mapsEmbedUrl}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full grayscale-[0.3] md:h-[440px]"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
