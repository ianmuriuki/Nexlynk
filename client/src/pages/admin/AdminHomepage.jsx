import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import StatusPill from '@/components/ui/StatusPill'
import ConfirmModal from '@/components/ui/ConfirmModal'
import OpportunityCard from '@/components/shared/OpportunityCard'
import { adminGetHomepage, adminHomepageCandidates, adminSetHomepage, getHomepageJobs, homepageLogoUrl } from '@/api/homepage'

const rows = (response) => response.data?.data ?? []
const dateLabel = (value) => {
  if (!value) return 'Not set'
  const date = new Date(value.length === 10 ? `${value}T00:00:00+03:00` : value)
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function hiddenReason(job) {
  if (job.reason) return job.reason
  if (job.status && job.status !== 'published') return `Opportunity is ${job.status}`
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date())
  if (job.application_deadline && job.application_deadline < today) return 'Application deadline passed'
  if (job.company_status && job.company_status !== 'approved') return `Company is ${job.company_status}`
  return null
}

function CompanyMark({ name, path }) {
  const [failed, setFailed] = useState(false)
  const initials = (name || 'Company').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const url = homepageLogoUrl(path)
  return (
    <div className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-xs font-extrabold text-brand-ink">
      {url && !failed
        ? <img src={url} alt="" width="40" height="40" loading="lazy" onError={() => setFailed(true)} className="h-full w-full rounded-full object-cover" />
        : initials}
    </div>
  )
}

function Candidate({ job, selected, full, onAdd }) {
  const reason = hiddenReason(job)
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-3">
      <CompanyMark name={job.company_name} path={job.company_logo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{job.title}</p>
        <p className="truncate text-xs text-ink-3">{job.company_name || 'Company not set'}</p>
        <p className="mt-1 text-[11px] text-ink-4">Posted {dateLabel(job.created_at)} · Deadline {dateLabel(job.application_deadline)}</p>
        {reason && <p className="mt-1 text-[11px] font-semibold text-warning-dark">{reason}</p>}
      </div>
      <button type="button" onClick={() => onAdd(job.id)} disabled={selected || full || Boolean(reason)} className={selected ? 'btn-soft btn-sm' : 'btn-secondary btn-sm'}>
        {selected ? 'Selected' : 'Add'}
      </button>
    </div>
  )
}

export default function AdminHomepage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const candidatesQuery = useQuery({ queryKey: ['admin-homepage-candidates'], queryFn: () => adminHomepageCandidates().then(rows) })
  const selectionQuery = useQuery({ queryKey: ['admin-homepage'], queryFn: () => adminGetHomepage().then(rows) })
  const previewQuery = useQuery({
    queryKey: ['homepage-jobs'],
    queryFn: () => getHomepageJobs().then(rows),
    staleTime: 5 * 60 * 1000,
  })

  const saved = selectionQuery.data ?? []
  const savedIds = saved.slice().sort((a, b) => a.position - b.position).map((job) => job.id)
  const ids = draft ?? savedIds
  const chosen = new Set(ids)
  const jobs = new Map((candidatesQuery.data ?? []).map((job) => [job.id, job]))
  saved.forEach((job) => jobs.set(job.id, { ...jobs.get(job.id), ...job }))
  const selected = ids.map((id) => jobs.get(id)).filter(Boolean)
  const dirty = draft !== null && (draft.length !== savedIds.length || draft.some((id, index) => id !== savedIds[index]))

  const save = useMutation({
    mutationFn: (value) => adminSetHomepage(value),
    onSuccess: async (_, value) => {
      setDraft(null)
      setConfirmReset(false)
      toast.success(value.length ? 'Homepage jobs saved' : 'Homepage jobs reset')
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-homepage'] }),
        qc.invalidateQueries({ queryKey: ['homepage-jobs'] }),
      ])
    },
    onError: (error) => toast.error(error?.message || 'Could not save homepage jobs'),
  })

  const change = (update) => setDraft((current) => update(current ?? savedIds))
  const move = (index, offset) => change((current) => {
    const next = current.slice()
    const target = index + offset
    if (target < 0 || target >= next.length) return next
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
  const candidates = (candidatesQuery.data ?? []).filter((job) => {
    const term = search.trim().toLowerCase()
    return !term || `${job.title} ${job.company_name} ${job.company_industry}`.toLowerCase().includes(term)
  })

  return (
    <div className="mx-auto max-w-screen-xl p-5 pb-8 sm:p-6 lg:p-8">
      <ConfirmModal open={confirmReset} title="Reset homepage jobs?" description="The homepage will show the latest eligible opportunities automatically." confirmLabel="Reset to automatic" isPending={save.isPending} onClose={() => setConfirmReset(false)} onConfirm={() => save.mutate([], { onSettled: () => setConfirmReset(false) })} />
      <header className="mb-6">
        <div className="section-eyebrow">Homepage jobs</div>
        <h1 className="text-2xl font-extrabold text-ink">Homepage jobs</h1>
        <p className="mt-1 text-sm text-ink-3">Choose which opportunities visitors see first.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="selection-title" className="order-1 min-w-0 lg:order-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="selection-title" className="text-lg font-extrabold text-ink">Selection</h2><p className="text-xs text-ink-3">Showing now</p></div>
            <div className="flex items-center gap-2">
              {dirty && <span className="badge bg-warning-light text-warning-dark">Unsaved changes</span>}
              <button type="button" className="btn-secondary btn-sm" disabled={save.isPending || (!ids.length && !dirty)} onClick={() => setConfirmReset(true)}>Reset to automatic</button>
              <button type="button" className="btn-primary btn-sm" disabled={!dirty || save.isPending} onClick={() => save.mutate(ids)}>Save</button>
            </div>
          </div>
          {selectionQuery.isPending ? (
            <div aria-label="Loading selection" className="space-y-2">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-shimmer rounded-xl bg-canvas-2" />)}</div>
          ) : selectionQuery.isError ? (
            <p className="rounded-xl border border-danger-light bg-danger-light p-4 text-sm text-danger-dark">Could not load the saved selection.</p>
          ) : selected.length ? (
            <ol className="divide-y divide-line rounded-xl border border-line bg-white">
              {selected.map((job, index) => {
                const reason = hiddenReason(job)
                return (
                  <li key={job.id} className="flex min-w-0 items-center gap-2 p-3">
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-brand-ink">{index + 1}</span>
                    <CompanyMark name={job.company_name} path={job.company_logo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{job.title}</p>
                      <p className="truncate text-xs text-ink-3">{job.company_name}</p>
                      {reason ? <span className="badge mt-1 bg-warning-light text-warning-dark">{reason}</span> : <StatusPill status="published" />}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button type="button" aria-label={`Move ${job.title} up`} title="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="btn-icon h-8 w-8 disabled:opacity-40"><Icon name="arrow-up" size={15} /></button>
                      <button type="button" aria-label={`Move ${job.title} down`} title="Move down" disabled={index === selected.length - 1} onClick={() => move(index, 1)} className="btn-icon h-8 w-8 disabled:opacity-40"><Icon name="arrow-down" size={15} /></button>
                      <button type="button" aria-label={`Remove ${job.title}`} title="Remove" onClick={() => change((current) => current.filter((id) => id !== job.id))} className="btn-icon h-8 w-8 text-danger"><Icon name="x" size={15} /></button>
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : <p className="rounded-xl border border-line bg-white p-4 text-sm text-ink-3">Automatic selection is active.</p>}

          <div className="mt-6">
            <h2 className="mb-3 text-lg font-extrabold text-ink">Live preview</h2>
            {previewQuery.isPending ? (
              <div aria-label="Loading preview" className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-52 animate-shimmer rounded-2xl bg-canvas-2" />)}</div>
            ) : previewQuery.isError ? (
              <p className="text-sm text-danger-dark">Could not load the homepage preview.</p>
            ) : previewQuery.data?.length ? (
              <div className="grid gap-3">{previewQuery.data.map((job) => <OpportunityCard key={job.id} opportunity={job} companyLogoUrl={homepageLogoUrl(job.company_logo)} />)}</div>
            ) : <p className="text-sm text-ink-3">No eligible opportunities are showing right now.</p>}
          </div>
        </section>

        <section aria-labelledby="candidates-title" className="order-2 min-w-0 lg:order-1">
          <div className="mb-3"><h2 id="candidates-title" className="text-lg font-extrabold text-ink">Published opportunities</h2><p className="text-xs text-ink-3">Select up to three. Ineligible jobs cannot be added.</p></div>
          <div className="relative mb-3">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-9" placeholder="Search opportunities or companies" />
          </div>
          {candidatesQuery.isPending ? (
            <div aria-label="Loading opportunities" className="space-y-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-20 animate-shimmer rounded-xl bg-canvas-2" />)}</div>
          ) : candidatesQuery.isError ? (
            <div className="rounded-xl border border-danger-light bg-danger-light p-5 text-sm text-danger-dark">Could not load opportunities.</div>
          ) : candidates.length ? (
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
              {candidates.map((job) => <Candidate key={job.id} job={job} selected={chosen.has(job.id)} full={ids.length >= 3 && !chosen.has(job.id)} onAdd={(id) => change((current) => current.includes(id) || current.length >= 3 ? current : [...current, id])} />)}
            </div>
          ) : <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-ink-3">{search ? 'No matching opportunities.' : 'No published opportunities exist.'}</div>}
          {ids.length >= 3 && <p className="mt-2 text-xs text-ink-4">Remove a selected opportunity to add another.</p>}
        </section>
      </div>
    </div>
  )
}
