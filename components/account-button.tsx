'use client'

import { LogIn, LogOut, UserRound } from 'lucide-react'
import { signIn, signOut, useSession } from 'next-auth/react'

export function AccountButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') return null

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: window.location.href })}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Entrar com Google
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: window.location.origin })}
      className="inline-flex max-w-44 items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary"
      title="Terminar sessão"
    >
      <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{session.user.name ?? session.user.email ?? 'Conta'}</span>
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
    </button>
  )
}