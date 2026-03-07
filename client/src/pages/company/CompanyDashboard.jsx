import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase, Users, CheckCircle, TrendingUp, Plus, Eye, Edit3 } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { companyAPI } from '@/api/client'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const OPP_STATUS = { published: 'badge-published', draft: 'badge-draft', closed: 'badge-rejected' }
const APP_STATUS  = { pending: 'badge-pending', shortlisted: 'badge-shortlisted', placed: 'badge-placed', rejected: 'badge-rejected' }

function StatCard({ icon: Icon, label, value, accent, sub, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}><Icon className="w-5 h-5" /></div>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
      {loading
        ? <div className="h-8 w-12 bg-slate-100 rounded animate-pulse mb-1" />
        : <div className="font-serif text-3xl font-bold text-navy">{value ?? '—'}</div>
      }
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  )
}

function Skeleton({ rows = 3 }) {
  return [...Array(rows)].map((_, i) => (
    <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4 border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2"><div className="h-3.5 bg-slate-100 rounded w-1/2" /><div className="h-3 bg-slate-100 rounded w-1/3" /></div>
    </div>
  ))
}

export default function CompanyDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['company-profile', user?.id],
    queryFn:  () => companyAPI.getProfile(user.id).then(r => r.data),
    enabled:  !!user?.id,
  })

  const { data: oppsData, isLoading: oppsLoading } = useQuery({
    queryKey: ['company-opportunities', user?.id],
    queryFn:  () => companyAPI.getOpportunities(user.id).then(r => r.data),
    enabled:  !!user?.id,
  })

  const { data: applicantsData, isLoading: appsLoading } = useQuery({
    queryKey: ['company-applicants', user?.id],
    queryFn:  () => companyAPI.getApplicants(user.id, { limit: 5 }).then(r => r.data),
    enabled:  !!user?.id,
  })

  const statusMutation = useMutation({
    mutationFn: ({ appId, status }) => companyAPI.updateAppStatus(appId, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['company-applicants', user?.id]) },
    onError:   (e) => toast.error(e?.message || 'Failed to update'),
  })

  const profile    = profileData
  const opps       = oppsData?.data ?? oppsData ?? []
  const applicants = applicantsData?.data ?? applicantsData ?? []

  const activeOpps      = opps.filter(o => o.status === 'published').length
  const totalApplicants = applicants.length
  const shortlisted     = applicants.filter(a => a.status === 'shortlisted').length
  const placed          = applicants.filter(a => a.status === 'placed').length

  const companyName = profile?.name || user?.name || 'Your Company'
  const initials    = companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl">

      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy">{companyName}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {profile?.industry || 'Company'}{profile?.company_size ? ` · ${profile.company_size} employees` : ''}{profile?.location ? ` · ${profile.location}` : ''}
          </p>
        </div>
        <Link to="/company/post" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Post opportunity
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        <StatCard icon={Briefcase}   label="Active listings"  value={activeOpps}      accent="bg-blue-50 text-blue-DEFAULT"     sub={opps.length > 0 ? `of ${opps.length} total` : undefined} loading={oppsLoading} />
        <StatCard icon={Users}       label="Total applicants" value={totalApplicants}  accent="bg-purple-50 text-purple-600"    loading={appsLoading} />
        <StatCard icon={TrendingUp}  label="Shortlisted"      value={shortlisted}      accent="bg-blue-50 text-blue-DEFAULT"    loading={appsLoading} />
        <StatCard icon={CheckCircle} label="Placed"           value={placed}           accent="bg-success-light text-success"   loading={appsLoading} />
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">

          {/* Opportunities table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-navy">Posted opportunities</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage your listings</p>
              </div>
              <Link to="/company/post" className="text-sm font-semibold text-blue-DEFAULT flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> New post
              </Link>
            </div>
            {oppsLoading
              ? <div className="px-6 py-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              : opps.length === 0
                ? <div className="px-6 py-12 text-center"><p className="text-slate-400 text-sm">No opportunities posted yet.</p><Link to="/company/post" className="btn-primary btn-sm mt-3 inline-flex">Post your first →</Link></div>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Opportunity', 'Status', 'Applicants', 'Deadline', ''].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {opps.map((opp) => {
                          const deadline = opp.deadline ? new Date(opp.deadline).toLocaleDateString('en-KE', { day:'numeric', month:'short' }) : '—'
                          return (
                            <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-navy">{opp.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5 capitalize">{opp.type} · {opp.location} · {opp.positions || 1} position{(opp.positions || 1) > 1 ? 's' : ''}</p>
                              </td>
                              <td className="px-5 py-4"><span className={OPP_STATUS[opp.status] || 'badge-draft'}>{opp.status}</span></td>
                              <td className="px-5 py-4 text-sm font-semibold text-navy">{opp.application_count ?? 0}</td>
                              <td className="px-5 py-4 text-sm text-slate-400">{deadline}</td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <button className="btn btn-sm bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" /> View
                                  </button>
                                  {opp.status !== 'closed' && (
                                    <button className="btn btn-sm bg-blue-50 text-blue-DEFAULT hover:bg-blue-100 flex items-center gap-1">
                                      <Edit3 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
            }
          </div>

          {/* Applicants */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-navy">Recent applicants</h2>
                <p className="text-xs text-slate-400 mt-0.5">Review and manage your pipeline</p>
              </div>
              <Link to="/company/applicants" className="text-sm font-semibold text-blue-DEFAULT flex items-center gap-1 hover:gap-2 transition-all">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {appsLoading
              ? <Skeleton rows={4} />
              : applicants.length === 0
                ? <div className="px-6 py-10 text-center"><p className="text-slate-400 text-sm">No applicants yet.</p></div>
                : applicants.map((a) => {
                  const name     = a.student?.name || a.name || 'Applicant'
                  const initial  = name[0]?.toUpperCase() || '?'
                  const oppTitle = a.opportunity?.title || a.opp || ''
                  const skills   = a.student?.skills || []
                  const COLORS   = ['bg-blue-DEFAULT','bg-success','bg-purple-500','bg-info','bg-warning']
                  const color    = COLORS[name.charCodeAt(0) % COLORS.length]
                  return (
                    <div key={a.id} className="px-6 py-4 flex items-center gap-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{initial}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy">{name}</p>
                        {oppTitle && <p className="text-xs text-slate-400 mt-0.5 truncate">Applied for {oppTitle}</p>}
                        {skills.length > 0 && (
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {skills.slice(0, 3).map(s => <span key={s} className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{s}</span>)}
                          </div>
                        )}
                      </div>
                      <span className={APP_STATUS[a.status] || 'badge-pending'}>{a.status}</span>
                      <div className="flex gap-2 flex-shrink-0">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => statusMutation.mutate({ appId: a.id, status: 'shortlisted' })}
                              className="btn btn-sm bg-blue-50 text-blue-DEFAULT hover:bg-blue-100">Shortlist</button>
                            <button onClick={() => statusMutation.mutate({ appId: a.id, status: 'rejected' })}
                              className="btn btn-sm bg-danger-light text-danger hover:bg-danger hover:text-white">Reject</button>
                          </>
                        )}
                        {a.status !== 'pending' && (
                          <button className="btn btn-sm bg-slate-100 text-slate-600">View CV</button>
                        )}
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-DEFAULT rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy truncate">{companyName}</p>
                <p className="text-xs text-slate-400 capitalize">{profile?.industry || '—'} · {profile?.company_size || '—'}</p>
              </div>
              {profile?.status === 'approved' && <span className="badge badge-approved flex-shrink-0">Verified ✓</span>}
              {profile?.status === 'pending'  && <span className="badge badge-pending-co flex-shrink-0">Pending</span>}
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                [opps.length,     'Total posts'],
                [totalApplicants, 'Applicants'],
                [placed,          'Placed'],
                [shortlisted,     'Shortlisted'],
              ].map(([n, l]) => (
                <div key={l} className="bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100">
                  <div className="font-serif text-xl font-bold text-navy">{n}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
            <Link to="/company/settings" className="btn-secondary w-full text-xs py-2 justify-center">✏️ Edit company profile</Link>
          </div>

          <div className="card p-5 bg-gradient-to-br from-blue-DEFAULT to-blue-800 border-0">
            <h3 className="font-semibold text-white mb-2">Ready to find talent?</h3>
            <p className="text-blue-200 text-xs leading-relaxed mb-4">Post a new internship, attachment or graduate role and start receiving applications today.</p>
            <Link to="/company/post" className="btn bg-white text-navy hover:bg-slate-100 text-xs py-2 w-full justify-center">
              Post new opportunity <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
