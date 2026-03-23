import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import NexlynkLogo from '@/components/shared/NexlynkLogo'
import { authAPI } from '@/api/client'

export default function VerifyEmailPage() {
  const [params]  = useSearchParams()
  const [status,  setStatus]  = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return }

    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(e  => { setStatus('error'); setMessage(e?.message || 'Verification failed.') })
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <NexlynkLogo variant="full" />
        </Link>

        <div className="card p-10">
          {status === 'loading' && (
            <>
              <Loader className="w-12 h-12 text-blue-DEFAULT mx-auto mb-4 animate-spin" />
              <h1 className="font-serif text-xl font-bold text-navy mb-2">Verifying your email...</h1>
              <p className="text-slate-500 text-sm">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-14 h-14 text-success mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-navy mb-2">Email verified!</h1>
              <p className="text-slate-500 text-sm mb-8">
                Your email has been verified successfully. You can now log in to your account.
              </p>
              <Link to="/login" className="btn-primary w-full py-3 justify-center">
                Go to login →
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-14 h-14 text-danger mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-navy mb-2">Verification failed</h1>
              <p className="text-slate-500 text-sm mb-2">{message}</p>
              <p className="text-slate-400 text-xs mb-8">
                The link may have expired. Request a new one below.
              </p>
              <Link to="/login" className="btn-primary w-full py-3 justify-center mb-3">
                Go to login →
              </Link>
              <Link to="/forgot-password" className="btn-secondary w-full py-3 justify-center">
                Resend verification email
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

