import { Fragment, useEffect, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import Icon from '@/components/Icon'
import { adminAPI } from '@/api/admin'
import clsx from 'clsx'

const PAGE_SIZE = 20

const TABS = [
  { key: 'All',     label: 'All' },
  { key: 'with_cv', label: 'With CV' },
  { key: 'no_cv',   label: 'No CV' },
]

const yearLabel = (y) => {
  if (!y) return '—'
  if (Number(y) === 7) return 'Postgraduate'
  if (Number(y) === 8) return 'Recent graduate'
  return 'Year ' + y
}

const shortDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Skeleton() {
  return [...Array(6)].map((_, i) => (
    <tr key={i} className="border-b border-line">
      {[...Array(6)].map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 bg-canvas-2 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  ))
}

export default function AdminUsers() {
  const [tab, setTab]           = useState('All')
  const [search, setSearch]     = useState('')
  const [query, setQuery]       = useState('')
  const [page, setPage]         = useState(1)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const id = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(id)
  }, [search])

  const params = { page, limit: PAGE_SIZE, search: query, cv: tab === 'All' ? undefined : tab }

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin-students', params],
    queryFn: () => adminAPI.students(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  const students   = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      <div className="mb-7 animate-fade-up">
        <h1 className="text-2xl font-extrabold text-ink">User Management</h1>
        <p className="text-ink-3 text-sm mt-1">
          {isPending
            ? <span role="status" aria-label="Loading students" className="inline-block h-3.5 w-36 rounded bg-canvas-2 animate-shimmer" />
            : isError
              ? 'Students could not be loaded'
              : `${pagination?.total ?? students.length} students registered`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-canvas-2 rounded-xl p-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setExpanded(null) }}
              className={clsx('px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                tab === t.key ? 'bg-white text-ink shadow-sm' : 'text-ink-3 hover:text-ink'
              )}>{t.label}</button>
          ))}
        </div>
        <div className="relative w-full flex-1 sm:max-w-xs">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search name, university or course..." />
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
                {['Student', 'University and course', 'Discipline', 'Joined', 'Profile', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-ink-4 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isPending ? <Skeleton /> : isError ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center">
                  <Icon name="alert-circle" size={28} className="mx-auto mb-2 text-warning" />
                  <p className="text-sm font-semibold text-ink-2">Could not load students</p>
                </td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center">
                  <Icon name="users" size={40} className="mx-auto mb-3 text-line-2" />
                  <p className="text-ink-4 text-sm font-medium">No students found</p>
                </td></tr>
              ) : students.map((s) => {
                const isExpanded = expanded === s.id
                const name       = s.name || 'Unnamed student'
                const initials   = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                const completion = Number(s.profile_completion) || 0
                const skills     = Array.isArray(s.skills) ? s.skills : []

                return (
                  <Fragment key={s.id}>
                    <tr className={clsx('hover:bg-canvas/80 transition-colors', isExpanded && 'bg-brand-soft/30')}>
                      <td className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : s.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink">{name}</p>
                            <p className="text-xs text-ink-4">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-ink-2">{s.university || '—'}</p>
                        <p className="text-xs text-ink-4">{s.course || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-3">{s.discipline || '—'}</td>
                      <td className="px-5 py-4 text-sm text-ink-4 whitespace-nowrap">{shortDate(s.joined_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 min-w-[96px]">
                          <div className="h-1.5 w-16 bg-canvas-2 rounded-full overflow-hidden">
                            <div className="h-full bg-brand rounded-full" style={{ width: completion + '%' }} />
                          </div>
                          <span className="text-xs font-semibold text-ink-3 tabular-nums">{completion}%</span>
                        </div>
                        <p className={clsx('mt-1 text-[11px] font-semibold', s.cv_path ? 'text-success-dark' : 'text-ink-4')}>
                          {s.cv_path ? 'CV uploaded' : 'No CV'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setExpanded(isExpanded ? null : s.id)}
                          className="btn btn-sm bg-canvas-2 text-ink-3 hover:bg-canvas-2">
                          {isExpanded ? 'Less' : 'More'}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-brand-soft/20">
                        <td colSpan={6} className="px-5 pb-5 pt-2">
                          <div className="bg-white rounded-xl border border-line p-5 grid sm:grid-cols-3 gap-5">
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Contact</p>
                              <p className="text-sm text-ink-2 break-all">{s.email || '—'}</p>
                              <p className="text-sm text-ink-3 mt-1">{s.phone || '—'}</p>
                              <p className="text-sm text-ink-3">{s.city || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Academic</p>
                              <p className="text-sm text-ink-2">{s.course || '—'}</p>
                              <p className="text-sm text-ink-3">{yearLabel(s.year_of_study)}</p>
                              <p className="text-sm text-ink-3">Graduation {shortDate(s.expected_graduation)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Activity</p>
                              <p className="text-sm text-ink-2">{s.application_count ?? 0} applications</p>
                              <p className="text-sm text-ink-3">{s.availability || 'Availability not set'}</p>
                            </div>
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
                            {s.about && (
                              <div className="sm:col-span-3">
                                <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">About</p>
                                <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">{s.about}</p>
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
