import { Scissors, Sparkles, Clock } from 'lucide-react'

const pillars = [
  {
    icon: Scissors,
    title: 'Corte à medida',
    description:
      'Cada corte começa por uma conversa. Estudamos o formato do rosto e o seu estilo de vida para chegar ao resultado certo.',
  },
  {
    icon: Sparkles,
    title: 'Barba & cuidados',
    description:
      'Desenho de barba, toalha quente e produtos de eleição para uma experiência que vai muito além do essencial.',
  },
  {
    icon: Clock,
    title: 'Sem pressas',
    description:
      'Marcações individuais e tempo dedicado a cada cliente. Aqui o detalhe é a regra, não a exceção.',
  },
]

export function About() {
  return (
    <section id="estudio" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              O Estúdio
            </p>
            <h2 className="mt-4 text-balance font-serif text-4xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-5xl">
              Barbearia com alma de ofício
            </h2>
          </div>
          <div className="md:col-span-7">
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              O RBrito Studio nasceu da ideia de que um bom corte é uma forma de
              cuidar de si próprio. Combinamos a tradição da barbearia clássica
              com técnicas contemporâneas, num espaço acolhedor onde cada
              pormenor foi pensado — da cadeira à música, do café à conversa.
            </p>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
              Mais do que um serviço, criamos um momento. Um ritual regular que
              o faz sair a sentir-se melhor e a parecer exatamente como quer.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="bg-card p-8">
              <pillar.icon className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="mt-5 font-serif text-xl font-semibold uppercase tracking-wide text-card-foreground">
                {pillar.title}
              </h3>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
