import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, ArrowRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import { isSafeRedirect } from '@/utils/security'
import clsx from 'clsx'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const getTabs = (showAdmin) =>
  showAdmin ? ['Student', 'Company', 'Admin'] : ['Student', 'Company']

const TAB_HINTS = {
  Student: 'Sign in as a student to browse and apply for opportunities.',
  Company: 'Sign in as a company to manage your listings and applicants.',
  Admin:   'Platform administrator access.',
}

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuthStore()

  const params    = new URLSearchParams(location.search)
  const showAdmin = params.get('admin') === '1'
  const tabs      = getTabs(showAdmin)

  const [activeTab, setActiveTab] = useState(showAdmin ? 'Admin' : 'Student')
  const [loading,   setLoading]   = useState(false)
  const [showPw,    setShowPw]    = useState(false)
  const [apiError,  setApiError]  = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email, password }) => {
    setApiError('')
    setLoading(true)
    try {
      const { user } = await login(email, password)

      toast.success('Welcome back!')

      const from = location.state?.from?.pathname
      if (from && isSafeRedirect(from)) {
        navigate(from, { replace: true })
        return
      }
      // Always redirect by actual role from token — tab selection is just a visual hint
      const dest = user.role === 'admin' ? '/admin' : user.role === 'company' ? '/company' : '/student'
      navigate(dest, { replace: true })
    } catch (err) {
      setApiError(err?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── Left panel ──────────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] bg-navy flex-col relative overflow-hidden px-12 py-10">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(26,86,219,.45) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,.18) 0%, transparent 65%)' }} />

        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-blue-DEFAULT rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-xl text-white">Nexlynk</span>
        </Link>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h2 className="font-serif text-4xl font-black text-white leading-tight mb-5">
            Your career journey<br />starts <span className="text-blue-300">here</span>
          </h2>
          <p className="text-white/55 text-base leading-relaxed mb-10 max-w-xs">
            Join thousands of students and hundreds of companies building Kenya's workforce of tomorrow.
          </p>
          <div className="space-y-3">
            {[
              { icon: '🎓', bold: '2,400+ students placed',      sub: 'Across 12+ industries' },
              { icon: '🏢', bold: '340+ verified companies',     sub: 'From startups to enterprises' },
              { icon: '⚡', bold: 'Average 8 days to placement', sub: 'Fastest in the market' },
            ].map((s) => (
              <div key={s.bold} className="glass rounded-xl px-4 py-3.5 flex items-center gap-3.5">
                <div className="w-9 h-9 bg-blue-700/40 rounded-lg flex items-center justify-center text-lg flex-shrink-0">{s.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.bold}</p>
                  <p className="text-xs text-white/45 mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/25 relative z-10">© 2026 Nexlynk Engineers Limited</p>
      </div>

      {/* ── Right panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .5 }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-navy rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-navy">Nexlynk</span>
          </div>

          <h1 className="font-serif text-3xl font-black text-navy mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-7">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-DEFAULT font-semibold hover:underline">Sign up free →</Link>
          </p>

          {/* Role tabs — visual hint only, no validation against token role */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 mb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setApiError('') }}
                className={clsx(
                  'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                  activeTab === tab
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >{tab}</button>
            ))}
          </div>

          <p className="text-xs text-slate-400 mb-6 px-1">{TAB_HINTS[activeTab]}</p>

          {apiError && (
            <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 mb-5 text-sm text-danger-dark">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@email.com"
                autoComplete="email"
                className={clsx('input', errors.email && 'input-error')}
              />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-DEFAULT font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={clsx('input pr-11', errors.password && 'input-error')}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>Sign in as {activeTab} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">
            By signing in you agree to our{' '}
            <a href="#" className="text-blue-DEFAULT hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-DEFAULT hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}