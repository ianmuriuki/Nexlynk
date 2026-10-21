import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/Icon'
import useAuthStore from '@/store/authStore'
import { studentAPI, opportunityAPI } from '@/api/opportunities'
import ApplyModal from '@/components/shared/ApplyModal'
import clsx from 'clsx'
import StatusPill from '@/components/ui/StatusPill'

const TYPE_ICON = {
  internship:  'briefcase',
  'part-time': 'clock',
  contract:    'file',
  'full-time': 'briefcase',
}

const TYPE_BADGE = {
  internship:  'bg-brand-soft text-brand-ink',
  'part-time': 'bg-info-light text-info-dark',
  contract:    'bg-warning-light text-warning-dark',
  'full-time': 'bg-success-light text-success-dark',
}

function StatCard({ icon: iconName, label, value, accent, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon name={iconName} size={20} />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-12 bg-canvas-2 rounded animate-shimmer mb-1" />
        : <div className="tabular-nums text-3xl font-extrabold text-ink">{value ?? '—'}</div>
      }
      <div className="text-sm text-ink-3 mt-1">{label}</div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const qc       = useQueryClient()
  const [selectedOpp, setSelectedOpp] = useState(null)

  const { data: profileData, isPending: profileLoading, isError: profileError } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn:  () => studentAPI.getProfile(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const { data: appsData, isPending: appsLoading, isError: appsError } = useQuery({
    queryKey: ['student-applications', user?.id],
    queryFn:  () => studentAPI.getApplications(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const { data: oppsData, isPending: oppsLoading, isError: oppsError } = useQuery({
    queryKey: ['opportunities', { limit: 6 }],
    queryFn:  () => opportunityAPI.list({ limit: 6 }).then(r => r.data),
  })

  const profile      = profileData
  const completion   = profile?.profile_completion ?? 0
  const applications = Array.isArray(appsData) ? appsData : (appsData?.data ?? [])
  const opps         = oppsData?.data ?? oppsData ?? []
  const firstName    = (profile?.name || user?.name || 'there').split(' ')[0]

  const pendingCount     = applications.filter(a => a.status === 'pending').length
  const shortlistedCount = applications.filter(a => a.status === 'shortlisted').length
  const totalOpps        = oppsData?.pagination?.total ?? opps.length
  const appliedIds       = new Set(applications.map(a => a.opportunity_id))

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-screen-xl">

      {/* Apply Modal */}
      {selectedOpp && (
        <ApplyModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['student-applications', user?.id] })}
        />
      )}

      {/* Header */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="text-2xl font-extrabold text-ink">
          Good {getTimeOfDay()}, {firstName}
        </h1>
        <p className="text-ink-3 text-sm mt-1">
          {pendingCount > 0
            ? `You have ${pendingCount} active application${pendingCount > 1 ? 's' : ''} in progress.`
            : 'Start applying to opportunities that match your profile.'}
        </p>
      </motion.div>

      {/* Profile completion banner */}
      {!profileLoading && !profileError && completion < 100 && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
          className="bg-brand rounded-2xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-7"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-white font-semibold text-sm">Complete your profile to get more matches</p>
              <span className="text-white/80 text-sm font-bold">{completion}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-strong to-brand rounded-full transition-all duration-700"
                style={{ width: `${completion}%` }} />
            </div>
          </div>
          <Link to="/student/profile" className="btn-primary whitespace-nowrap text-xs">
            Complete profile <Icon name="arrow-right" size={14} />
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        <StatCard icon="briefcase"    label="Active applications" value={appsError ? 'N/A' : pendingCount}        accent="bg-brand-soft text-brand"   loading={appsLoading} />
        <StatCard icon="check-circle" label="Shortlisted"         value={appsError ? 'N/A' : shortlistedCount}    accent="bg-success-light text-success"   loading={appsLoading} />
        <StatCard icon="search"       label="Open opportunities"  value={oppsError ? 'N/A' : totalOpps}           accent="bg-canvas-2 text-ink-3"     loading={oppsLoading} />
        <StatCard icon="clock"        label="Total applications"  value={appsError ? 'N/A' : applications.length} accent="bg-warning-light text-warning"   loading={appsLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="min-w-0 space-y-6">

          {/* Opportunities */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-ink">Open opportunities</h2>
                <p className="text-xs text-ink-4 mt-0.5">Click Apply to view full details before submitting</p>
              </div>
              <Link to="/student/opportunities" className="text-sm font-semibold text-brand flex items-center gap-1 hover:gap-2 transition-all">
                Browse all <Icon name="arrow-right" size={14} />
              </Link>
            </div>

            <div className="divide-y divide-line">
              {oppsLoading
                ? [...Array(4)].map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-shimmer flex items-center gap-4">
                    <div className="w-11 h-11 bg-canvas-2 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-canvas-2 rounded w-2/3" />
                      <div className="h-3 bg-canvas-2 rounded w-1/3" />
                    </div>
                  </div>
                ))
                : oppsError
                  ? (
                    <div role="alert" className="px-6 py-10 text-center">
                      <Icon name="alert-circle" size={26} className="mx-auto mb-2 text-warning" />
                      <p className="text-sm font-semibold text-ink-2">Could not load opportunities</p>
                    </div>
                  )
                  : opps.length === 0
                  ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-ink-4 text-sm">No opportunities available right now.</p>
                    </div>
                  )
                  : opps.map((opp) => (
                    <div key={opp.id} className="px-6 py-4 flex items-center gap-4 hover:bg-canvas/80 transition-colors">
                      <div className="w-11 h-11 bg-brand-soft border border-brand-soft rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon name={TYPE_ICON[opp.type] || 'briefcase'} size={20} className="text-brand-ink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{opp.title}</p>
                        <p className="text-xs text-ink-4 mt-0.5">
                          {opp.company_name}
                          {opp.location ? ` · ${opp.location}` : ''}
                          {opp.stipend  ? ` · ${opp.stipend}`  : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={clsx('badge text-[10px] capitalize', TYPE_BADGE[opp.type] || 'bg-canvas-2 text-ink-3')}>
                          {opp.type}
                        </span>
                        {appliedIds.has(opp.id)
                          ? <span className="text-xs font-semibold text-success inline-flex items-center gap-1"><Icon name="check" size={14} /> Applied</span>
                          : (
                            <button
                              onClick={() => setSelectedOpp(opp)}
                              className="btn-primary btn-sm"
                            >Apply</button>
                          )
                        }
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Applications tracker */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-ink">My applications</h2>
                <p className="text-xs text-ink-4 mt-0.5">Track every application</p>
              </div>
              <Link to="/student/applications" className="text-sm font-semibold text-brand flex items-center gap-1 hover:gap-2 transition-all">
                View all <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            {appsLoading
              ? [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 animate-shimmer flex items-center gap-4 border-b border-line last:border-0">
                  <div className="w-9 h-9 bg-canvas-2 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-canvas-2 rounded w-1/2" />
                    <div className="h-3 bg-canvas-2 rounded w-1/3" />
                  </div>
                </div>
              ))
              : appsError
                ? <div role="alert" className="px-6 py-10 text-center"><Icon name="alert-circle" size={26} className="mx-auto mb-2 text-warning" /><p className="text-sm font-semibold text-ink-2">Could not load applications</p></div>
                : applications.length === 0
                ? <div className="px-6 py-10 text-center"><p className="text-ink-4 text-sm">No applications yet.</p></div>
                : applications.slice(0, 5).map((app) => {
                                    const title   = app.opportunity?.title   || 'Opportunity'
                  const company = app.opportunity?.company_name || ''
                  const date    = app.applied_at || app.created_at
                    ? new Date(app.applied_at || app.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short' })
                    : ''
                  return (
                    <div key={app.id} className="px-6 py-4 flex items-center gap-4 border-b border-line last:border-0 hover:bg-canvas/80 transition-colors">
                      <div className="w-9 h-9 bg-canvas-2 rounded-xl flex items-center justify-center text-sm flex-shrink-0">
                        <Icon name="building" size={18} className="text-ink-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{title}</p>
                        <p className="text-xs text-ink-4 mt-0.5">{company}{date ? ` · Applied ${date}` : ''}</p>
                      </div>
                      <StatusPill status={app.status} />
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-5">
          <div className="card overflow-hidden">
            <div className="h-14 bg-brand" />
            <div className="px-5 pb-5">
              <div className="-mt-6 mb-3">
                <div className="w-12 h-12 rounded-full bg-brand border-4 border-white flex items-center justify-center text-white font-bold text-lg font-extrabold">
                  {(profile?.name || user?.name || '?')[0]?.toUpperCase()}
                </div>
              </div>
              <p className="font-semibold text-ink">{profile?.name || user?.name || 'Your Name'}</p>
              <p className="text-xs text-ink-4 mb-4 truncate">
                {profile?.university || profile?.course || user?.email || ''}
              </p>
              <div className="mb-4">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-ink-2">Profile strength</span>
                  <span className="text-brand">{completion}%</span>
                </div>
                <div className="h-1.5 bg-canvas-2 rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all duration-700"
                    style={{ width: `${completion}%` }} />
                </div>
              </div>
              {profile?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {profile.skills.slice(0, 5).map((s) => (
                    <span key={s} className="text-[11px] font-semibold px-2.5 py-1 bg-brand-soft text-brand-ink rounded-full border border-brand-soft">{s}</span>
                  ))}
                </div>
              )}
              <Link to="/student/profile" className="btn-secondary w-full text-xs py-2 justify-center">
                <Icon name="edit" size={14} /> Edit profile
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">
              <Icon name="upload" size={16} className="text-ink-4" /> Your CV
            </h3>
            {profile?.cv_path ? (
              <div className="bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success-dark font-semibold flex items-center gap-2">
                <Icon name="check-circle" size={16} /> CV uploaded
              </div>
            ) : (
              <div className="bg-warning-light border border-warning/20 rounded-xl px-4 py-3 text-xs text-warning-dark">
                No CV uploaded yet.{' '}
                <Link to="/student/profile" className="font-bold underline inline-flex items-center gap-1">Upload now <Icon name="arrow-right" size={14} /></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}