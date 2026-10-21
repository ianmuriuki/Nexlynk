import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '@/components/Icon'
import StatusPill from '@/components/ui/StatusPill'
import CvPreviewModal from '@/components/ui/CvPreviewModal'
import useAuthStore from '@/store/authStore'
import { companyAPI, filesAPI } from '@/api/company'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const AVATAR_COLORS = ['bg-brand','bg-success','bg-info','bg-warning','bg-danger','bg-ink-4']

function StatCard({ icon: iconName, label, value, accent, sub, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon name={iconName} size={20} />
        </div>
        {sub && <span className="text-xs text-ink-4">{sub}</span>}
      </div>
      {loading
        ? <div className="h-8 w-12 bg-canvas-2 rounded animate-shimmer mb-1" />
        : <div className="tabular-nums text-3xl font-extrabold text-ink">{value ?? '—'}</div>
      }
      <div className="text-sm text-ink-3 mt-1">{label}</div>
    </div>
  )
}

function AppSkeleton({ rows = 4 }) {
  return [...Array(rows)].map((_, i) => (
    <div key={i} className="px-6 py-4 animate-shimmer flex items-center gap-4 border-b border-line last:border-0">
      <div className="w-10 h-10 bg-canvas-2 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-canvas-2 rounded w-1/2" />
        <div className="h-3 bg-canvas-2 rounded w-1/3" />
      </div>
    </div>
  ))
}

export default function CompanyDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [cvPreview, setCvPreview] = useState(null)
  const cvPreviewRequest = useRef(0)
  const [logoUrl, setLogoUrl] = useState(null)

  const { data: profile, isPending: profileLoading, isError: profileError } = useQuery({
    queryKey: ['company-profile', user?.id],
    queryFn:  () => companyAPI.getProfile(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const { data: oppsData, isPending: oppsLoading, isError: oppsError } = useQuery({
    queryKey: ['company-opportunities', user?.id],
    queryFn:  () => companyAPI.getOpportunities(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const { data: applicantsData, isPending: appsLoading, isError: appsError } = useQuery({
    queryKey: ['company-applicants-recent', user?.id],
    queryFn:  () => companyAPI.getApplicants(user.id, { limit: 5 }).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const statusMutation = useMutation({
    mutationFn: ({ appId, status }) => companyAPI.updateAppStatus(user.id, appId, { status }),
    onSuccess:  () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['company-applicants-recent', user?.id] })
      qc.invalidateQueries({ queryKey: ['company-applicants', user?.id] })
    },
    onError: (e) => toast.error(e?.message || 'Failed to update'),
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

  const opps       = Array.isArray(oppsData) ? oppsData : []
  const applicants = Array.isArray(applicantsData) ? applicantsData : []

  const activeOpps      = opps.filter(o => o.status === 'published').length
  const totalApplicants = opps.reduce((sum, o) => sum + (Number(o.application_count) || 0), 0)
  const shortlisted     = applicants.filter(a => a.status === 'shortlisted').length
  const placed          = applicants.filter(a => a.status === 'placed').length

  const companyName = profile?.name || user?.name || 'Your Company'
  const initials    = companyName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  useEffect(() => {
    if (!profile?.logo_path) {
      setLogoUrl(null)
      return
    }

    let active = true
    filesAPI.logoSignedUrl(encodeURIComponent(profile.logo_path))
      .then(({ data }) => {
        if (active) setLogoUrl(data?.url || data?.signedUrl || null)
      })
      .catch(() => {
        if (active) setLogoUrl(null)
      })

    return () => {
      active = false
    }
  }, [profile?.logo_path])

  const incomplete  = !profileLoading && !profileError && profile && (!profile.industry || !profile.description || !profile.contact_name)

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      <CvPreviewModal
        open={Boolean(cvPreview)}
        url={cvPreview?.url}
        loading={cvPreview?.loading ?? false}
        onClose={closeCvPreview}
      />

      <div
        className="flex flex-wrap items-start justify-between gap-3 mb-7"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-ink break-words">{companyName}</h1>
          <p className="text-ink-3 text-sm mt-1">
            {profile?.industry || 'Company'}
            {profile?.company_size ? ` · ${profile.company_size} employees` : ''}
            {profile?.status === 'approved' && <StatusPill status="approved" label="Verified" />}
            {profile?.status === 'pending' && <StatusPill status="pending" label="Pending approval" />}
          </p>
        </div>
        <Link to="/company/post" className="btn-primary text-sm whitespace-nowrap">
          <Icon name="plus" size={16} /> Post opportunity
        </Link>
      </div>

      {incomplete && (
        <div
          className="bg-warning-light border border-warning/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 mb-7"
        >
          <div>
            <p className="text-sm font-semibold text-warning-dark">Complete your company profile</p>
            <p className="text-xs text-warning-dark/70 mt-0.5">Add your industry, description, and contact details.</p>
          </div>
          <Link to="/company/settings" className="btn btn-sm bg-warning text-white hover:bg-yellow-600 whitespace-nowrap">
            Complete profile →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        <StatCard icon="briefcase"   label="Active listings"  value={oppsError ? 'N/A' : activeOpps}      accent="bg-brand-soft text-brand"   sub={opps.length > 0 ? `of ${opps.length} total` : undefined} loading={oppsLoading} />
        <StatCard icon="users"       label="Total applicants" value={oppsError ? 'N/A' : totalApplicants}  accent="bg-info-light text-info-dark"   loading={oppsLoading} />
        <StatCard icon="trending-up"  label="Shortlisted"      value={appsError ? 'N/A' : shortlisted}      accent="bg-brand-soft text-brand"   loading={appsLoading} />
        <StatCard icon="check-circle" label="Placed"           value={appsError ? 'N/A' : placed}           accent="bg-success-light text-success"  loading={appsLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="min-w-0 space-y-6">

          {/* Opportunities table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-ink">Posted opportunities</h2>
                <p className="text-xs text-ink-4 mt-0.5">Manage your listings</p>
              </div>
              <Link to="/company/post" className="text-sm font-semibold text-brand flex items-center gap-1">
                <Icon name="plus" size={14} /> New post
              </Link>
            </div>

            {oppsLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-canvas-2 rounded-xl animate-shimmer" />)}
              </div>
            ) : oppsError ? (
              <div role="alert" className="px-6 py-10 text-center">
                <Icon name="alert-circle" size={26} className="mx-auto mb-2 text-warning" />
                <p className="text-sm font-semibold text-ink-2">Could not load opportunities</p>
              </div>
            ) : opps.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-ink-4 text-sm">No opportunities posted yet.</p>
                <Link to="/company/post" className="btn-primary btn-sm mt-3 inline-flex">Post your first →</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-canvas border-b border-line">
                      {['Opportunity','Type','Status','Applicants','Deadline',''].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-ink-4 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {opps.map((opp) => {
                      const dl = opp.application_deadline
                      const deadline = dl ? new Date(dl).toLocaleDateString('en-KE', { day:'numeric', month:'short' }) : '—'
                      return (
                        <tr key={opp.id} className="hover:bg-canvas/80 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-ink">{opp.title}</p>
                            <p className="text-xs text-ink-4 mt-0.5">
                              {opp.location || 'No location'} · {opp.positions || 1} position{(opp.positions || 1) > 1 ? 's' : ''}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-semibold px-2.5 py-1 bg-canvas-2 text-ink-2 rounded-full capitalize">{opp.type}</span>
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill status={opp.status} />
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-ink">{Number(opp.application_count) || 0}</td>
                          <td className="px-5 py-4 text-sm text-ink-4 whitespace-nowrap">{deadline}</td>
                          <td className="px-5 py-4">
                            <button className="btn btn-sm bg-canvas-2 text-ink-2 hover:bg-canvas-2 flex items-center gap-1">
                              <Icon name="eye" size={14} /> View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent applicants */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-ink">Recent applicants</h2>
                <p className="text-xs text-ink-4 mt-0.5">Review and manage your pipeline</p>
              </div>
              <Link to="/company/applicants" className="text-sm font-semibold text-brand flex items-center gap-1 hover:gap-2 transition-all">
                View all <Icon name="arrow-right" size={14} />
              </Link>
            </div>

            {appsLoading ? <AppSkeleton rows={4} /> : appsError ? (
              <div role="alert" className="px-6 py-10 text-center">
                <Icon name="alert-circle" size={26} className="mx-auto mb-2 text-warning" />
                <p className="text-sm font-semibold text-ink-2">Could not load applicants</p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="px-6 py-10 text-center"><p className="text-ink-4 text-sm">No applicants yet.</p></div>
            ) : applicants.map((a) => {
              // student is a nested JSON object from updated listApplicants query
              const name    = a.student?.name     || 'Applicant'
              const initial = name[0]?.toUpperCase() || '?'
              const oppTitle = a.opportunity?.title || ''
              const skills  = a.student?.skills    ?? []
              const cvPath  = a.student?.cv_path
              const color   = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

              return (
                <div key={a.id} className="px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 border-b border-line last:border-0 hover:bg-canvas/80 transition-colors">
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{name}</p>
                    {oppTitle && <p className="text-xs text-ink-4 mt-0.5 truncate">Applied for {oppTitle}</p>}
                    {skills.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] font-semibold px-2 py-0.5 bg-brand-soft text-brand-ink rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <StatusPill status={a.status} />
                  <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                    {a.status === 'pending' && (
                      <>
                        <button onClick={() => statusMutation.mutate({ appId: a.id, status: 'shortlisted' })}
                          disabled={statusMutation.isPending}
                          className="btn btn-sm bg-brand-soft text-brand hover:bg-brand hover:text-white transition-all">
                          Shortlist
                        </button>
                        <button onClick={() => statusMutation.mutate({ appId: a.id, status: 'rejected' })}
                          disabled={statusMutation.isPending}
                          className="btn btn-sm bg-danger-light text-danger hover:bg-danger hover:text-white transition-all">
                          Reject
                        </button>
                      </>
                    )}
                    {a.status !== 'pending' && cvPath && (
                      <button onClick={() => openCV(cvPath)}
                        className="btn btn-sm bg-canvas-2 text-ink-2 hover:bg-canvas-2">
                        View CV
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="min-w-0 space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand text-base font-bold text-white">
                {logoUrl
                  ? <img src={logoUrl} alt={companyName + ' logo'} className="h-full w-full object-cover" onError={() => setLogoUrl(null)} />
                  : initials
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink truncate">{companyName}</p>
                <p className="text-xs text-ink-4 capitalize truncate">
                  {profile?.industry || '—'} · {profile?.company_size || '—'}
                </p>
              </div>
              {profile?.status === 'approved' && <StatusPill status="approved" label="Verified" />}
              {profile?.status === 'pending'  && <StatusPill status="pending" />}
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                [opps.length,     'Total posts'],
                [totalApplicants, 'Applicants'],
                [placed,          'Placed'],
                [shortlisted,     'Shortlisted'],
              ].map(([n, l]) => (
                <div key={l} className="bg-canvas rounded-xl px-3.5 py-2.5 border border-line">
                  <div className="tabular-nums text-xl font-extrabold text-ink">{n}</div>
                  <div className="text-[11px] text-ink-4 mt-0.5">{l}</div>
                </div>
              ))}
            </div>

            {profile?.contact_name && (
              <div className="bg-canvas rounded-xl px-3.5 py-3 border border-line mb-4 text-xs text-ink-3 space-y-1">
                <p><span className="font-semibold text-ink-2">Contact:</span> {profile.contact_name}</p>
                {profile.contact_email && <p>{profile.contact_email}</p>}
                {profile.contact_phone && <p>{profile.contact_phone}</p>}
              </div>
            )}

            <Link to="/company/settings" className="btn-secondary w-full text-xs py-2.5 justify-center flex items-center gap-2">
              <Icon name="settings" size={14} /> Edit company profile
            </Link>
          </div>

          <div className="card p-5 bg-brand-soft border border-brand-soft">
            <h3 className="mb-2 font-extrabold text-ink">Ready to find talent?</h3>
            <p className="mb-4 text-xs leading-relaxed text-ink-3">
              Post a new internship, part-time or contract role and start receiving applications today.
            </p>
            <Link to="/company/post" className="btn btn-primary w-full justify-center text-xs">
              Post new opportunity <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}