import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import NexlynkLogo from '@/components/shared/NexlynkLogo'
import OtpStep from '@/components/auth/OtpStep'
import AUTH_IMAGES from './auth-images'
import useAuthStore from '@/store/authStore'
import { isSafeRedirect } from '@/utils/security'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const sendCode = useAuthStore((s) => s.sendCode)
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const send = () => sendCode(email.trim().toLowerCase(), { create: false })

  const submitEmail = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await send()
      setStep('code')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const done = (user) => {
    toast.success('Welcome back!')
    const from = location.state?.from?.pathname
    if (from && isSafeRedirect(from)) return navigate(from, { replace: true })
    const dest = user.role === 'admin' ? '/admin' : user.role === 'company' ? '/company' : '/student'
    navigate(dest, { replace: true })
  }

  return (
    <div className="min-h-screen flex font-sans">
      <div
        className="hidden lg:flex w-[45%] flex-col px-12 py-10 relative overflow-hidden bg-ink"
        style={AUTH_IMAGES.login ? { backgroundImage: `url(${AUTH_IMAGES.login})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {AUTH_IMAGES.login && <div className="absolute inset-0 bg-ink/70" />}
        <Link to="/" className="relative z-10"><NexlynkLogo variant="full" /></Link>
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h2 className="font-serif text-4xl font-black text-white leading-tight mb-5">
            Your career journey<br />starts <span className="text-brand">here</span>
          </h2>
          <p className="text-white/55 text-base leading-relaxed max-w-xs">
            Join students and companies building Kenya's workforce of tomorrow.
          </p>
        </div>
        <p className="text-xs text-white/25 relative z-10">© 2026 Nexlynk Engineers Limited</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12 bg-slate-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
          <h1 className="font-serif text-3xl font-black text-ink mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-7">
            No account yet?{' '}
            <Link to="/register" className="text-brand font-semibold hover:underline">Register</Link>
          </p>

          {step === 'email' ? (
            <form onSubmit={submitEmail} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger-dark">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com" autoComplete="email" className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                {loading ? 'Sending code...' : <>Send me a code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <OtpStep email={email} onVerified={done} onResend={send} onBack={() => setStep('email')} />
          )}
        </motion.div>
      </div>
    </div>
  )
}
