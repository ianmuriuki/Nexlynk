import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Icon from '@/components/Icon'
import { getPublishedAnnouncements } from '@/api/announcements'
import clsx from 'clsx'

const KIND_LABEL = { update: 'Update', event: 'Event', training: 'Training' }
const KIND_STYLE = {
  update:   'bg-brand-soft text-brand-ink',
  event:    'bg-info-light text-info-dark',
  training: 'bg-success-light text-success-dark',
}

const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null)
const dateLabel = (d) =>
  d ? new Date(d + 'T00:00:00+03:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : null

export default function UpdatesCard({ limit = 3 }) {
  const [open, setOpen] = useState(null)
  const { data, isPending, isError } = useQuery({
    queryKey: ['announcements-public', limit],
    queryFn: () => getPublishedAnnouncements({ limit }).then((r) => r.data.data ?? []),
    staleTime: 60 * 1000,
  })

  if (isPending || isError || !data?.length) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-line">
        <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
          <Icon name="zap" size={16} className="text-brand" /> Latest updates
        </h3>
      </div>
      <div className="divide-y divide-line">
        {data.map((u) => {
          const isOpen = open === u.id
          const when = dateLabel(u.event_date)
          const url = safeUrl(u.link_url)
          return (
            <div key={u.id} className="px-5 py-4 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={clsx('badge text-[10px]', KIND_STYLE[u.kind] || KIND_STYLE.update)}>
                  {KIND_LABEL[u.kind] || 'Update'}
                </span>
                {when && <span className="text-[11px] text-ink-4">{when}</span>}
                {u.location && <span className="text-[11px] text-ink-4">{u.location}</span>}
              </div>
              <p className="text-sm font-semibold text-ink break-words">{u.title}</p>
              {u.summary && <p className="text-xs text-ink-3 mt-1 leading-relaxed">{u.summary}</p>}
              {isOpen && u.body && (
                <p className="text-xs text-ink-2 mt-2 leading-relaxed whitespace-pre-line">{u.body}</p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                {u.body && (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : u.id)}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    {isOpen ? 'Show less' : 'Read more'}
                  </button>
                )}
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" className="btn-secondary btn-sm text-xs">
                    {u.link_label || 'Learn more'}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
