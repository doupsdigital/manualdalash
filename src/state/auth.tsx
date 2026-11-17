import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { identify, resetIdentity } from '../lib/analytics'

export const NO_PURCHASE_MSG =
  'Não encontramos uma compra com este e-mail. Use o mesmo e-mail que você usou na compra.'

type Status =
  | 'local' // sem Supabase configurado (desenvolvimento)
  | 'loading'
  | 'signedOut'
  | 'ready'

interface Auth {
  status: Status
  user: User | null
  /** Primeiro nome da compradora, vindo do checkout (user_metadata.full_name). Null se não houver. */
  firstName: string | null
  /** Mensagem mostrada na tela de login (ex.: acesso revogado). */
  notice: string | null
  clearNotice: () => void
  requestLink: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>
  verifyCode: (email: string, code: string) => Promise<{ ok: true } | { ok: false; message: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

const FRIENDLY: Record<string, string> = {
  no_purchase: NO_PURCHASE_MSG,
  invalid_email: 'Confira o e-mail digitado.',
  rate_limit: 'Já enviamos um link há pouco. Espere um minuto e tente de novo.',
  server: 'Não conseguimos enviar o link agora. Tente de novo em instantes.',
}

/** Confere no banco se a compra do manual continua ativa. Sem internet, deixa entrar. */
async function checkAccess(): Promise<boolean> {
  if (!supabase) return true
  const { data, error } = await supabase.rpc('has_access')
  if (error) {
    console.warn('has_access', error)
    return true
  }
  return data === true
}

function firstNameOf(user: User | null): string | null {
  const full = user?.user_metadata?.full_name as string | undefined
  if (!full) return null
  return full.trim().split(/\s+/)[0] || null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(supabase ? 'loading' : 'local')
  const [user, setUser] = useState<User | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let alive = true

    const apply = async (session: Session | null) => {
      if (!session) {
        if (!alive) return
        setUser(null)
        setStatus('signedOut')
        return
      }
      const allowed = await checkAccess()
      if (!alive) return
      if (!allowed) {
        await supabase!.auth.signOut()
        setNotice(NO_PURCHASE_MSG)
        setUser(null)
        setStatus('signedOut')
        return
      }
      setUser(session.user)
      setStatus('ready')
      identify(session.user.id)
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Só reage a entrada/saída; renovação de token não precisa reconferir
      if (event === 'SIGNED_OUT') resetIdentity()
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // fora do callback, como recomenda o supabase-js
        setTimeout(() => apply(session), 0)
      }
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const requestLink: Auth['requestLink'] = useCallback(async (email) => {
    if (!supabase) return { ok: false, message: FRIENDLY.server }
    const { data, error } = await supabase.functions.invoke('request-login', {
      body: { email, redirectTo: window.location.origin + '/' },
    })
    if (error) {
      // Respostas 4xx/5xx chegam aqui; tenta ler o motivo
      let reason = 'server'
      try {
        const ctx = (error as { context?: Response }).context
        const b = ctx ? await ctx.json() : null
        if (b?.reason) reason = b.reason
      } catch {
        // mantém 'server'
      }
      return { ok: false, message: FRIENDLY[reason] ?? FRIENDLY.server }
    }
    if (data?.ok) return { ok: true }
    return { ok: false, message: FRIENDLY[data?.reason] ?? FRIENDLY.server }
  }, [])

  const verifyCode: Auth['verifyCode'] = useCallback(async (email, code) => {
    if (!supabase) return { ok: false, message: FRIENDLY.server }
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) return { ok: false, message: 'Código inválido ou vencido. Confira o e-mail ou peça um novo link.' }
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        firstName: firstNameOf(user),
        notice,
        clearNotice: () => setNotice(null),
        requestLink,
        verifyCode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const a = useContext(AuthContext)
  if (!a) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return a
}
