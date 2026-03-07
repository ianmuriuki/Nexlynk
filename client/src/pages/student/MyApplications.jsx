import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle, X, TrendingUp } from 'lucide-react'
import { studentAPI } from '@/api/client'
import useAuthStore from '@/store/authStore'
import clsx from 'clsx'

const STATUS_CONFIG = {
  pending:     { cls: 'badge-pending',     icon: Clock,        label: 'Pending',      desc: 'Your application is under review.' },
  shortlisted: { cls: 'badge-shortlisted', icon: TrendingUp,   label: 'Shortlisted',  desc: 'Congratulations! You have been shortlisted.' },
  placed:      { cls: 'badge-placed',      icon: CheckCircle,  label: 'Placed',       desc: 'You have been placed. Check your email for next steps.' },
  rejected:    { cls: 'badge-rejected',    icon: X,            label: 'Rejected',     desc: 'This application was not successful.' },
}

const FILTERS = ['All', 'pending', 'shortlisted', 'placed', 'rejected']

export default function MyApplications() {
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('All')

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['student-applications', user?.id],
    queryFn:  () => studentAPI.getApplications(user.id).then(r => r.data),
    enabled:  !!user?.id,
  })

  const allApps = appsData?.data ?? appsData ?? []
  const filtered = filter === 'All' ? allApps : allApps.filter(a => a.status === filter)

  const counts = {
    pending:     allApps.filter(a => a.status === 'pending').length,
    shortlisted: allApps.filter(a => a.status === 'shortlisted').length,
    placed:      allApps.filter(a => a.status === 'placed').length,
    rejected:    allApps.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="font-serif text-2xl font-bold text-navy">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">{allApps.length} total application{allApps.length !== 1 ? 's' : ''}</p>
      </motion.div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'All' : key)}
              className={clsx('card p-4 text-left transition-all hover:shadow-card-hover',
                filter === key && 'ring-2 ring-blue-DEFAULT'
              )}
            >
              <Icon className="w-4 h-4 text-slate-400 mb-2" />
              <div className="font-serif text-2xl font-bold text-navy">{counts[key]}</div>
              <div className="text-xs text-slate-500 mt-0.5 capitalize">{cfg.label}</div>
            </button>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx('px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all capitalize',
              filter === f ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-DEFAULT'
            )}
          >{f === 'All' ? `All (${allApps.length})` : `${f} (${counts[f]})`}</button>
        ))}
      </div>

      {/* Applications list */}
      {isLoading
        ? (
          <div className="card divide-y divide-slate-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-5 animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-slate-100 rounded w-2/3" /><div className="h-3 bg-slate-100 rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        )
        : filtered.length === 0
          ? (
            <div className="card p-14 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-4" />
              <h3 className="font-semibold text-navy mb-2">
                {filter === 'All' ? 'No applications yet' : `No ${filter} applications`}
              </h3>
              <p className="text-slate-400 text-sm">
                {filter === 'All' ? 'Browse opportunities and start applying.' : 'Nothing in this category yet.'}
              </p>
            </div>
          )
          : (
            <div className="card overflow-hidden divide-y divide-slate-100">
              {filtered.map((app) => {
                const cfg      = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
                const StatusIcon = cfg.icon
                const title    = app.opportunity?.title || app.title || 'Opportunity'
                const company  = app.opportunity?.company?.name || app.company_name || ''
                const location = app.opportunity?.location || ''
                const type     = app.opportunity?.type || ''
                const date     = app.created_at
                  ? new Date(app.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'long', year:'numeric' })
                  : ''
                const updated  = app.updated_at
                  ? new Date(app.updated_at).toLocaleDateString('en-KE', { day:'numeric', month:'short' })
                  : ''

                return (
                  <div key={app.id} className="p-5 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {type === 'internship' ? '💼' : type === 'attachment' ? '🌍' : '🎯'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-navy">{title}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {company}{location ? ` · ${location}` : ''}{type ? ` · ${type}` : ''}
                            </p>
                          </div>
                          <span className={clsx(cfg.cls, 'flex-shrink-0')}>{cfg.label}</span>
                        </div>

                        <div className={clsx(
                          'mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2',
                          app.status === 'shortlisted' ? 'bg-blue-50 text-blue-700' :
                          app.status === 'placed'      ? 'bg-success-light text-success-dark' :
                          app.status === 'rejected'    ? 'bg-danger-light text-danger-dark' :
                          'bg-slate-50 text-slate-500'
                        )}>
                          <StatusIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          {cfg.desc}
                        </div>

                        <div className="flex gap-4 mt-3 text-xs text-slate-400">
                          {date    && <span>Applied {date}</span>}
                          {updated && <span>Updated {updated}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
      }
    </div>
  )
}
