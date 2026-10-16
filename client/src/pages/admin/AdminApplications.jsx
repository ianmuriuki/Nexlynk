import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import Icon from '@/components/Icon'
import StatusPill from '@/components/ui/StatusPill'
import { adminAPI } from '@/api/admin'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_CFG = {
  pending:     { label: 'Pending'     },
  shortlisted: { label: 'Shortlisted' },
  placed:      { label: 'Placed'      },
  rejected:    { label: 'Rejected'    },
}

const TABS = ['All', 'pending', 'shortlisted', 'placed', 'rejected']

function Skeleton() {
  return [...Array(6)].map((_, i) => (
    <tr key={i} className="border-b border-line">
      {[...Array(7)].map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 bg-canvas-2 rounded animate-shimmer w-3/4" />
        </td>
      ))}
    </tr>
  ))
}

export default function AdminApplications() {
  const qc = useQueryClient()
  const [tab,    setTab]    = useState('All')
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const params = {
    limit: 25,
    page,
    ...(tab !== 'All' && { status: tab }),
  }

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin-applications-full', params],
    queryFn:  () => adminAPI.applications(params).then(r => r.data.data ?? r.data),
    keepPreviousData: true,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateAppStatus(id, { status }),
    onSuccess:  () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['admin-applications-full'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: (e) => toast.error(e?.message || 'Update failed'),
  })

  const allApps    = Array.isArray(data) ? data : (data?.data ?? [])
  const pagination = data?.pagination

  const filtered = allApps.filter(a => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (a.student_name      || '').toLowerCase().includes(q) ||
           (a.opportunity_title || '').toLowerCase().includes(q) ||
           (a.company_name      || '').toLowerCase().includes(q)
  })

  const counts = TABS.slice(1).reduce((acc, s) => {
    acc[s] = allApps.filter(a => a.status === s).length
    return acc
  }, {})

  const placedCount = counts['placed'] ?? 0

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl">

      <div className="mb-7 animate-fade-up">
        <h1 className="font-extrabold text-2xl font-bold text-ink">All Applications</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isPending ? <span role="status" aria-label="Loading applications" className="inline-block h-4 w-36 rounded bg-canvas-2 animate-shimmer" /> : isError ? 'Applications could not be loaded' : `${pagination?.total ?? allApps.length} total applications`}
          {placedCount > 0 && (
            <span className="ml-2 text-success font-semibold">· {placedCount} placements confirmed</span>
          )}
        </p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button key={key}
            onClick={() => { setTab(tab === key ? 'All' : key); setPage(1) }}
            className={clsx('card p-4 text-left hover:shadow-card-hover transition-all',
              tab === key && 'ring-2 ring-brand'
            )}>
            <div className="font-extrabold text-2xl font-bold text-ink mb-1">{isError ? '—' : counts[key] ?? 0}</div>
            <StatusPill status={key} />
          </button>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1) }}
              className={clsx('px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap',
                tab === t ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-brand'
              )}>
              {isError ? t : t === 'All' ? `All (${allApps.length})` : `${t} (${counts[t] ?? 0})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search student, role, or company..." />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-canvas border-b border-line">
                {['Student','Institution','Opportunity','Company','Applied','Status','Update'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isPending ? <Skeleton /> : isError ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center"><Icon name="alert-circle" size={28} className="mx-auto mb-2 text-warning" /><p className="text-sm font-semibold text-ink-2">Could not load applications</p></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Icon name="file" size={40} className="mx-auto mb-3 text-line-2" />
                    <p className="text-slate-400 text-sm font-medium">No applications found</p>
                    {search && (
                      <button onClick={() => setSearch('')} className="btn-primary btn-sm mt-3">
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : filtered.map((a) => {
                const studentName = a.student_name        || '—'
                const university  = a.student_university  || '—'
                const oppTitle    = a.opportunity_title   || '—'
                const coName      = a.company_name        || '—'
                                const date        = a.created_at
                  ? new Date(a.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short' })
                  : '—'
                const initial = studentName[0]?.toUpperCase() || '?'

                return (
                  <tr key={a.id} className="hover:bg-canvas/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initial}
                        </div>
                        <p className="text-sm font-semibold text-ink">{studentName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 max-w-[140px] truncate">{university}</td>
                    <td className="px-5 py-4 text-sm text-slate-700 font-medium max-w-[160px] truncate">{oppTitle}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{coName}</td>
                    <td className="px-5 py-4 text-sm text-slate-400 whitespace-nowrap">{date}</td>
                    <td className="px-5 py-4"><StatusPill status={a.status} /></td>
                    <td className="px-5 py-4">
                      <select
                        defaultValue={a.status}
                        onChange={(e) => statusMutation.mutate({ id: a.id, status: e.target.value })}
                        disabled={statusMutation.isPending}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-canvas font-medium text-slate-700 outline-none focus:border-brand cursor-pointer hover:border-brand transition-colors"
                      >
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="placed">Placed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="btn-secondary btn-sm disabled:opacity-40">← Prev</button>
          <div className="flex gap-1">
            {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
              const p = i + 1
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={clsx('w-8 h-8 rounded-lg text-xs font-bold transition-all',
                    page === p ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}>{p}</button>
              )
            })}
            {pagination.total_pages > 5 && <span className="text-slate-400 self-center px-1">…</span>}
          </div>
          <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}
            className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
