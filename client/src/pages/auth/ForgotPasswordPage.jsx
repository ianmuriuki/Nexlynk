import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Zap, ArrowLeft, CheckCircle } from 'lucide-react'
import { authAPI } from '@/api/client'
import clsx from 'clsx'

const schema = z.object({ email: z.string().email('Enter a valid email') })

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try { await authAPI.forgotPassword({ email }) } catch {}
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-navy rounded-xl flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
          <span className="font-serif font-bold text-navy">Nexlynk</span>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy mb-3">Check your email</h1>
            <p className="text-slate-500 text-sm mb-6">If an account exists, you'll receive a password reset link shortly.</p>
            <Link to="/login" className="btn-primary w-full justify-center">Back to login</Link>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-3xl font-black text-navy mb-2">Forgot password?</h1>
            <p className="text-slate-500 text-sm mb-7">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input {...register('email')} type="email" placeholder="you@email.com" className={clsx('input', errors.email && 'input-error')} />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send reset link'}
              </button>
            </form>
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-navy mt-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
