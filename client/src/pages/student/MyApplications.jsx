import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import Icon from '@/components/Icon'
import StatusPill from '@/components/ui/StatusPill'
import { studentAPI } from '@/api/opportunities'
import useAuthStore from '@/store/authStore'
import clsx from 'clsx'

const STATUS_CONFIG = {
  pending:     { icon: 'clock',        label: 'Pending',     desc: 'Your application is under review.' },
  shortlisted: { icon: 'trending-up',  label: 'Shortlisted', desc: 'Congratulations! You have been shortlisted.' },
  placed:      { icon: 'check-circle', label: 'Placed',      desc: 'You have been placed. Check your email for next steps.' },
  rejected:    { icon: 'x-circle',     label: 'Rejected',    desc: 'This application was not successful.' },
}

const FILTERS = ['All', 'pending', 'shortlisted', 'placed', 'rejected']

const TYPE_ICON = {
  internship: 'briefcase',
  'part-time': 'clock',
  contract: 'file',
  'full-time': 'briefcase',
}

export default function MyApplications() {
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('All')

  const { data: appsData, isPending, isError } = useQuery({
    queryKey: ['student-applications', user?.id],
    queryFn:  () => studentAPI.getApplications(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const allApps = Array.isArray(appsData) ? appsData : (appsData?.data ?? [])
  const filtered = filter === 'All' ? allApps : allApps.filter(a => a.status === filter)

  const counts = {
    pending:     allApps.filter(a => a.status === 'pending').length,
    shortlisted: allApps.filter(a => a.status === 'shortlisted').length,
    placed:      allApps.filter(a => a.status === 'placed').length,
    rejected:    allApps.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-7 animate-fade-up">
        <h1 className="text-2xl font-extrabold text-ink">My Applications</h1>
        <p className="text-ink-3 text-sm mt-1">
          {isPending ? 'Loading applications' : isError ? 'Applications could not be loaded' : `${allApps.length} total application${allApps.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const statusIcon = cfg.icon
          return (
            <button key={key}
              onClick={() => setFilter(filter === key ? 'All' : key)}
              className={clsx('card p-4 text-left transition-all hover:shadow-card-hover',
                filter === key && 'ring-2 ring-brand'
              )}>
              <Icon name={statusIcon} size={16} className="mb-2 text-ink-4" />
              <div className="text-2xl font-extrabold text-ink">{isError ? 'N/A' : counts[key]}</div>
              <div className="text-xs text-ink-3 mt-0.5 capitalize">{cfg.label}</div>
            </button>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx('px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all capitalize',
              filter === f
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-ink-3 border-line-2 hover:border-brand'
            )}>
            {isError ? f : f === 'All' ? `All (${allApps.length})` : `${f} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {isPending ? (
        <div className="card divide-y divide-line">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 animate-shimmer flex gap-4">
              <div className="w-12 h-12 bg-canvas-2 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-canvas-2 rounded w-2/3" />
                <div className="h-3 bg-canvas-2 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card p-14 text-center">
          <Icon name="alert-circle" size={28} className="mx-auto mb-3 text-warning" />
          <h3 className="mb-2 font-extrabold text-ink">Could not load applications</h3>
          <p className="text-sm text-ink-3">Please try again shortly.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <Icon name="file" size={40} className="mx-auto mb-4 text-line-2" />
          <h3 className="font-semibold text-ink mb-2">
            {filter === 'All' ? 'No applications yet' : `No ${filter} applications`}
          </h3>
          <p className="text-ink-4 text-sm">
            {filter === 'All' ? 'Browse opportunities and start applying.' : 'Nothing in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-line">
          {filtered.map((app) => {
            const cfg        = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
                        const title      = app.opportunity?.title        || 'Opportunity'
            const company    = app.opportunity?.company_name || ''
            const location   = app.opportunity?.location     || ''
            const type       = app.opportunity?.type         || ''
            const date       = app.applied_at || app.created_at
              ? new Date(app.applied_at || app.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'long', year:'numeric' })
              : ''
            const updated = app.updated_at
              ? new Date(app.updated_at).toLocaleDateString('en-KE', { day:'numeric', month:'short' })
              : ''

            return (
              <div key={app.id} className="p-5 hover:bg-canvas/80 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-soft bg-brand-soft text-brand"><Icon name={TYPE_ICON[type] || 'briefcase'} size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-ink">{title}</h3>
                        <p className="text-xs text-ink-4 mt-0.5">
                          {company}{location ? ` · ${location}` : ''}{type ? ` · ${type}` : ''}
                        </p>
                      </div>
                      <StatusPill status={app.status} />
                    </div>

                    <div className={clsx(
                      'mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2',
                      app.status === 'shortlisted' ? 'bg-brand-soft text-brand-ink' :
                      app.status === 'placed'      ? 'bg-success-light text-success-dark' :
                      app.status === 'rejected'    ? 'bg-danger-light text-danger-dark' :
                      'bg-canvas text-ink-3'
                    )}>
                      <Icon name={cfg.icon} size={14} className="mt-0.5 shrink-0" />
                      {cfg.desc}
                    </div>

                    <div className="flex gap-4 mt-3 text-xs text-ink-4">
                      {date    && <span>Applied {date}</span>}
                      {updated && <span>Updated {updated}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}