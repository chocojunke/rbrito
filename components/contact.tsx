import { Phone, Mail, AtSign, ArrowUpRight } from 'lucide-react'
import { site } from '@/lib/site'

const channels = [
  { icon: Phone, label: 'Telefone', value: site.phone, href: site.phoneHref },
  { icon: Mail, label: 'Email', value: site.email, href: site.emailHref },
  {
    icon: AtSign,
    label: 'Instagram',
    value: site.instagram,
    href: site.instagramUrl,
    external: true,
  },
]

export function Contact() {
  return (
    <section id="contactos" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Contactos
            </p>
            <h2 className="mt-4 text-balance font-serif text-4xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-5xl">
              Falamos consigo
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Tem uma dúvida ou quer marcar a sua sessão? Escolha o canal que
              lhe for mais cómodo — respondemos com todo o gosto.
            </p>
            <a
              href={site.bookingUrl}
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
            >
              Marcar sessão
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          <div className="md:col-span-7">
            <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border">
              {channels.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    target={c.external ? '_blank' : undefined}
                    rel={c.external ? 'noopener noreferrer' : undefined}
                    className="group flex items-center gap-5 bg-card p-6 transition-colors hover:bg-secondary"
                  >
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-primary">
                      <c.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        {c.label}
                      </span>
                      <span className="block truncate text-lg font-medium text-card-foreground">
                        {c.value}
                      </span>
                    </span>
                    <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
