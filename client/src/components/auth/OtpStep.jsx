import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import useAuthStore from '@/store/authStore'

export default function OtpStep({ email, onVerified, onResend, onBack }) {
  const verifyCode = useAuthStore((s) => s.verifyCode)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [wait, setWait] = useState(60)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      onVerified(await verifyCode(email, code.trim()))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError('')
    try {
      await onResend()
      setWait(60)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-slate-500">
        We sent a 6 digit code to <span className="font-semibold text-slate-700">{email}</span>.
      </p>
      {error && (
        <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger-dark">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        className="input text-center text-2xl tracking-[0.5em]"
        autoFocus
      />
      <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full py-3 text-sm">
        {loading ? 'Checking...' : 'Verify and continue'}
      </button>
      <div className="flex justify-between text-xs">
        <button type="button" onClick={onBack} className="text-slate-500 hover:underline">Change email</button>
        <button type="button" onClick={resend} disabled={wait > 0} className="text-blue-DEFAULT disabled:text-slate-400">
          {wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
        </button>
      </div>
    </form>
  )
}
