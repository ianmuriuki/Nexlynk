const STATUS_CLASSES = {
  pending: 'badge-pending',
  under_review: 'badge-under_review',
  shortlisted: 'badge-shortlisted',
  placed: 'badge-placed',
  rejected: 'badge-rejected',
  approved: 'badge-approved',
}

const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  placed: 'Placed',
  rejected: 'Rejected',
  approved: 'Approved',
}

export default function StatusPill({ status, label }) {
  const key = typeof status === 'string' ? status.toLowerCase() : ''
  const display = label || STATUS_LABELS[key] || key.replaceAll('_', ' ') || 'Unknown'

  return (
    <span className={'badge ' + (STATUS_CLASSES[key] || '') + ' inline-flex items-center gap-1.5'}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
      {display}
    </span>
  )
}
