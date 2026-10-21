import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import Icon from '@/components/Icon'
import { opportunityAPI, studentAPI } from '@/api/opportunities'
import ApplyModal from '@/components/shared/ApplyModal'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// Match exactly what the backend schema accepts
const TYPES = ['All', 'internship', 'part-time', 'contract', 'full-time']

const TYPE_STYLE = {
  internship: 'bg-brand-soft text-brand-ink',
  'part-time':'bg-info-light text-info-dark',
  contract:   'bg-warning-light text-warning-dark',
  'full-time':'bg-success-light text-success-dark',
}

function OppCard({ opp, onApply, alreadyApplied }) {
  // Backend returns application_deadline not deadline
  const deadline = opp.application_deadline
    ? new Date(opp.application_deadline).toLocaleDateString('en-KE', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  return (
    <div className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-brand-soft border border-brand-soft rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {opp.type === 'internship' ? '💼' : opp.type === 'part-time' ? '⏰' : opp.type === 'contract' ? '📝' : '🎯'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-ink leading-tight">{opp.title}</h3>
          {/* Backend JOIN returns company_name flat, not nested */}
          <p className="text-xs text-ink-4 mt-0.5">{opp.company_name}</p>
        </div>
        <span className={clsx('badge text-[10px] flex-shrink-0 capitalize', TYPE_STYLE[opp.type] || 'bg-canvas-2 text-ink-3')}>
          {opp.type}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-ink-3 mb-3">
        {opp.location && (
          <span className="flex items-center gap-1"><Icon name="map-pin" size={12} />{opp.location}</span>
        )}
        {opp.stipend && (
          <span className="flex items-center gap-1">
            <Icon name="briefcase" size={12} />
            {/* stipend is a string from the server e.g. "KES 20,000/mo" */}
            {opp.stipend}
          </span>
        )}
        {opp.positions && (
          <span>{opp.positions} position{opp.positions > 1 ? 's' : ''}</span>
        )}
      </div>

      {opp.description && (
        <p className="text-xs text-ink-3 leading-relaxed mb-3 line-clamp-2">{opp.description}</p>
      )}

      {/* Backend field is skills_required not required_skills */}
      {opp.skills_required?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {opp.skills_required.slice(0, 4).map(s => (
            <span key={s} className="text-[10px] font-semibold px-2 py-0.5 bg-canvas-2 text-ink-2 rounded-full">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-line">
        {deadline
          ? <p className="text-xs text-ink-4">Closes {deadline}</p>
          : <span />
        }
        {alreadyApplied
          ? <span className="text-xs font-bold text-success flex items-center gap-1">✓ Applied</span>
          : (
            <button
              onClick={() => onApply(opp)}
              disabled={false}
              className="btn-primary btn-sm ml-auto"
            >Apply now</button>
          )
        }
      </div>
    </div>
  )
}

export default function BrowseOpportunities() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [selectedOpp, setSelectedOpp] = useState(null)
  const [search,     setSearch]  = useState('')
  const [typeFilter, setType]    = useState('All')
  const [page,       setPage]    = useState(1)

  const params = {
    limit:  12,
    page,
    ...(typeFilter !== 'All'  && { type:    typeFilter }),
    ...(search.trim()         && { keyword: search.trim() }),
  }

  const { data, isPending, isError } = useQuery({
    queryKey: ['opportunities', params],
    queryFn:  () => opportunityAPI.list(params).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: appsData } = useQuery({
    queryKey: ['student-applications', user?.id],
    queryFn:  () => studentAPI.getApplications(user.id).then(r => r.data),
    enabled:  !!user?.id,
  })

  const applyMutation = useMutation({
    mutationFn: (id) => opportunityAPI.apply(id),
    onSuccess:  () => {
      toast.success('Application submitted!')
      qc.invalidateQueries({ queryKey: ['student-applications', user?.id] })
    },
    onError: (e) => {
      // 409 means already applied — treat gracefully
      if (e.status === 409) toast.error('You have already applied to this opportunity.')
      else toast.error(e?.message || 'Could not apply')
    },
  })

  const opps       = data?.data ?? []
  const pagination = data?.pagination
  const apps       = appsData?.data ?? appsData ?? []
  const appliedIds = new Set(apps.map(a => a.opportunity_id))

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      {selectedOpp && (
        <ApplyModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['student-applications', user?.id] })}
        />
      )}
      <div className="mb-7 animate-fade-up">
        <h1 className="text-2xl font-extrabold text-ink">Browse Opportunities</h1>
        <p className="text-ink-3 text-sm mt-1">
          {pagination?.total ? `${pagination.total} opportunities available` : 'Find your next placement'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input pl-10"
            placeholder="Search by title, company, or keyword..."
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => { setType(t); setPage(1) }}
              className={clsx(
                'px-4 py-2.5 rounded-xl text-xs font-bold border transition-all capitalize',
                typeFilter === t
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-ink-3 border-line-2 hover:border-brand hover:text-brand'
              )}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-shimmer space-y-3">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-canvas-2 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-canvas-2 rounded w-3/4" />
                  <div className="h-3 bg-canvas-2 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-canvas-2 rounded w-full" />
              <div className="h-8 bg-canvas-2 rounded-lg" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card p-12 text-center">
          <Icon name="alert-circle" size={28} className="mx-auto mb-3 text-warning" />
          <h3 className="mb-2 font-extrabold text-ink">Could not load opportunities</h3>
          <p className="text-sm text-ink-3">Please try again shortly.</p>
        </div>
      ) : opps.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon name="search" size={26} /></div>
          <h3 className="font-semibold text-ink mb-2">No opportunities found</h3>
          <p className="text-ink-4 text-sm">Try adjusting your search or filters.</p>
          <button
            onClick={() => { setSearch(''); setType('All') }}
            className="btn-primary btn-sm mt-4"
          >Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {opps.map(opp => (
            <OppCard
              key={opp.id}
              opp={opp}
              onApply={(opp) => setSelectedOpp(opp)}
              alreadyApplied={appliedIds.has(opp.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination?.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary btn-sm disabled:opacity-40"
          >← Prev</button>
          <span className="text-sm text-ink-3 px-2">Page {page} of {pagination.total_pages}</span>
          <button
            disabled={page >= pagination.total_pages}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary btn-sm disabled:opacity-40"
          >Next →</button>
        </div>
      )}
    </div>
  )
}