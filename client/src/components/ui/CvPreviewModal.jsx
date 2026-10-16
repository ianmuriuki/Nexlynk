import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/components/Icon'

export default function CvPreviewModal({ open, url, loading, onClose }) {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[rgba(20,21,40,.42)] p-0 backdrop-blur-[3px] animate-fade-in sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-preview-title"
        className="flex h-dvh max-h-dvh w-full max-w-none flex-col overflow-hidden rounded-none border border-line bg-white shadow-pop animate-pop sm:h-[90dvh] sm:max-h-[900px] sm:w-[calc(100vw-2.5rem)] sm:max-w-4xl sm:rounded-modal"
      >
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <Icon name="file" size={18} />
            </span>
            <h2 id="cv-preview-title" className="truncate text-base font-extrabold text-ink">CV preview</h2>
          </div>
          <button type="button" className="btn-icon press" onClick={onClose} aria-label="Close CV preview">
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-canvas">
          {loading ? (
            <div role="status" aria-label="Loading CV preview" className="h-full w-full animate-shimmer bg-canvas-2" />
          ) : url ? (
            <iframe title="CV preview document" src={url} className="h-full w-full border-0 bg-white" />
          ) : (
            <p role="alert" className="px-6 text-center text-sm font-semibold text-ink-3">Preview unavailable</p>
          )}
        </div>
      </section>
    </div>,
    document.body
  )
}
