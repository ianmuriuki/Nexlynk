import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase, CheckCircle, Search, Clock, Upload } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { studentAPI, opportunityAPI } from '@/api/client'
import ApplyModal from '@/components/shared/ApplyModal'
import clsx from 'clsx'

const STATUS_MAP = {
  pending:     { cls: 'badge-pending',     label: 'Pending' },
  shortlisted: { cls: 'badge-shortlisted', label: 'Shortlisted 🎉' },
  placed:      { cls: 'badge-placed',      label: 'Placed ✓' },
  rejected:    { cls: 'badge-rejected',    label: 'Rejected' },
}

const TYPE_ICON = {
  internship:  '💼',
  'part-time': '⏰',
  contract:    '📝',
  'full-time': '🎯',
}

const TYPE_BADGE = {
  internship:  'bg-blue-100 text-blue-700',
  'part-time': 'bg-purple-100 text-purple-700',
  contract:    'bg-warning-light text-warning-dark',
  'full-time': 'bg-success-light text-success-dark',
}

function StatCard({ icon: Icon, label, value, accent, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-12 bg-slate-100 rounded animate-pulse mb-1" />
        : <div className="font-serif text-3xl font-bold text-navy">{value ?? '—'}</div>
      }
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const qc       = useQueryClient()
  const [selectedOpp, setSelectedOpp] = useState(null)

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn:  () => studentAPI.getProfile(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['student-applications', user?.id],
    queryFn:  () => studentAPI.getApplications(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const { data: oppsData, isLoading: oppsLoading } = useQuery({
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
    <div className="p-6 lg:p-8 max-w-screen-xl">

      {/* Apply Modal */}
      {selectedOpp && (
        <ApplyModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onSuccess={() => qc.invalidateQueries(['student-applications', user?.id])}
        />
      )}

      {/* Header */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="font-serif text-2xl font-bold text-navy">
          Good {getTimeOfDay()}, {firstName} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {pendingCount > 0
            ? `You have ${pendingCount} active application${pendingCount > 1 ? 's' : ''} in progress.`
            : 'Start applying to opportunities that match your profile.'}
        </p>
      </motion.div>

      {/* Profile completion banner */}
      {!profileLoading && completion < 100 && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
          className="bg-navy rounded-2xl px-6 py-5 flex items-center justify-between gap-6 mb-7"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-white font-semibold text-sm">Complete your profile to get more matches</p>
              <span className="text-blue-300 text-sm font-bold">{completion}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-300 rounded-full transition-all duration-700"
                style={{ width: `${completion}%` }} />
            </div>
          </div>
          <Link to="/student/profile" className="btn-primary whitespace-nowrap text-xs">
            Complete profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        <StatCard icon={Briefcase}   label="Active applications" value={pendingCount}        accent="bg-blue-50 text-blue-DEFAULT"   loading={appsLoading} />
        <StatCard icon={CheckCircle} label="Shortlisted"         value={shortlistedCount}    accent="bg-success-light text-success"   loading={appsLoading} />
        <StatCard icon={Search}      label="Open opportunities"  value={totalOpps}           accent="bg-slate-100 text-slate-500"     loading={oppsLoading} />
        <StatCard icon={Clock}       label="Total applications"  value={applications.length} accent="bg-warning-light text-warning"   loading={appsLoading} />
      </div>

      <div className="grid xl:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">

          {/* Opportunities */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-navy">Open opportunities</h2>
                <p className="text-xs text-slate-400 mt-0.5">Click Apply to view full details before submitting</p>
              </div>
              <Link to="/student/opportunities" className="text-sm font-semibold text-blue-DEFAULT flex items-center gap-1 hover:gap-2 transition-all">
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {oppsLoading
                ? [...Array(4)].map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
                : opps.length === 0
                  ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-slate-400 text-sm">No opportunities available right now.</p>
                    </div>
                  )
                  : opps.map((opp) => (
                    <div key={opp.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors">
                      <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {TYPE_ICON[opp.type] || '💼'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy truncate">{opp.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {opp.company_name}
                          {opp.location ? ` · ${opp.location}` : ''}
                          {opp.stipend  ? ` · ${opp.stipend}`  : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={clsx('badge text-[10px] capitalize', TYPE_BADGE[opp.type] || 'bg-slate-100 text-slate-500')}>
                          {opp.type}
                        </span>
                        {appliedIds.has(opp.id)
                          ? <span className="text-xs font-semibold text-success">Applied ✓</span>
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
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-navy">My applications</h2>
                <p className="text-xs text-slate-400 mt-0.5">Track every application</p>
              </div>
              <Link to="/student/applications" className="text-sm font-semibold text-blue-DEFAULT flex items-center gap-1 hover:gap-2 transition-all">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {appsLoading
              ? [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4 border-b border-slate-100 last:border-0">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))
              : applications.length === 0
                ? <div className="px-6 py-10 text-center"><p className="text-slate-400 text-sm">No applications yet.</p></div>
                : applications.slice(0, 5).map((app) => {
                  const s       = STATUS_MAP[app.status] || STATUS_MAP.pending
                  const title   = app.opportunity?.title   || 'Opportunity'
                  const company = app.opportunity?.company_name || ''
                  const date    = app.applied_at || app.created_at
                    ? new Date(app.applied_at || app.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short' })
                    : ''
                  return (
                    <div key={app.id} className="px-6 py-4 flex items-center gap-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-sm flex-shrink-0">🏢</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy truncate">{title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{company}{date ? ` · Applied ${date}` : ''}</p>
                      </div>
                      <span className={s.cls}>{s.label}</span>
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="h-14 bg-gradient-to-r from-navy to-blue-800" />
            <div className="px-5 pb-5">
              <div className="-mt-6 mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-DEFAULT border-4 border-white flex items-center justify-center text-white font-bold text-lg font-serif">
                  {(profile?.name || user?.name || '?')[0]?.toUpperCase()}
                </div>
              </div>
              <p className="font-semibold text-navy">{profile?.name || user?.name || 'Your Name'}</p>
              <p className="text-xs text-slate-400 mb-4 truncate">
                {profile?.university || profile?.course || user?.email || ''}
              </p>
              <div className="mb-4">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Profile strength</span>
                  <span className="text-blue-DEFAULT">{completion}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-DEFAULT rounded-full transition-all duration-700"
                    style={{ width: `${completion}%` }} />
                </div>
              </div>
              {profile?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {profile.skills.slice(0, 5).map((s) => (
                    <span key={s} className="text-[11px] font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{s}</span>
                  ))}
                </div>
              )}
              <Link to="/student/profile" className="btn-secondary w-full text-xs py-2 justify-center">
                ✏️ Edit profile
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-navy text-sm mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-slate-400" /> Your CV
            </h3>
            {profile?.cv_path ? (
              <div className="bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success-dark font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> CV uploaded ✓
              </div>
            ) : (
              <div className="bg-warning-light border border-warning/20 rounded-xl px-4 py-3 text-xs text-warning-dark">
                No CV uploaded yet.{' '}
                <Link to="/student/profile" className="font-bold underline">Upload now →</Link>
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