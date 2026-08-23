'use client'

import { useEffect, useState } from 'react'
import { Scissors, Menu, X } from 'lucide-react'
import { AccountButton } from '@/components/account-button'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Estúdio', href: '#estudio' },
  { label: 'Trabalhos', href: '#trabalhos' },
  { label: 'Localização', href: '#localizacao' },
  { label: 'Contactos', href: '#contactos' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled || open
          ? 'border-b border-border bg-background/85 backdrop-blur-md'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <Scissors className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-serif text-lg font-semibold uppercase tracking-[0.2em] text-foreground">
            RBrito
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Principal">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <AccountButton />
          </div>
          <a
            href={site.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 md:inline-block"
          >
            Marcar
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-background px-5 py-4 md:hidden"
          aria-label="Menu móvel"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-sm font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <AccountButton />
            </li>
            <li className="pt-2">
              <a
                href={site.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold uppercase tracking-widest text-primary-foreground"
              >
                Marcar sessão
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
