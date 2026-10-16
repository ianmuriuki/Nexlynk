import { useRef, Fragment, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Icon from '@/components/Icon'
import StatusPill from '@/components/ui/StatusPill'
import CvPreviewModal from '@/components/ui/CvPreviewModal'
import { companyAPI, filesAPI } from '@/api/company'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_CFG = {
  pending:     { label: 'Pending'     },
  shortlisted: { label: 'Shortlisted' },
  placed:      { label: 'Placed'      },
  rejected:    { label: 'Rejected'    },
}

const AVATAR_COLORS = ['bg-brand','bg-success','bg-info','bg-warning','bg-danger','bg-ink-4']

function avatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function Skeleton() {
  return [...Array(5)].map((_, i) => (
    <tr key={i} className="border-b border-line">
      {[...Array(6)].map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 bg-canvas-2 rounded animate-shimmer w-3/4" />
        </td>
      ))}
    </tr>
  ))
}

export default function CompanyApplicants() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('All')
  const [oppFilter, setOpp]   = useState('All')
  const [page,    setPage]    = useState(1)
  const [expanded, setExpanded] = useState(null)
  const [cvPreview, setCvPreview] = useState(null)
  const cvPreviewRequest = useRef(0)

  // Fetch company opportunities for the filter dropdown
  const { data: oppsData } = useQuery({
    queryKey: ['company-opportunities', user?.id],
    queryFn:  () => companyAPI.getOpportunities(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const params = {
    limit: 20,
    page,
    ...(status   !== 'All' && { status }),
    ...(oppFilter !== 'All' && { opportunity_id: oppFilter }),
  }

  const { data, isPending, isError } = useQuery({
    queryKey: ['company-applicants', user?.id, params],
    queryFn:  () => companyAPI.getApplicants(user.id, params).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
    keepPreviousData: true,
  })

  const statusMutation = useMutation({
    mutationFn: ({ appId, newStatus }) => companyAPI.updateAppStatus(user.id, appId, { status: newStatus }),
    onSuccess:  () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['company-applicants', user?.id] })
      qc.invalidateQueries({ queryKey: ['company-profile', user?.id] })
    },
    onError: (e) => toast.error(e?.message || 'Update failed'),
  })

  const openCV = async (cvPath) => {
    const requestId = ++cvPreviewRequest.current
    setCvPreview({ loading: true, url: null })

    try {
      const encodedPath = encodeURIComponent(cvPath)
      const { data } = await filesAPI.cvSignedUrl(encodedPath)
      const url = data.url || data.signedUrl
      if (!url) throw new Error('Signed CV URL is missing')

      if (cvPreviewRequest.current === requestId) {
        setCvPreview({ loading: false, url })
      }
    } catch {
      if (cvPreviewRequest.current === requestId) {
        setCvPreview(null)
        toast.error('Could not load CV')
      }
    }
  }

  const closeCvPreview = () => {
    cvPreviewRequest.current += 1
    setCvPreview(null)
  }

  const allApps   = data?.data ?? data ?? []
  const pagination = data?.pagination
  const opps      = oppsData?.data ?? oppsData ?? []

  // Client-side text search on top of server results
  const filtered = allApps.filter(a => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name    = (a.student?.name || '').toLowerCase()
    const uni     = (a.student?.university || '').toLowerCase()
    const oppTitle = (a.opportunity?.title || '').toLowerCase()
    return name.includes(q) || uni.includes(q) || oppTitle.includes(q)
  })

  const statusCounts = ['pending','shortlisted','placed','rejected'].reduce((acc, s) => {
    acc[s] = allApps.filter(a => a.status === s).length
    return acc
  }, {})

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl">
      <CvPreviewModal
        open={Boolean(cvPreview)}
        url={cvPreview?.url}
        loading={cvPreview?.loading ?? false}
        onClose={closeCvPreview}
      />

      <div className="mb-7 animate-fade-up">
        <h1 className="text-2xl font-extrabold text-ink">Applicants</h1>
        <p className="text-ink-3 text-sm mt-1">
          {isPending ? <span role="status" aria-label="Loading applicants" className="inline-block h-4 w-36 rounded bg-canvas-2 animate-shimmer" /> : isError ? 'Applicants could not be loaded' : `${pagination?.total ?? allApps.length} total applicant${(pagination?.total ?? allApps.length) !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button key={key} onClick={() => { setStatus(status === key ? 'All' : key); setPage(1) }}
            className={clsx('card p-4 text-left hover:shadow-card-hover transition-all',
              status === key && 'ring-2 ring-brand'
            )}>
            <div className="tabular-nums text-2xl font-extrabold text-ink mb-0.5">{isError ? 'N/A' : statusCounts[key] ?? 0}</div>
            <StatusPill status={key} />
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search by name, university, or role..." />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        {/* Opportunity filter */}
        <div className="relative">
          <select value={oppFilter} onChange={e => { setOpp(e.target.value); setPage(1) }}
            className="input pr-9 min-w-[200px] appearance-none cursor-pointer">
            <option value="All">All opportunities</option>
            {opps.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
          <Icon name="chevron-down" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-4" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="input pr-9 appearance-none cursor-pointer">
            <option value="All">All statuses</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <Icon name="chevron-down" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-4" />
        </div>

        {(status !== 'All' || oppFilter !== 'All' || search) && (
          <button onClick={() => { setStatus('All'); setOpp('All'); setSearch(''); setPage(1) }}
            className="btn-secondary btn-sm px-3 flex items-center gap-1.5 whitespace-nowrap">
            <Icon name="x" size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-canvas border-b border-line">
                {['Applicant', 'Opportunity', 'Skills', 'Applied', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-ink-4 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isPending ? <Skeleton /> : isError ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center"><Icon name="alert-circle" size={28} className="mx-auto mb-2 text-warning" /><p className="text-sm font-semibold text-ink-2">Could not load applicants</p></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <p className="text-ink-4 text-sm font-medium">No applicants found</p>
                    <p className="text-ink-4 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : filtered.map((a) => {
                const name       = a.student?.name || 'Applicant'
                const university = a.student?.university || ''
                const course     = a.student?.course || ''
                const skills     = a.student?.skills || []
                const oppTitle   = a.opportunity?.title || '—'
                const oppType    = a.opportunity?.type || ''
                const cvPath     = a.student?.cv_path
                const date       = a.created_at
                  ? new Date(a.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short' }) : '—'
                const isExpanded = expanded === a.id
                const color      = avatarColor(name)

                return (
                  <Fragment key={a.id}>
                    <tr key={a.id} className={clsx('hover:bg-canvas/80 transition-colors cursor-pointer', isExpanded && 'bg-brand-soft/40')}>
                      <td className="px-5 py-4" onClick={() => setExpanded(isExpanded ? null : a.id)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink">{name}</p>
                            <p className="text-xs text-ink-4 truncate max-w-[160px]">
                              {university}{course ? ` · ${course}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-ink-2 font-medium truncate max-w-[160px]">{oppTitle}</p>
                        {oppType && <p className="text-xs text-ink-4 capitalize mt-0.5">{oppType}</p>}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {skills.length === 0
                            ? <span className="text-xs text-ink-4">—</span>
                            : skills.slice(0, 3).map(s => (
                              <span key={s} className="text-[10px] font-semibold px-2 py-0.5 bg-brand-soft text-brand-ink rounded-full">{s}</span>
                            ))
                          }
                          {skills.length > 3 && <span className="text-[10px] text-ink-4">+{skills.length - 3}</span>}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-ink-4 whitespace-nowrap">{date}</td>

                      <td className="px-5 py-4">
                        <StatusPill status={a.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {a.status === 'pending' && (
                            <>
                              <button
                                onClick={() => statusMutation.mutate({ appId: a.id, newStatus: 'shortlisted' })}
                                disabled={statusMutation.isPending}
                                className="btn btn-sm bg-brand-soft text-brand hover:bg-brand hover:text-white transition-all"
                              >Shortlist</button>
                              <button
                                onClick={() => statusMutation.mutate({ appId: a.id, newStatus: 'rejected' })}
                                disabled={statusMutation.isPending}
                                className="btn btn-sm bg-danger-light text-danger hover:bg-danger hover:text-white transition-all"
                              >Reject</button>
                            </>
                          )}
                          {a.status === 'shortlisted' && (
                            <button
                              onClick={() => statusMutation.mutate({ appId: a.id, newStatus: 'placed' })}
                              disabled={statusMutation.isPending}
                              className="btn btn-sm bg-success-light text-success-dark hover:bg-success hover:text-white transition-all"
                            >Mark placed ✓</button>
                          )}
                          {cvPath && (
                            <button onClick={() => openCV(cvPath)}
                              className="btn btn-sm bg-canvas-2 text-ink-2 hover:bg-canvas-2 flex items-center gap-1">
                              <Icon name="external" size={12} /> CV
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row — full profile details */}
                    {isExpanded && (
                      <tr key={`${a.id}-expanded`} className="bg-brand-soft/30">
                        <td colSpan={6} className="px-5 pb-5 pt-2">
                          <div className="bg-white rounded-xl border border-brand-soft p-5 grid sm:grid-cols-3 gap-5">
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Contact</p>
                              <p className="text-sm text-ink-2">{a.student?.email || user?.email || '—'}</p>
                              <p className="text-sm text-ink-3 mt-1">{a.student?.phone || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Academic</p>
                              <p className="text-sm text-ink-2">{university || '—'}</p>
                              <p className="text-sm text-ink-3">{course}{a.student?.year ? ` · ${a.student.year}` : ''}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">All skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {skills.length === 0
                                  ? <span className="text-sm text-ink-4">No skills listed</span>
                                  : skills.map(s => (
                                    <span key={s} className="text-[11px] font-semibold px-2.5 py-1 bg-brand-soft text-brand-ink rounded-full border border-brand-soft">{s}</span>
                                  ))
                                }
                              </div>
                            </div>
                            {a.student?.about && (
                              <div className="sm:col-span-3">
                                <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">About</p>
                                <p className="text-sm text-ink-2 leading-relaxed">{a.student.about}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
          <span className="text-sm text-ink-3">Page {page} of {pagination.total_pages}</span>
          <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}