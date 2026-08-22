import { Scissors } from 'lucide-react'
import { site } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <div className="flex items-center gap-2.5">
          <Scissors className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-serif text-lg font-semibold uppercase tracking-[0.2em] text-foreground">
            {site.name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {site.address.line1}, {site.address.line2}
        </p>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
