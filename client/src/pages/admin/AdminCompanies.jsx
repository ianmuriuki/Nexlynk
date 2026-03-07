import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, X, CheckCircle, XCircle, ChevronDown, Building2, ExternalLink } from 'lucide-react'
import { adminAPI } from '@/api/client'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_CFG = {
  pending:  { cls: 'badge-pending-co', label: 'Pending'  },
  approved: { cls: 'badge-approved',   label: 'Verified' },
  rejected: { cls: 'badge-rejected',   label: 'Rejected' },
}

const TABS = ['All', 'pending', 'approved', 'rejected']

function Skeleton() {
  return [...Array(5)].map((_, i) => (
    <tr key={i} className="border-b border-slate-100">
      {[...Array(5)].map((_, j) => (
        <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" /></td>
      ))}
    </tr>
  ))
}

export default function AdminCompanies() {
  const qc = useQueryClient()
  const [tab,    setTab]    = useState('All')
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [expanded, setExpanded] = useState(null)

  const params = {
    limit: 20,
    page,
    ...(tab !== 'All' && { status: tab }),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', params],
    queryFn:  () => adminAPI.companies(params).then(r => r.data),
    keepPreviousData: true,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveCompany(id),
    onSuccess:  () => { toast.success('Company approved ✓'); qc.invalidateQueries(['admin-companies']); qc.invalidateQueries(['admin-dashboard']) },
    onError:    (e) => toast.error(e?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectCompany(id),
    onSuccess:  () => { toast.success('Company rejected'); qc.invalidateQueries(['admin-companies']) },
    onError:    (e) => toast.error(e?.message || 'Failed'),
  })

  const companies  = data?.data ?? data ?? []
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

      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="font-serif text-2xl font-bold text-navy">Company Management</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isLoading ? 'Loading...' : `${pagination?.total ?? companies.length} companies registered`}
          {counts.pending > 0 && <span className="ml-2 text-warning font-semibold">· {counts.pending} pending approval</span>}
        </p>
      </motion.div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { key: 'pending',  icon: '⏳', color: 'text-warning-dark',  bg: 'bg-warning-light',  label: 'Awaiting Review'  },
          { key: 'approved', icon: '✅', color: 'text-success-dark',  bg: 'bg-success-light',  label: 'Verified'         },
          { key: 'rejected', icon: '❌', color: 'text-danger',        bg: 'bg-danger-light',   label: 'Rejected'         },
        ].map(({ key, icon, color, bg, label }) => (
          <button key={key} onClick={() => { setTab(tab === key ? 'All' : key); setPage(1) }}
            className={clsx('card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all',
              tab === key && 'ring-2 ring-blue-DEFAULT'
            )}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${bg}`}>{icon}</div>
            <div>
              <div className={`font-serif text-2xl font-bold ${color}`}>{counts[key]}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1) }}
              className={clsx('px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                tab === t ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
              )}>{t}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search companies..." />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Company', 'Industry', 'Size', 'Registered', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? <Skeleton /> : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">No companies found</p>
                  </td>
                </tr>
              ) : filtered.map((co) => {
                const date       = co.created_at ? new Date(co.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : '—'
                const cfg        = STATUS_CFG[co.status] || STATUS_CFG.pending
                const isExpanded = expanded === co.id
                const initials   = (co.name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <>
                    <tr key={co.id} className={clsx('hover:bg-slate-50/80 transition-colors', isExpanded && 'bg-blue-50/30')}>
                      <td className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : co.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initials}</div>
                          <div>
                            <p className="text-sm font-semibold text-navy">{co.name}</p>
                            <p className="text-xs text-slate-400">{co.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{co.industry || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{co.company_size || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-400 whitespace-nowrap">{date}</td>
                      <td className="px-5 py-4"><span className={cfg.cls}>{cfg.label}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {co.status === 'pending' && (
                            <>
                              <button onClick={() => approveMutation.mutate(co.id)} disabled={approveMutation.isPending}
                                className="btn btn-sm bg-success-light text-success-dark hover:bg-success hover:text-white flex items-center gap-1 transition-all">
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button onClick={() => rejectMutation.mutate(co.id)} disabled={rejectMutation.isPending}
                                className="btn btn-sm bg-danger-light text-danger hover:bg-danger hover:text-white flex items-center gap-1 transition-all">
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}
                          {co.status === 'approved' && (
                            <button onClick={() => rejectMutation.mutate(co.id)} disabled={rejectMutation.isPending}
                              className="btn btn-sm bg-slate-100 text-slate-500 hover:bg-danger-light hover:text-danger transition-all">
                              Revoke
                            </button>
                          )}
                          {co.status === 'rejected' && (
                            <button onClick={() => approveMutation.mutate(co.id)} disabled={approveMutation.isPending}
                              className="btn btn-sm bg-success-light text-success-dark hover:bg-success hover:text-white transition-all">
                              Approve
                            </button>
                          )}
                          <button onClick={() => setExpanded(isExpanded ? null : co.id)}
                            className="btn btn-sm bg-slate-100 text-slate-500 hover:bg-slate-200">
                            {isExpanded ? 'Less' : 'More'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {isExpanded && (
                      <tr key={`${co.id}-exp`} className="bg-blue-50/20">
                        <td colSpan={6} className="px-5 pb-5 pt-2">
                          <div className="bg-white rounded-xl border border-blue-100 p-5 grid sm:grid-cols-3 gap-5">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact</p>
                              <p className="text-sm text-slate-700">{co.email}</p>
                              <p className="text-sm text-slate-500 mt-1">{co.phone || '—'}</p>
                              <p className="text-sm text-slate-500">{co.location || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company info</p>
                              <p className="text-sm text-slate-700">{co.industry || '—'}</p>
                              <p className="text-sm text-slate-500">{co.company_size ? `${co.company_size} employees` : '—'}</p>
                              <p className="text-sm text-slate-500">{co.website || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Activity</p>
                              <p className="text-sm text-slate-700">{co.opportunity_count ?? 0} opportunities posted</p>
                              <p className="text-sm text-slate-500">{co.application_count ?? 0} applications received</p>
                              <p className="text-sm text-slate-500">{co.placement_count ?? 0} students placed</p>
                            </div>
                            {co.description && (
                              <div className="sm:col-span-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{co.description}</p>
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

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {pagination.total_pages}</span>
          <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
