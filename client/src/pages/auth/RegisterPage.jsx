import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, AlertCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import NexlynkLogo from '@/components/shared/NexlynkLogo'
import OtpStep from '@/components/auth/OtpStep'
import AUTH_IMAGES from './auth-images'
import useAuthStore from '@/store/authStore'

const SIZES = ['1-10', '11-50', '50-200', '200+']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const sendCode = useAuthStore((s) => s.sendCode)
  const [role, setRole] = useState(params.get('role') === 'company' ? 'company' : 'student')
  const [form, setForm] = useState({ name: '', email: '', industry: '', company_size: '', contact_name: '' })
  const [step, setStep] = useState('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCompany = role === 'company'
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const email = form.email.trim().toLowerCase()

  const send = () => {
    const data = isCompany
      ? { role, name: form.name.trim(), industry: form.industry.trim(), company_size: form.company_size, contact_name: form.contact_name.trim() }
      : { role, name: form.name.trim() }
    return sendCode(email, { create: true, data })
  }

  const submit = async (e) => {
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
    toast.success(isCompany ? 'Account created. Awaiting admin approval to post.' : 'Account created. Welcome to Nexlynk.')
    navigate(user.role === 'company' ? '/company' : '/student', { replace: true })
  }

  const field = (id, label, props = {}) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <input id={id} required value={form[id]} onChange={set(id)} className="input" {...props} />
    </div>
  )

  return (
    <div className="min-h-screen flex font-sans">
      <div
        className="hidden lg:flex w-[45%] flex-col px-12 py-10 relative overflow-hidden bg-navy"
        style={AUTH_IMAGES.register ? { backgroundImage: `url(${AUTH_IMAGES.register})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {AUTH_IMAGES.register && <div className="absolute inset-0 bg-navy/70" />}
        <Link to="/" className="relative z-10"><NexlynkLogo variant="full" /></Link>
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h2 className="font-serif text-4xl font-black text-white leading-tight mb-5">
            Join Kenya's leading<br />internship platform
          </h2>
          <p className="text-white/55 text-base leading-relaxed max-w-xs">
            {isCompany
              ? "Register your company and start connecting with Kenya's brightest student talent."
              : 'Create your profile, upload your CV, and apply to verified internship opportunities.'}
          </p>
        </div>
        <p className="text-xs text-white/25 relative z-10">© 2026 Nexlynk Engineers Limited</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12 bg-slate-50 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[460px] py-4">
          <h1 className="font-serif text-3xl font-black text-navy mb-1">Create account</h1>
          <p className="text-slate-500 text-sm mb-7">
            Already registered?{' '}
            <Link to="/login" className="text-blue-DEFAULT font-semibold hover:underline">Sign in</Link>
          </p>

          {step === 'form' ? (
            <>
              <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 mb-6">
                {['student', 'company'].map((r) => (
                  <button key={r} type="button" onClick={() => { setRole(r); setError('') }}
                    className={clsx('flex-1 py-2.5 text-xs font-bold rounded-lg capitalize transition-all',
                      role === r ? 'bg-white text-navy shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                    {r}
                  </button>
                ))}
              </div>

              {isCompany && (
                <div className="flex items-start gap-2.5 bg-warning-light border border-warning/30 rounded-xl px-4 py-3 mb-5 text-sm text-warning-dark">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Company accounts need admin approval before you can post opportunities.
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 mb-5 text-sm text-danger-dark">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                {field('name', isCompany ? 'Company name' : 'Full name', { minLength: 2 })}
                {isCompany && field('industry', 'Industry', { placeholder: 'e.g. Technology' })}
                {isCompany && (
                  <div>
                    <label htmlFor="company_size" className="block text-sm font-semibold text-slate-700 mb-1.5">Company size</label>
                    <select id="company_size" required value={form.company_size} onChange={set('company_size')} className="input">
                      <option value="">Select size</option>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {isCompany && field('contact_name', 'Contact person', { minLength: 2 })}
                {field('email', isCompany ? 'Work email' : 'Email address', { type: 'email', autoComplete: 'email' })}
                <div className="flex items-start gap-2.5 pt-1">
                  <input type="checkbox" required id="terms" className="mt-0.5 accent-blue-DEFAULT" />
                  <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                  {loading ? 'Sending code...' : <>Send me a code <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          ) : (
            <OtpStep email={email} onVerified={done} onResend={send} onBack={() => setStep('form')} />
          )}
        </motion.div>
      </div>
    </div>
  )
}
