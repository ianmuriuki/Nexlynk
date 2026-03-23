import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import NexlynkLogo from '@/components/shared/NexlynkLogo'
import { authAPI } from '@/api/client'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = z.object({
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})

export default function ResetPasswordPage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const [showPw,   setShowPw]   = useState(false)
  const [showCo,   setShowCo]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const token = params.get('token')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ password }) => {
    if (!token) { toast.error('Invalid reset link.'); return }
    setLoading(true)
    try {
      await authAPI.resetPassword({ token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (e) {
      toast.error(e?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <NexlynkLogo variant="full" />
        </Link>

        <div className="card p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-success mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-navy mb-2">Password reset!</h1>
              <p className="text-slate-500 text-sm">
                Your password has been updated. Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl font-bold text-navy mb-1">Set new password</h1>
              <p className="text-slate-500 text-sm mb-7">
                Choose a strong password for your Nexlynk account.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPw ? 'text' : 'password'}
                      className={clsx('input pr-11', errors.password && 'input-error')}
                      placeholder="Min. 8 characters"
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirm')}
                      type={showCo ? 'text' : 'password'}
                      className={clsx('input pr-11', errors.confirm && 'input-error')}
                      placeholder="Repeat your password"
                    />
                    <button type="button" onClick={() => setShowCo(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showCo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p className="mt-1 text-xs text-danger">{errors.confirm.message}</p>
                  )}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : 'Reset password'}
                </button>
              </form>

              <p className="text-center mt-5">
                <Link to="/login" className="text-sm text-blue-DEFAULT hover:underline">
                  ← Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}