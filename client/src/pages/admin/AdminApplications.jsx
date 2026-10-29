import { Fragment, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import Icon from '@/components/Icon'
import StatusPill from '@/components/ui/StatusPill'
import CvPreviewModal from '@/components/ui/CvPreviewModal'
import { adminAPI } from '@/api/admin'
import { filesAPI } from '@/api/company'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUSES = ['pending', 'shortlisted', 'placed', 'rejected']
const TABS = ['All', ...STATUSES]
const PAGE_SIZE = 25
const LEVEL = { diploma: 'Diploma', degree: 'Degree' }

const yearLabel = (y, empty = 'Not set') => {
  if (!y) return empty
  if (Number(y) === 7) return 'Postgraduate'
  if (Number(y) === 8) return 'Recent graduate'
  return 'Year ' + y
}

const dateLabel = (value, empty = 'Not set') =>
  value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : empty

const csvCell = (v) => {
  let s = v == null ? '' : String(v).replace(/\r?\n/g, ' ')
  if (/^[=+\-@\t]/.test(s) && !/^\+?[0-9][0-9 ]*$/.test(s)) s = "'" + s
  return '"' + s.replace(/"/g, '""') + '"'
}

const CSV_HEAD = [
  'Name', 'Email', 'Phone', 'Institution', 'Level', 'Discipline', 'Course',
  'Year of study', 'Attachment expected', 'City', 'Opportunity', 'Company',
  'Status', 'Applied', 'Notes',
]

const csvRow = (a) => {
  const s = a.student || {}
  return [
    s.name, s.email, s.phone, s.university, LEVEL[s.education_level] || '', s.discipline, s.course,
    yearLabel(s.year_of_study, ''), s.attachment_window, s.city, a.opportunity_title, a.company_name,
    a.status, dateLabel(a.applied_at || a.created_at, ''), a.cover_letter,
  ]
}

function Skeleton() {
  return [...Array(6)].map((_, i) => (
    <tr key={i} className="border-b border-line">
      {[...Array(8)].map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 bg-canvas-2 rounded animate-shimmer w-3/4" />
        </td>
      ))}
    </tr>
  ))
}

export default function AdminApplications() {
  const qc = useQueryClient()
  const [tab, setTab]           = useState('All')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [oppId, setOppId]       = useState('')
  const [expanded, setExpanded] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [cvPreview, setCvPreview] = useState(null)
  const cvRequest = useRef(0)

  const term = search.trim().toLowerCase()
  const filters = {
    ...(tab !== 'All' && { status: tab }),
    ...(oppId && { opportunity_id: oppId }),
  }
  const params = { ...filters, page: term ? 1 : page, limit: term ? 500 : PAGE_SIZE }

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin-applications-full', params],
    queryFn: () => adminAPI.applicationsFull(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  const { data: counts } = useQuery({
    queryKey: ['admin-application-counts', oppId],
    queryFn: () => adminAPI.statusCounts({ opportunity_id: oppId || undefined }).then((r) => r.data.data),
  })

  const { data: oppOptions = [] } = useQuery({
    queryKey: ['admin-opportunity-options'],
    queryFn: () => adminAPI.opportunityOptions().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateAppStatus(id, { status }),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['admin-applications-full'] })
      qc.invalidateQueries({ queryKey: ['admin-application-counts'] })
      qc.invalidateQueries({ queryKey: ['admin-applications'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: (e) => toast.error(e?.message || 'Update failed'),
  })

  const matches = (a) => {
    if (!term) return true
    const s = a.student || {}
    return [s.name, s.email, s.phone, s.university, a.opportunity_title, a.company_name]
      .some((v) => (v || '').toLowerCase().includes(term))
  }

  const rows = (data?.data ?? []).filter(matches)
  const pagination = term ? null : data?.pagination
  const total = counts ? STATUSES.reduce((n, k) => n + (counts[k] ?? 0), 0) : null

  const openCV = async (cvPath) => {
    const requestId = ++cvRequest.current
    setCvPreview({ loading: true, url: null })
    try {
      const { data: signed } = await filesAPI.cvSignedUrl(encodeURIComponent(cvPath))
      const url = signed.url || signed.signedUrl
      if (!url) throw new Error('Signed CV URL is missing')
      if (cvRequest.current === requestId) setCvPreview({ loading: false, url })
    } catch {
      if (cvRequest.current === requestId) {
        setCvPreview(null)
        toast.error('Could not load CV')
      }
    }
  }

  const closeCv = () => {
    cvRequest.current += 1
    setCvPreview(null)
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await adminAPI.applicationsFull({ ...filters, page: 1, limit: 1000 })
      const list = (res.data.data ?? []).filter(matches)
      if (!list.length) { toast.error('Nothing to export'); return }
      const csv = '\ufeff' + [CSV_HEAD, ...list.map(csvRow)].map((r) => r.map(csvCell).join(',')).join('\r\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'nexlynk-applications-' + new Date().toISOString().slice(0, 10) + '.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(list.length + ' applications exported')
    } catch (e) {
      toast.error(e?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const pick = (fn) => (v) => { fn(v); setPage(1); setExpanded(null) }

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      <CvPreviewModal
        open={Boolean(cvPreview)}
        url={cvPreview?.url}
        loading={cvPreview?.loading ?? false}
        onClose={closeCv}
      />

      <div className="mb-7 flex flex-wrap items-start justify-between gap-3 animate-fade-up">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-ink">All Applications</h1>
          <p className="text-ink-3 text-sm mt-1">
            {isPending
              ? <span role="status" aria-label="Loading applications" className="inline-block h-4 w-36 rounded bg-canvas-2 animate-shimmer" />
              : isError
                ? 'Applications could not be loaded'
                : `${total ?? pagination?.total ?? rows.length} total applications`}
            {(counts?.placed ?? 0) > 0 && (
              <span className="ml-2 text-success font-semibold">· {counts.placed} placements confirmed</span>
            )}
          </p>
        </div>
        <button type="button" onClick={exportCsv} disabled={exporting || isError}
          className="btn-secondary text-sm whitespace-nowrap">
          <Icon name="upload" size={16} /> {exporting ? 'Preparing...' : 'Export to spreadsheet'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATUSES.map((key) => (
          <button key={key}
            onClick={() => pick(setTab)(tab === key ? 'All' : key)}
            className={clsx('card p-4 text-left hover:shadow-card-hover transition-all', tab === key && 'ring-2 ring-brand')}>
            <div className="font-extrabold text-2xl text-ink mb-1">{counts ? counts[key] ?? 0 : '...'}</div>
            <StatusPill status={key} />
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-canvas-2 rounded-xl p-1 flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => pick(setTab)(t)}
              className={clsx('px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap',
                tab === t ? 'bg-white text-ink shadow-sm' : 'text-ink-3 hover:text-ink')}>
              {t}
            </button>
          ))}
        </div>
        <select value={oppId} onChange={(e) => pick(setOppId)(e.target.value)}
          className="input lg:max-w-xs" aria-label="Filter by opportunity">
          <option value="">All opportunities</option>
          {oppOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.title}{o.company_name ? ' (' + o.company_name + ')' : ''}</option>
          ))}
        </select>
        <div className="relative w-full flex-1 lg:max-w-sm">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setExpanded(null) }}
            className="input pl-10" placeholder="Search name, email, phone, institution..." />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-canvas border-b border-line">
                {['Student', 'Institution', 'Opportunity', 'Company', 'Applied', 'Status', 'Update', 'Details'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-ink-4 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isPending ? <Skeleton /> : isError ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <Icon name="alert-circle" size={28} className="mx-auto mb-2 text-warning" />
                  <p className="text-sm font-semibold text-ink-2">Could not load applications</p>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <Icon name="file" size={40} className="mx-auto mb-3 text-line-2" />
                  <p className="text-ink-4 text-sm font-medium">No applications found</p>
                  {search && <button onClick={() => setSearch('')} className="btn-primary btn-sm mt-3">Clear search</button>}
                </td></tr>
              ) : rows.map((a) => {
                const s = a.student || {}
                const name = s.name || 'Unnamed student'
                const isOpen = expanded === a.id
                const skills = Array.isArray(s.skills) ? s.skills : []
                return (
                  <Fragment key={a.id}>
                    <tr className={clsx('hover:bg-canvas/80 transition-colors', isOpen && 'bg-brand-soft/30')}>
                      <td className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : a.id)}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {name[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink">{name}</p>
                            <p className="text-xs text-ink-4">{s.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-3 max-w-[160px] truncate">{s.university || 'Not set'}</td>
                      <td className="px-5 py-4 text-sm text-ink-2 font-medium max-w-[160px] truncate">{a.opportunity_title || 'Not set'}</td>
                      <td className="px-5 py-4 text-sm text-ink-3 whitespace-nowrap">{a.company_name || 'Not set'}</td>
                      <td className="px-5 py-4 text-sm text-ink-4 whitespace-nowrap">{dateLabel(a.applied_at || a.created_at, 'Not set')}</td>
                      <td className="px-5 py-4"><StatusPill status={a.status} /></td>
                      <td className="px-5 py-4">
                        <select
                          value={a.status}
                          onChange={(e) => statusMutation.mutate({ id: a.id, status: e.target.value })}
                          disabled={statusMutation.isPending}
                          className="text-xs border border-line-2 rounded-lg px-2.5 py-1.5 bg-canvas font-medium text-ink-2 outline-none focus:border-brand cursor-pointer hover:border-brand transition-colors"
                        >
                          {STATUSES.map((st) => <option key={st} value={st} className="capitalize">{st[0].toUpperCase() + st.slice(1)}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setExpanded(isOpen ? null : a.id)}
                          className="btn btn-sm bg-canvas-2 text-ink-3 hover:bg-canvas-2">
                          {isOpen ? 'Less' : 'More'}
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-brand-soft/20">
                        <td colSpan={8} className="px-5 pb-5 pt-2">
                          <div className="bg-white rounded-xl border border-line p-5 grid sm:grid-cols-3 gap-5">
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Contact</p>
                              <p className="text-sm text-ink-2 break-all">{s.email || 'No email'}</p>
                              <p className="text-sm text-ink-3 mt-1">{s.phone || 'No phone number'}</p>
                              <p className="text-sm text-ink-3">{s.city || 'City not set'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Academic</p>
                              <p className="text-sm text-ink-2">{s.university || 'Institution not set'}</p>
                              <p className="text-sm text-ink-3">{LEVEL[s.education_level] || 'Level not set'}</p>
                              <p className="text-sm text-ink-3">{s.discipline || 'Discipline not set'}</p>
                              <p className="text-sm text-ink-3">{s.course || 'Course not set'}</p>
                              <p className="text-sm text-ink-3">{yearLabel(s.year_of_study)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Attachment</p>
                              <p className="text-sm text-ink-2">{s.attachment_window || 'Period not set'}</p>
                              <p className="text-sm text-ink-3">{s.availability || 'Availability not set'}</p>
                              <p className="text-sm text-ink-3">Applied {dateLabel(a.applied_at || a.created_at)}</p>
                              {s.cv_path ? (
                                <button type="button" onClick={() => openCV(s.cv_path)}
                                  className="btn btn-sm bg-canvas-2 text-ink-2 hover:bg-canvas-2 mt-3 inline-flex items-center gap-1.5">
                                  <Icon name="file" size={14} /> View CV
                                </button>
                              ) : (
                                <p className="text-sm text-warning-dark mt-3">No CV uploaded</p>
                              )}
                            </div>
                            {a.cover_letter && (
                              <div className="sm:col-span-3">
                                <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Notes from the student</p>
                                <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">{a.cover_letter}</p>
                              </div>
                            )}
                            {skills.length > 0 && (
                              <div className="sm:col-span-3">
                                <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {skills.map((sk) => (
                                    <span key={sk} className="text-[11px] font-semibold px-2.5 py-1 bg-brand-soft text-brand-ink rounded-full">{sk}</span>
                                  ))}
                                </div>
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

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => { setPage((p) => p - 1); setExpanded(null) }}
            className="btn-secondary btn-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-ink-3">Page {page} of {pagination.total_pages}</span>
          <button disabled={page >= pagination.total_pages} onClick={() => { setPage((p) => p + 1); setExpanded(null) }}
            className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
