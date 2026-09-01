import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { site } from '@/lib/site'

const works = [
  { src: '/works/work-fade.png', title: 'Skin Fade', tag: 'Corte', span: 'md:col-span-2 md:row-span-2' },
  { src: '/works/work-beard.png', title: 'Desenho de Barba', tag: 'Barba', span: '' },
  { src: '/works/work-classic.png', title: 'Clássico Pompadour', tag: 'Corte', span: '' },
  { src: '/works/work-shave.png', title: 'Barbear com Toalha Quente', tag: 'Ritual', span: 'md:col-span-2' },
  { src: '/works/work-textured.png', title: 'Textured Crop', tag: 'Corte', span: '' },
  { src: '/works/work-tools.png', title: 'Ferramentas de Ofício', tag: 'Detalhe', span: '' },
]

export function Works() {
  return (
    <section id="trabalhos" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Trabalhos
            </p>
            <h2 className="mt-4 text-balance font-serif text-4xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-5xl">
              O detalhe fala por nós
            </h2>
          </div>
          <a
            href={site.bookingUrl}
            className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-foreground transition-colors hover:text-primary"
          >
            Quero o meu corte
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <div className="mt-12 grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:auto-rows-[240px]">
          {works.map((work) => (
            <figure
              key={work.title}
              className={`group relative overflow-hidden rounded-xl border border-border ${work.span}`}
            >
              <Image
                src={work.src || '/placeholder.svg'}
                alt={work.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-5">
                <span className="font-serif text-lg font-semibold uppercase tracking-wide text-foreground">
                  {work.title}
                </span>
                <span className="shrink-0 rounded-full border border-primary/40 bg-background/50 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary backdrop-blur-sm">
                  {work.tag}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
