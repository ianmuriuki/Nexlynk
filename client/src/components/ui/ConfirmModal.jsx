import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/components/Icon'

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'primary',
  isPending = false,
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog || dialog.open) return undefined
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      onCancel={(event) => {
        event.preventDefault()
        if (!isPending) onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !isPending) onClose()
      }}
      className="m-0 max-h-[min(90dvh,32rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-modal border border-line bg-white p-0 text-ink shadow-pop [&::backdrop]:bg-[rgba(20,21,40,.42)] [&::backdrop]:backdrop-blur-[3px] max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-none max-sm:rounded-none"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="stat-icon shrink-0">
            <Icon name={variant === 'danger' ? 'alert' : 'info'} size={20} className={variant === 'danger' ? 'text-danger' : 'text-brand'} />
          </span>
          <div>
            <h2 id="confirm-modal-title" className="text-lg font-extrabold text-ink">{title}</h2>
            <p id="confirm-modal-description" className="mt-1 text-sm text-ink-3">{description}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-icon press"
          aria-label="Close"
          disabled={isPending}
          onClick={onClose}
        >
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="flex justify-end gap-2 p-5 sm:p-6">
        <button type="button" className="btn btn-secondary press" disabled={isPending} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={'btn press ' + (variant === 'danger' ? 'btn-danger' : 'btn-primary')}
          disabled={isPending}
          onClick={onConfirm}
        >
          {isPending ? 'Working...' : confirmLabel}
        </button>
      </div>
    </dialog>,
    document.body
  )
}
