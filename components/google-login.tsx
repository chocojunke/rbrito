'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from '@/lib/auth-client'

type GoogleLoginProps = {
  callbackURL?: string
  onBeforeSignIn?: () => void
}

export function GoogleLogin({ callbackURL = '/', onBeforeSignIn }: GoogleLoginProps) {
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(false)

  if (isPending) return null
  if (session?.user) {
    return <button type="button" onClick={() => { void signOut() }} className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:bg-secondary">Sair</button>
  }

  return <button type="button" disabled={loading} onClick={async () => { onBeforeSignIn?.(); setLoading(true); await signIn.social({ provider: 'google', callbackURL }); setLoading(false) }} className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground hover:bg-secondary disabled:opacity-50">{loading ? 'A entrar...' : 'Entrar com Google'}</button>
}
