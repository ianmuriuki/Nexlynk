import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import NexlynkLogo from '@/components/shared/NexlynkLogo'
import { authAPI } from '@/api/client'
import clsx from 'clsx'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    setApiError('')
    try {
      await authAPI.forgotPassword({ email })
    } catch {
      // Always show success — never reveal if email exists (security)
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-10">
          <NexlynkLogo variant="full" />
        </Link>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="w-14 h-14 bg-success-light rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy mb-3">Check your inbox</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">
              If an account exists for{' '}
              <span className="font-semibold text-navy">{getValues('email')}</span>,
              you will receive a password reset link shortly.
            </p>
            <p className="text-slate-400 text-xs mb-8">
              Don't see it? Check your spam folder.
            </p>
            <Link to="/login" className="btn-primary w-full justify-center py-3 text-sm">
              Back to login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h1 className="font-serif text-3xl font-black text-navy mb-2">Forgot password?</h1>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Enter the email address linked to your account and we'll send you a reset link.
            </p>

            {apiError && (
              <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 mb-5 text-sm text-danger-dark">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  className={clsx('input', errors.email && 'input-error')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-navy mt-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
