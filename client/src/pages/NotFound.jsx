import { Link } from 'react-router-dom'
import NexlynkLogo from '@/components/shared/NexlynkLogo'
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-5">
      <div className="mb-6"><NexlynkLogo variant="icon" className="w-14 h-14 rounded-2xl" /></div>
      <h1 className="font-serif text-5xl font-black text-navy mb-3">404</h1>
      <p className="text-slate-500 mb-8">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">Go home</Link>
    </div>
  )
}