import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Zap, ArrowRight, AlertCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import { authAPI, companyAPI } from '@/api/client'
import clsx from 'clsx'

// ─── Schemas ───────────────────────────────────────────────
const studentSchema = z.object({
  name:     z.string().min(2, 'Enter your full name'),
  email:    z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number'),
})

const companySchema = z.object({
  name:         z.string().min(2, 'Company name required'),
  industry:     z.string().min(2, 'Industry required'),
  email:        z.string().email('Enter a valid email'),
  company_size: z.string().min(1, 'Select company size'),
  contact_name: z.string().min(2, 'Contact name required'),
  password:     z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number'),
})

// ─── Password strength ──────────────────────────────────────
function PasswordStrength({ value }) {
  const checks = [value.length >= 8, /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)]
  const score = checks.filter(Boolean).length
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const colors = ['', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-success']
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={clsx('h-1 flex-1 rounded-full transition-all duration-300', i < score ? colors[score] : 'bg-slate-200')} />
        ))}
      </div>
      {value && <p className={clsx('text-xs', score >= 3 ? 'text-success' : score >= 2 ? 'text-warning' : 'text-danger')}>{label}</p>}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────
export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUserFromSignup } = useAuthStore()

  const defaultRole = searchParams.get('role') === 'company' ? 'company' : 'student'
  const [role, setRole] = useState(defaultRole)
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  
  const isCompany = role === 'company'
  const schema = isCompany ? companySchema : studentSchema

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(schema),
  })
  const watchPassword = watch('password', '')

  const switchRole = (r) => { setRole(r); setApiError(''); reset() }

  const onSubmit = async (values) => {
    setApiError('')
    setLoading(true)
    try {
      if (isCompany) {
        await companyAPI.register({ role: 'company', ...values })
        toast.success('Company registered! Please log in after admin approval.')
        navigate('/login')
      } else {
        const { data } = await authAPI.signup({ role: 'student', ...values })
        setUserFromSignup(data.user, data.accessToken)
        toast.success('Account created! Welcome to Nexlynk.')
        navigate('/student')
      }
    } catch (err) {
      if (err?.details?.length) {
        setApiError(err.details.map((d) => d.message || d).join(', '))
      } else {
        setApiError(err?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const F = ({ id, label, error, children }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error.message}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex font-sans">

      {/* Left */}
      <div className="hidden lg:flex w-[45%] bg-navy flex-col relative overflow-hidden px-12 py-10">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(26,86,219,.45) 0%, transparent 65%)' }} />
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-blue-DEFAULT rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-xl text-white">Nexlynk</span>
        </Link>
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h2 className="font-serif text-4xl font-black text-white leading-tight mb-5">
            Join Kenya's leading<br />internship platform
          </h2>
          <p className="text-white/55 text-base leading-relaxed max-w-xs">
            {isCompany
              ? 'Register your company and start connecting with Kenya\'s brightest student talent.'
              : 'Create your profile, upload your CV, and apply to hundreds of verified internship opportunities.'}
          </p>
        </div>
        <p className="text-xs text-white/25 relative z-10">© 2026 Nexlynk Engineers Limited</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 bg-slate-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[460px] py-4"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-navy rounded-xl flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="font-serif font-bold text-navy">Nexlynk</span>
          </div>

          <h1 className="font-serif text-3xl font-black text-navy mb-1">Create account</h1>
          <p className="text-slate-500 text-sm mb-7">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-DEFAULT font-semibold hover:underline">Sign in →</Link>
          </p>

          {/* Role tabs */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 mb-7">
            <button onClick={() => switchRole('student')}
              className={clsx('flex-1 py-2.5 text-xs font-bold rounded-lg transition-all',
                role === 'student' ? 'bg-white text-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}>Student</button>
            <button onClick={() => switchRole('company')}
              className={clsx('flex-1 py-2.5 text-xs font-bold rounded-lg transition-all',
                role === 'company' ? 'bg-white text-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}>Company</button>
          </div>

          {/* Company pending notice */}
          {isCompany && (
            <div className="flex items-start gap-2.5 bg-warning-light border border-warning/30 rounded-xl px-4 py-3 mb-6 text-sm text-warning-dark">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Company accounts require admin approval before you can post opportunities. You'll be notified by email.
            </div>
          )}

          {apiError && (
            <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 mb-5 text-sm text-danger-dark">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {apiError}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={role}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: .25 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {isCompany ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <F id="name" label="Company name" error={errors.name}>
                      <input id="name" {...register('name')} placeholder="Acme Corp" className={clsx('input', errors.name && 'input-error')} />
                    </F>
                    <F id="industry" label="Industry" error={errors.industry}>
                      <input id="industry" {...register('industry')} placeholder="e.g. Technology" className={clsx('input', errors.industry && 'input-error')} />
                    </F>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <F id="email" label="Work email" error={errors.email}>
                      <input id="email" {...register('email')} type="email" placeholder="hr@company.com" autoComplete="email" className={clsx('input', errors.email && 'input-error')} />
                    </F>
                    <F id="company_size" label="Company size" error={errors.company_size}>
                      <select id="company_size" {...register('company_size')} className={clsx('input', errors.company_size && 'input-error')}>
                        <option value="">Select size</option>
                        <option value="1-10">1–10</option>
                        <option value="11-50">11–50</option>
                        <option value="50-200">50–200</option>
                        <option value="200+">200+</option>
                      </select>
                    </F>
                  </div>
                  <F id="contact_name" label="Your name (contact)" error={errors.contact_name}>
                    <input id="contact_name" {...register('contact_name')} placeholder="Full name" className={clsx('input', errors.contact_name && 'input-error')} />
                  </F>
                </>
              ) : (
                <>
                  <F id="name" label="Full name" error={errors.name}>
                    <input id="name" {...register('name')} placeholder="Jane Muthoni" autoComplete="name" className={clsx('input', errors.name && 'input-error')} />
                  </F>
                  <F id="email" label="Email address" error={errors.email}>
                    <input id="email" {...register('email')} type="email" placeholder="jane@email.com" autoComplete="email" className={clsx('input', errors.email && 'input-error')} />
                  </F>
                </>
              )}

              {/* Password */}
              <F id="password" label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    id="password"
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    autoComplete="new-password"
                    className={clsx('input pr-11', errors.password && 'input-error')}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {watchPassword && <PasswordStrength value={watchPassword} />}
              </F>

              <div className="flex items-start gap-2.5 pt-1">
                <input type="checkbox" required id="terms" className="mt-0.5 accent-blue-DEFAULT" />
                <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-blue-DEFAULT hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-DEFAULT hover:underline">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>{isCompany ? 'Register company' : 'Create student account'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
