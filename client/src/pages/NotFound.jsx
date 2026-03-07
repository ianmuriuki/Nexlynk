import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-5">
      <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center mb-6"><Zap className="w-7 h-7 text-white" /></div>
      <h1 className="font-serif text-5xl font-black text-navy mb-3">404</h1>
      <p className="text-slate-500 mb-8">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">Go home</Link>
    </div>
  )
}
