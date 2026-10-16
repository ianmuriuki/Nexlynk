import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import Icon from '@/components/Icon'
import StatusPill from '@/components/ui/StatusPill'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { adminAPI } from '@/api/admin'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const SUMMARY_CFG = [
  { key: 'pending',  icon: 'clock',        label: 'Awaiting Review', color: 'text-warning' },
  { key: 'approved', icon: 'check-circle', label: 'Verified',        color: 'text-success' },
  { key: 'rejected', icon: 'x-circle',     label: 'Rejected',        color: 'text-danger'  },
]

const TABS = ['All', 'pending', 'approved', 'rejected']

function Skeleton() {
  return [...Array(5)].map((_, i) => (
    <tr key={i} className="border-b border-line">
      {[...Array(6)].map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 bg-canvas-2 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  ))
}

export default function AdminCompanies() {
  const qc = useQueryClient()
  const [tab,      setTab]      = useState('All')
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [expanded, setExpanded] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  const params = {
    limit: 20,
    page,
    ...(tab !== 'All' && { status: tab }),
  }

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin-companies', params],
    queryFn:  () => adminAPI.companies(params).then(r => r.data.data ?? r.data),
    keepPreviousData: true,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveCompany(id),
    onSuccess:  () => {
      toast.success('Company approved')
      qc.invalidateQueries({ queryKey: ['admin-companies'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      qc.invalidateQueries({ queryKey: ['admin-companies-pending'] })
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectCompany(id),
    onSuccess:  () => {
      toast.success('Company rejected')
      qc.invalidateQueries({ queryKey: ['admin-companies'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      qc.invalidateQueries({ queryKey: ['admin-companies-pending'] })
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  })

  const companies  = Array.isArray(data) ? data : (data?.data ?? [])
  const pagination = data?.pagination

  const filtered = companies.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (c.name || '').toLowerCase().includes(q) ||
           (c.email || '').toLowerCase().includes(q) ||
           (c.industry || '').toLowerCase().includes(q)
  })

  const counts = {
    pending:  companies.filter(c => c.status === 'pending').length,
    approved: companies.filter(c => c.status === 'approved').length,
    rejected: companies.filter(c => c.status === 'rejected').length,
  }

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl">
      <ConfirmModal
        open={Boolean(confirmation)}
        title={confirmation?.action === 'approve' ? 'Approve company?' : 'Reject company?'}
        description={confirmation ? `${confirmation.company.name} will be ${confirmation.action === 'approve' ? 'approved' : 'rejected'}.` : ''}
        confirmLabel={confirmation?.action === 'approve' ? 'Approve company' : 'Reject company'}
        variant={confirmation?.action === 'reject' ? 'danger' : 'primary'}
        isPending={approveMutation.isPending || rejectMutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (!confirmation) return
          const mutation = confirmation.action === 'approve' ? approveMutation : rejectMutation
          mutation.mutate(confirmation.company.id, {
            onSettled: () => setConfirmation(null),
          })
        }}
      />

      <div className="mb-7 animate-fade-up">
        <h1 className="text-2xl font-extrabold text-ink">Company Management</h1>
        <p className="text-ink-3 text-sm mt-1">
          {isPending ? <span role="status" aria-label="Loading companies" className="inline-block h-3.5 w-36 rounded bg-canvas-2 animate-shimmer" /> : isError ? 'Companies could not be loaded' : `${pagination?.total ?? companies.length} companies registered`}
          {counts.pending > 0 && (
            <span className="ml-2 text-warning font-semibold">· {counts.pending} pending approval</span>
          )}
        </p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {SUMMARY_CFG.map(({ key, icon, label, color }) => (
          <button key={key}
            onClick={() => { setTab(tab === key ? 'All' : key); setPage(1) }}
            className={clsx('tile', tab === key && 'ring-2 ring-brand')}>
            <div className="tile-icon"><Icon name={icon} className={clsx('w-5 h-5', color)} /></div>
            <div>
              <div className="text-2xl font-extrabold text-ink">{isError ? 'N/A' : counts[key]}</div>
              <div className="text-xs text-ink-3">{label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-canvas-2 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1) }}
              className={clsx('px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                tab === t ? 'bg-white text-ink shadow-sm' : 'text-ink-3 hover:text-ink'
              )}>{t}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search companies..." />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4">
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
                {['Company','Industry','Size','Registered','Status','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-ink-4 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isPending ? <Skeleton /> : isError ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center"><Icon name="alert-circle" size={28} className="mx-auto mb-2 text-warning" /><p className="text-sm font-semibold text-ink-2">Could not load companies</p></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Icon name="building" size={40} className="mx-auto mb-3 text-line-2" />
                    <p className="text-ink-4 text-sm font-medium">No companies found</p>
                  </td>
                </tr>
              ) : filtered.map((co) => {
                const dateRaw    = co.registered_at || co.created_at
                const date       = dateRaw ? new Date(dateRaw).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : '—'
                                const isExpanded = expanded === co.id
                const initials   = (co.name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <>
                    <tr key={co.id} className={clsx('hover:bg-canvas/80 transition-colors', isExpanded && 'bg-brand-soft/30')}>
                      <td className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : co.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink">{co.name}</p>
                            <p className="text-xs text-ink-4">{co.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-3">{co.industry || '—'}</td>
                      <td className="px-5 py-4 text-sm text-ink-3">{co.company_size || '—'}</td>
                      <td className="px-5 py-4 text-sm text-ink-4 whitespace-nowrap">{date}</td>
                      <td className="px-5 py-4"><StatusPill status={co.status} label={co.status === 'approved' ? 'Verified' : undefined} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {co.status === 'pending' && (
                            <>
                              <button onClick={() => setConfirmation({ action: 'approve', company: co })}
                                disabled={approveMutation.isPending}
                                className="btn btn-sm bg-success-light text-success-dark hover:bg-success hover:text-white flex items-center gap-1 transition-all">
                                <Icon name="check-circle" size={14} /> Approve
                              </button>
                              <button onClick={() => setConfirmation({ action: 'reject', company: co })}
                                disabled={rejectMutation.isPending}
                                className="btn btn-sm bg-danger-light text-danger hover:bg-danger hover:text-white flex items-center gap-1 transition-all">
                                <Icon name="x-circle" size={14} /> Reject
                              </button>
                            </>
                          )}
                          {co.status === 'approved' && (
                            <button onClick={() => setConfirmation({ action: 'reject', company: co })}
                              disabled={rejectMutation.isPending}
                              className="btn btn-sm bg-canvas-2 text-ink-3 hover:bg-danger-light hover:text-danger transition-all">
                              Revoke
                            </button>
                          )}
                          {co.status === 'rejected' && (
                            <button onClick={() => setConfirmation({ action: 'approve', company: co })}
                              disabled={approveMutation.isPending}
                              className="btn btn-sm bg-success-light text-success-dark hover:bg-success hover:text-white transition-all">
                              Approve
                            </button>
                          )}
                          <button onClick={() => setExpanded(isExpanded ? null : co.id)}
                            className="btn btn-sm bg-canvas-2 text-ink-3 hover:bg-canvas-2">
                            {isExpanded ? 'Less' : 'More'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${co.id}-exp`} className="bg-brand-soft/20">
                        <td colSpan={6} className="px-5 pb-5 pt-2">
                          <div className="bg-white rounded-xl border border-line p-5 grid sm:grid-cols-3 gap-5">
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Contact</p>
                              <p className="text-sm text-ink-2">{co.contact_name || co.email}</p>
                              <p className="text-sm text-ink-3 mt-1">{co.contact_phone || '—'}</p>
                              <p className="text-sm text-ink-3">{co.contact_email || co.email}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Company info</p>
                              <p className="text-sm text-ink-2">{co.industry || '—'}</p>
                              <p className="text-sm text-ink-3">{co.company_size ? `${co.company_size} employees` : '—'}</p>
                              {co.website && (
                                <a href={co.website} target="_blank" rel="noreferrer"
                                  className="text-sm text-brand hover:underline">{co.website}</a>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Activity</p>
                              <p className="text-sm text-ink-2">{co.opportunity_count ?? 0} opportunities posted</p>
                              <p className="text-sm text-ink-3">{co.application_count ?? 0} applications received</p>
                              <p className="text-sm text-ink-3">{co.placement_count ?? 0} students placed</p>
                            </div>
                            {co.description && (
                              <div className="sm:col-span-3">
                                <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">About</p>
                                <p className="text-sm text-ink-2 leading-relaxed">{co.description}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
          <span className="text-sm text-ink-3">Page {page} of {pagination.total_pages}</span>
          <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}
            className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
