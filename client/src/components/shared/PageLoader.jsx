export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo mark for loading state */}
        <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center animate-pulse">
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-DEFAULT animate-bounce delay-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-DEFAULT animate-bounce delay-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-DEFAULT animate-bounce delay-3" />
        </div>
      </div>
    </div>
  )
}