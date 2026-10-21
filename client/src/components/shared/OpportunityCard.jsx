import Icon from '@/components/Icon'

const TYPE_STYLES = {
  internship: 'bg-brand-soft text-brand-ink',
  'part-time': 'bg-info-light text-info-dark',
  contract: 'bg-warning-light text-warning-dark',
  'full-time': 'bg-success-light text-success-dark',
}

function getNairobiToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date())
}

function formatDeadline(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00+03:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function deadlineDays(value) {
  if (!value) return null
  const deadline = new Date(`${value}T00:00:00+03:00`)
  const today = new Date(`${getNairobiToday()}T00:00:00+03:00`)
  if (Number.isNaN(deadline.getTime())) return null
  return Math.floor((deadline.getTime() - today.getTime()) / 86400000)
}

function postedLabel(value) {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return null
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'Posted just now'
  if (minutes < 60) return `Posted ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Posted ${hours}h ago`
  return `Posted ${Math.floor(hours / 24)}d ago`
}

function companyInitials(name) {
  return (name || 'Company')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function OpportunityCard({
  opportunity,
  action = null,
  companyLogoUrl = null,
  className = '',
}) {
  const companyName = opportunity.company_name || 'Verified company'
  const deadline = formatDeadline(opportunity.application_deadline)
  const daysLeft = deadlineDays(opportunity.application_deadline)
  const skills = Array.isArray(opportunity.skills_required)
    ? opportunity.skills_required.filter((skill) => typeof skill === 'string').slice(0, 3)
    : []
  const type = opportunity.type || 'Opportunity'

  return (
    <article className={`card flex min-w-0 flex-col rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-xs font-extrabold text-brand-ink">
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt=""
              width="40"
              height="40"
              loading="lazy"
              onError={(event) => { event.currentTarget.hidden = true }}
              className="h-full w-full rounded-full object-cover"
            />
          ) : companyInitials(companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-ink-3">{companyName}</p>
          <h3 className="mt-1 line-clamp-2 min-h-10 break-words text-[15px] font-extrabold leading-5 text-ink">
            {opportunity.title || 'Untitled opportunity'}
          </h3>
        </div>
        <span className={`badge flex-shrink-0 capitalize ${TYPE_STYLES[type] || 'bg-canvas-2 text-ink-3'}`}>
          {type}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-xs font-medium text-ink-3">
        <span className="flex min-w-0 items-center gap-2">
          <Icon name="map-pin" size={14} className="flex-shrink-0 text-brand" />
          <span className="truncate">{opportunity.location || 'Location not specified'}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <Icon name="clock" size={14} className="flex-shrink-0 text-brand" />
          <span className="truncate">{opportunity.duration || 'Duration not specified'}</span>
        </span>
      </div>
      <p className="mt-3 min-h-5 truncate text-sm font-extrabold tabular-nums text-ink">{opportunity.stipend || "Stipend not specified"}</p>
      {opportunity.description && <p className="mt-3 line-clamp-3 min-h-[3.75rem] break-words text-xs leading-5 text-ink-3">{opportunity.description}</p>}
      {skills.length > 0 && (
        <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
          {skills.map((skill, index) => <span key={skill + index} className="max-w-full truncate rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand-ink">{skill}</span>)}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className={daysLeft !== null && daysLeft <= 3 ? 'flex items-center gap-1.5 text-[11px] font-semibold text-warning-dark' : 'flex items-center gap-1.5 text-[11px] font-semibold text-ink-4'}>
            <Icon name="clock" size={13} />
            {deadline ? 'Apply by ' + deadline : 'No application deadline'}
          </span>
          {postedLabel(opportunity.created_at) && <span className="text-[10px] font-medium text-ink-4">{postedLabel(opportunity.created_at)}</span>}
        </div>
        {action}
      </div>
    </article>
  )
}
