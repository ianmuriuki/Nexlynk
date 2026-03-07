import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, MapPin, Briefcase, SlidersHorizontal, X } from 'lucide-react'
import { opportunityAPI, studentAPI } from '@/api/client'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TYPES = ['All', 'internship', 'attachment', 'graduate']

function OppCard({ opp, onApply, applying, alreadyApplied }) {
  const deadline = opp.deadline
    ? new Date(opp.deadline).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })
    : null
  const typeColor = {
    internship: 'bg-blue-100 text-blue-700',
    attachment: 'bg-purple-100 text-purple-700',
    graduate:   'bg-success-light text-success-dark',
  }[opp.type] || 'bg-slate-100 text-slate-500'

  return (
    <div className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {opp.type === 'internship' ? '💼' : opp.type === 'attachment' ? '🌍' : '🎯'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-navy leading-tight">{opp.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{opp.company?.name}</p>
        </div>
        <span className={clsx('badge text-[10px] flex-shrink-0', typeColor)}>{opp.type}</span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
        {opp.location && (
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.location}</span>
        )}
        {opp.stipend && (
          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />KES {Number(opp.stipend).toLocaleString()}/mo</span>
        )}
        {opp.positions && (
          <span>{opp.positions} position{opp.positions > 1 ? 's' : ''}</span>
        )}
      </div>

      {opp.description && (
        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{opp.description}</p>
      )}

      {opp.required_skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {opp.required_skills.slice(0, 4).map(s => (
            <span key={s} className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {deadline && <p className="text-xs text-slate-400">Closes {deadline}</p>}
        {alreadyApplied
          ? <span className="text-xs font-bold text-success flex items-center gap-1">✓ Applied</span>
          : (
            <button
              onClick={() => onApply(opp.id)}
              disabled={applying}
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
  const [search, setSearch]  = useState('')
  const [typeFilter, setType] = useState('All')
  const [page, setPage]      = useState(1)

  const params = {
    limit:  12,
    page,
    status: 'published',
    ...(typeFilter !== 'All' && { type: typeFilter }),
    ...(search.trim() && { search: search.trim() }),
  }

  const { data, isLoading } = useQuery({
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
    onSuccess:  () => { toast.success('Application submitted!'); qc.invalidateQueries(['student-applications', user?.id]) },
    onError:    (e) => toast.error(e?.message || 'Could not apply'),
  })

  const opps         = data?.data ?? data ?? []
  const pagination   = data?.pagination
  const applications = appsData?.data ?? appsData ?? []

  const appliedIds = new Set(applications.map(a => a.opportunity_id || a.opportunity?.id))

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="font-serif text-2xl font-bold text-navy">Browse Opportunities</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pagination?.total ? `${pagination.total} opportunities available` : 'Find your next placement'}
        </p>
      </motion.div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input pl-10"
            placeholder="Search by title, company, or skill..."
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {TYPES.map(t => (
            <button key={t} onClick={() => { setType(t); setPage(1) }}
              className={clsx('px-4 py-2.5 rounded-xl text-xs font-bold border transition-all capitalize',
                typeFilter === t ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-DEFAULT hover:text-blue-DEFAULT'
              )}>{t}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading
        ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="flex gap-3"><div className="w-12 h-12 bg-slate-100 rounded-xl" /><div className="flex-1 space-y-2"><div className="h-4 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div></div>
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-8 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        )
        : opps.length === 0
          ? (
            <div className="card p-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-semibold text-navy mb-2">No opportunities found</h3>
              <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
              <button onClick={() => { setSearch(''); setType('All') }} className="btn-primary btn-sm mt-4">Clear filters</button>
            </div>
          )
          : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {opps.map(opp => (
                <OppCard
                  key={opp.id}
                  opp={opp}
                  onApply={(id) => applyMutation.mutate(id)}
                  applying={applyMutation.isPending}
                  alreadyApplied={appliedIds.has(opp.id)}
                />
              ))}
            </div>
          )
      }

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-slate-500 px-2">Page {page} of {pagination.total_pages}</span>
          <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
