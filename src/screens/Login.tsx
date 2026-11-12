import { useState } from 'react'
import { Screen, PrimaryButton } from '../components/ui'
import { useAuth } from '../state/auth'
import { SUPPORT_EMAIL } from '../lib/config'

type Step = 'email' | 'code'

export default function Login() {
  const { requestLink, verifyCode, notice, clearNotice } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(notice)

  const sendCode = async () => {
    setError(null)
    clearNotice()
    setSending(true)
    const result = await requestLink(email.trim().toLowerCase())
    setSending(false)
    if (result.ok) {
      setStep('code')
    } else {
      setError(result.message)
    }
  }

  const enter = async () => {
    if (code.length < 8) return
    setError(null)
    setSending(true)
    const result = await verifyCode(email.trim().toLowerCase(), code)
    setSending(false)
    if (!result.ok) setError(result.message)
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

      {step === 'email' ? (
        <>
          <div className="mt-3 text-[16px] leading-snug text-white/85">
            Digite seu e-mail da compra. Enviaremos um código para você entrar.
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
        </>
      ) : (
        <>
          <div className="mt-3 text-[16px] leading-snug text-white/85">
            Enviamos um código de 8 dígitos para <b className="text-white">{email}</b>.
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
          <button
            onClick={() => {
              setStep('email')
              setCode('')
              setError(null)
            }}
            className="mt-2 h-11 text-[13px] text-white/60"
          >
            Usar outro e-mail
          </button>
        </>
      )}
    </Screen>
  )
}
