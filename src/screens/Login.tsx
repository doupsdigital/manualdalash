import { useState } from 'react'
import { Screen, PrimaryButton } from '../components/ui'
import { useAuth } from '../state/auth'
import { SUPPORT_EMAIL } from '../lib/config'

// password: tela principal (e-mail + senha do e-mail de boas-vindas).
// email → code: "Esqueci minha senha", entra com um código por e-mail.
type Step = 'password' | 'email' | 'code'

// Lembra que o código já foi pedido (e para qual e-mail) por 1 hora, o mesmo prazo do código.
// Assim, quem abre o app pelo Gmail, volta para a caixa de entrada para ler o código e depois abre
// o link de novo cai direto na tela do código, sem digitar o e-mail nem pedir outro código.
const PENDING_KEY = 'manual-lash:login-pending:v1'
const PENDING_MS = 60 * 60 * 1000

function readPending(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as { email?: string; at?: number }
    if (!p.email || !p.at || Date.now() - p.at > PENDING_MS) return null
    return p.email
  } catch {
    return null
  }
}

function savePending(email: string | null) {
  try {
    if (email) localStorage.setItem(PENDING_KEY, JSON.stringify({ email, at: Date.now() }))
    else localStorage.removeItem(PENDING_KEY)
  } catch {
    // Sem localStorage (modo privado etc.): só não lembra.
  }
}

export default function Login() {
  const { requestLink, verifyCode, signInWithPassword, notice, clearNotice } = useAuth()
  const [pendingEmail] = useState(readPending)
  const [step, setStep] = useState<Step>(pendingEmail ? 'code' : 'password')
  const [email, setEmail] = useState(pendingEmail ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resent, setResent] = useState(false)
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(notice)

  const sendCode = async () => {
    setError(null)
    clearNotice()
    setSending(true)
    const clean = email.trim().toLowerCase()
    const result = await requestLink(clean)
    setSending(false)
    if (result.ok) {
      savePending(clean)
      setStep('code')
    } else {
      setError(result.message)
    }
  }

  const enterWithPassword = async () => {
    if (!email.trim() || !password.trim()) return
    setError(null)
    clearNotice()
    setSending(true)
    const result = await signInWithPassword(email.trim().toLowerCase(), password)
    setSending(false)
    if (!result.ok) setError(result.message)
  }

  const goTo = (next: Step) => {
    savePending(null)
    setStep(next)
    setCode('')
    setError(null)
    setResent(false)
  }

  const enter = async () => {
    if (code.length < 8) return
    setError(null)
    setSending(true)
    const result = await verifyCode(email.trim().toLowerCase(), code)
    setSending(false)
    if (result.ok) savePending(null)
    else setError(result.message)
  }

  const resend = async () => {
    setError(null)
    setSending(true)
    const result = await requestLink(email.trim().toLowerCase())
    setSending(false)
    if (result.ok) {
      savePending(email.trim().toLowerCase())
      setCode('')
      setResent(true)
    } else {
      setError(result.message)
    }
  }

  const boxes = Array.from({ length: 8 }, (_, i) => ({
    digit: code[i] ?? '',
    active: i === code.length,
  }))

  return (
    <Screen className="flex flex-col px-7 pt-[72px] pb-10">
      <div
        className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] border border-white/20"
        style={{ background: 'linear-gradient(135deg,#5B2A4E,#7A3A66)', color: '#E8C27E' }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 15c3.5-5 14.5-5 18 0" />
          <path d="M5 12.5 3.5 9.5M9 11 8 7.5M12 10.5v-4M15 11l1-3.5M19 12.5l1.5-3" />
        </svg>
      </div>
      <div className="mt-7 font-display text-[36px] leading-[1.1] font-medium">
        Manual da <span className="text-rose">Lash Designer</span>
      </div>

      {step === 'password' ? (
        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            enterWithPassword()
          }}
        >
          <div className="mt-3 text-[16px] leading-snug text-white/85">
            Entre com o e-mail da compra e a senha que enviamos no e-mail de boas-vindas.
          </div>
          <label htmlFor="login-email" className="mt-9 text-[13px] font-semibold tracking-wide text-white/60 uppercase">
            Seu e-mail
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="mt-2 h-14 rounded-[18px] border border-white/20 bg-white/[0.08] px-[18px] text-[17px] font-medium text-white outline-none"
          />
          <label htmlFor="login-senha" className="mt-5 text-[13px] font-semibold tracking-wide text-white/60 uppercase">
            Senha
          </label>
          <div className="relative mt-2">
            <input
              id="login-senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ex.: bruna4827"
              className="h-14 w-full rounded-[18px] border border-white/20 bg-white/[0.08] pr-[84px] pl-[18px] text-[17px] font-medium text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-2 h-10 -translate-y-1/2 rounded-full px-3 text-[13px] font-semibold text-white/70"
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {error && (
            <div className="mt-3 text-[14px] leading-snug text-rose">
              {error}{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                Falar com o suporte
              </a>
            </div>
          )}
          <PrimaryButton type="submit" disabled={sending || !email.trim() || !password.trim()} className="mt-6">
            {sending ? 'Entrando…' : 'Entrar'}
          </PrimaryButton>
          <button type="button" onClick={() => goTo('email')} className="mt-2 h-11 text-[14px] font-semibold text-white/70">
            Esqueci minha senha
          </button>
        </form>
      ) : step === 'email' ? (
        <>
          <div className="mt-3 text-[16px] leading-snug text-white/85">
            Esqueceu a senha? Digite o e-mail da compra e enviamos um código para você entrar.
          </div>
          <label className="mt-9 text-[13px] font-semibold tracking-wide text-white/60 uppercase">Seu e-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="mt-2 h-14 rounded-[18px] border border-white/20 bg-white/[0.08] px-[18px] text-[17px] font-medium text-white outline-none"
          />
          {error && (
            <div className="mt-3 text-[14px] leading-snug text-rose">
              {error}{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                Falar com o suporte
              </a>
            </div>
          )}
          <PrimaryButton onClick={sendCode} disabled={sending || !email.trim()} className="mt-5">
            {sending ? 'Enviando…' : 'Receber código'}
          </PrimaryButton>
          <button type="button" onClick={() => goTo('password')} className="mt-2 h-11 text-[13px] text-white/60">
            Voltar e entrar com a senha
          </button>
        </>
      ) : (
        <>
          <div className="mt-3 text-[16px] leading-snug text-white/85">
            Enviamos um código de 8 dígitos para <b className="text-white">{email}</b>.
          </div>
          <div className="mt-3 rounded-[16px] bg-white/[0.08] px-4 py-3 text-[14px] leading-snug text-white/80">
            O código aparece no <b className="text-white">assunto do e-mail</b>. Se preferir, abra o e-mail e toque em{' '}
            <b className="text-white">Entrar no Manual</b> para entrar direto.
            {resent && <span className="mt-1.5 block font-semibold text-gold">Enviamos um código novo.</span>}
          </div>
          <label className="mt-9 text-[13px] font-semibold tracking-wide text-white/60 uppercase">Código</label>
          <div className="relative mt-2.5">
            <div className="grid grid-cols-8 gap-1.5">
              {boxes.map((b, i) => (
                <div
                  key={i}
                  className="flex h-[54px] items-center justify-center rounded-[14px] border bg-white/[0.08] text-[22px] font-bold"
                  style={{ borderColor: b.active ? '#E07A9B' : 'rgba(255,255,255,.22)' }}
                >
                  {b.digit}
                </div>
              ))}
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              inputMode="numeric"
              maxLength={8}
              autoFocus
              aria-label="Código de 8 dígitos"
              className="absolute inset-0 h-full w-full cursor-text text-[16px] opacity-0"
            />
          </div>
          {error && (
            <div className="mt-3 text-[14px] leading-snug text-rose">
              {error}{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                Falar com o suporte
              </a>
            </div>
          )}
          <PrimaryButton onClick={enter} disabled={sending || code.length < 8} className="mt-6">
            {sending ? 'Entrando…' : 'Entrar'}
          </PrimaryButton>
          <div className="mt-2 flex justify-center gap-5">
            <button onClick={resend} disabled={sending} className="h-11 text-[13px] text-white/60">
              Reenviar código
            </button>
            <button onClick={() => goTo('password')} className="h-11 text-[13px] text-white/60">
              Entrar com a senha
            </button>
          </div>
        </>
      )}
    </Screen>
  )
}
