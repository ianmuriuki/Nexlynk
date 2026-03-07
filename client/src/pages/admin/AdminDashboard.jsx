import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, Users, Building2, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { adminAPI } from '@/api/client'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_STYLES = {
  pending:     'badge-pending',
  shortlisted: 'badge-shortlisted',
  placed:      'badge-placed',
  rejected:    'badge-rejected',
}

function StatCard({ icon: Icon, label, value, accent, alert, loading }) {
  return (
    <div className={clsx('card p-5', alert && 'border-warning/40')}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}><Icon className="w-5 h-5" /></div>
        {alert && <span className="text-[10px] font-bold bg-warning-light text-warning-dark px-2 py-0.5 rounded-full">{alert}</span>}
      </div>
      {loading
        ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
        : <div className="font-serif text-3xl font-bold text-navy">{typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}</div>
      }
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const qc = useQueryClient()

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => adminAPI.dashboard().then(r => r.data),
  })

  const { data: companiesData, isLoading: cosLoading } = useQuery({
    queryKey: ['admin-companies-pending'],
    queryFn:  () => adminAPI.companies({ status: 'pending', limit: 10 }).then(r => r.data),
  })

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn:  () => adminAPI.applications({ limit: 10 }).then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveCompany(id),
    onSuccess:  () => { toast.success('Company approved ✓'); qc.invalidateQueries(['admin-companies-pending']); qc.invalidateQueries(['admin-dashboard']) },
    onError:    (e) => toast.error(e?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectCompany(id),
    onSuccess:  () => { toast.success('Company rejected'); qc.invalidateQueries(['admin-companies-pending']) },
    onError:    (e) => toast.error(e?.message || 'Failed'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateAppStatus(id, { status }),
    onSuccess:  () => { toast.success('Status updated'); qc.invalidateQueries(['admin-applications']); qc.invalidateQueries(['admin-dashboard']) },
    onError:    (e) => toast.error(e?.message || 'Failed'),
  })

  const stats     = dashData
  const companies = companiesData?.data ?? companiesData ?? []
  const apps      = appsData?.data ?? appsData ?? []

  const pendingCount = companies.filter(c => c.status === 'pending').length

  // Build bar chart from dashboard monthly data if available
  const months = stats?.monthly_stats ?? [
    {month:'Oct'},{month:'Nov'},{month:'Dec'},{month:'Jan'},{month:'Feb'},{month:'Mar'}
  ]
  const maxApps = Math.max(...months.map(m => m.applications || 1), 1)

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl">

      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="font-serif text-2xl font-bold text-navy">Platform Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{dateStr} · All systems operational 🟢</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-7">
        <StatCard icon={Users}       label="Students"       value={stats?.students}      accent="bg-blue-50 text-blue-DEFAULT"    loading={dashLoading} />
        <StatCard icon={Building2}   label="Companies"      value={stats?.companies}     accent="bg-purple-50 text-purple-600"    loading={dashLoading} alert={pendingCount > 0 ? `${pendingCount} pending` : undefined} />
        <StatCard icon={FileText}    label="Opportunities"  value={stats?.opportunities} accent="bg-warning-light text-warning"   loading={dashLoading} />
        <StatCard icon={BarChart3}   label="Applications"   value={stats?.applications}  accent="bg-blue-50 text-blue-DEFAULT"    loading={dashLoading} />
        <StatCard icon={CheckCircle} label="Placements"     value={stats?.placements}    accent="bg-success-light text-success"   loading={dashLoading} />
      </div>

      {/* Bar chart */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-navy">Applications — last 6 months</h2>
            <p className="text-xs text-slate-400 mt-0.5">Applications received vs placements</p>
          </div>
        </div>
        <div className="flex items-end gap-3 mb-3" style={{ height: '120px' }}>
          {months.slice(-6).map((m) => {
            const appH   = ((m.applications || 0) / maxApps) * 100
            const placeH = ((m.placements   || 0) / maxApps) * 100
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end" style={{ height: '100px' }}>
                  <div className="flex-1 bg-blue-100 rounded-t-lg hover:bg-blue-200 transition-colors" style={{ height: `${Math.max(appH, 4)}%` }} title={`${m.applications || 0} apps`} />
                  <div className="flex-1 bg-blue-DEFAULT rounded-t-lg hover:bg-blue-800 transition-colors" style={{ height: `${Math.max(placeH, 2)}%` }} title={`${m.placements || 0} placed`} />
                </div>
                <span className="text-[11px] text-slate-400">{m.month}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-end gap-5">
          <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded-sm bg-blue-100" /><span>Applications</span></div>
          <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded-sm bg-blue-DEFAULT" /><span>Placements</span></div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">

          {/* Pending companies */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-navy flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" /> Pending company approvals
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {cosLoading ? 'Loading...' : `${pendingCount} compan${pendingCount !== 1 ? 'ies' : 'y'} awaiting review`}
                </p>
              </div>
            </div>
            {cosLoading
              ? <div className="px-6 py-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              : companies.length === 0
                ? <div className="px-6 py-10 text-center"><p className="text-slate-400 text-sm">No pending approvals.</p></div>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Company', 'Industry', 'Registered', 'Actions'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {companies.map(co => {
                          const date = co.created_at ? new Date(co.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short' }) : '—'
                          return (
                            <tr key={co.id} className="hover:bg-slate-50/80">
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-navy">{co.name}</p>
                                <p className="text-xs text-slate-400">{co.email} · {co.company_size}</p>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-500">{co.industry || '—'}</td>
                              <td className="px-5 py-4 text-sm text-slate-400">{date}</td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => approveMutation.mutate(co.id)}
                                    disabled={approveMutation.isPending}
                                    className="btn btn-sm bg-success-light text-success-dark hover:bg-success hover:text-white"
                                  >✓ Approve</button>
                                  <button
                                    onClick={() => rejectMutation.mutate(co.id)}
                                    disabled={rejectMutation.isPending}
                                    className="btn btn-sm bg-danger-light text-danger hover:bg-danger hover:text-white"
                                  >Reject</button>
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

          {/* Applications management */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-navy">Application management</h2>
              <p className="text-xs text-slate-400 mt-0.5">Update statuses and confirm placements</p>
            </div>
            {appsLoading
              ? <div className="px-6 py-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              : apps.length === 0
                ? <div className="px-6 py-10 text-center"><p className="text-slate-400 text-sm">No applications yet.</p></div>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Student', 'Opportunity', 'Company', 'Status', 'Update'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {apps.map((a) => {
                          const studentName = a.student?.name || a.student_name || '—'
                          const university  = a.student?.university || ''
                          const oppTitle    = a.opportunity?.title  || a.opportunity_title || '—'
                          const coName      = a.opportunity?.company?.name || a.company_name || '—'
                          return (
                            <tr key={a.id} className="hover:bg-slate-50/80">
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-navy">{studentName}</p>
                                {university && <p className="text-xs text-slate-400">{university}</p>}
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[160px]">{oppTitle}</td>
                              <td className="px-5 py-4 text-sm text-slate-400">{coName}</td>
                              <td className="px-5 py-4"><span className={STATUS_STYLES[a.status] || 'badge-pending'}>{a.status}</span></td>
                              <td className="px-5 py-4">
                                <select
                                  defaultValue={a.status}
                                  onChange={(e) => statusMutation.mutate({ id: a.id, status: e.target.value })}
                                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:border-blue-DEFAULT cursor-pointer"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="shortlisted">Shortlisted</option>
                                  <option value="placed">Placed</option>
                                  <option value="rejected">Rejected</option>
                                </select>
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
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Breakdown */}
          <div className="card p-5">
            <h3 className="font-semibold text-navy mb-5">Application breakdown</h3>
            {dashLoading
              ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>
              : (() => {
                const total = stats?.applications || 1
                return [
                  { label:'Pending',     count: stats?.pending_applications     ?? 0, color:'bg-warning' },
                  { label:'Shortlisted', count: stats?.shortlisted_applications ?? 0, color:'bg-blue-DEFAULT' },
                  { label:'Placed',      count: stats?.placements               ?? 0, color:'bg-success' },
                  { label:'Rejected',    count: stats?.rejected_applications    ?? 0, color:'bg-danger' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="mb-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-600 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}
                      </span>
                      <span className="text-sm font-bold text-navy">{count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round((count/total)*100)}%` }} />
                    </div>
                  </div>
                ))
              })()
            }
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-navy mb-4">⚡ Quick actions</h3>
            <div className="space-y-2">
              {[
                { label: 'View all companies',    cls: 'bg-blue-50 text-blue-DEFAULT hover:bg-blue-DEFAULT hover:text-white',     href: '/admin/companies' },
                { label: 'View all applications', cls: 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white',       href: '/admin/applications' },
                { label: 'Generate report',       cls: 'bg-success-light text-success-dark hover:bg-success hover:text-white',   href: null },
              ].map(({ label, cls, href }) =>
                href
                  ? <a key={label} href={href} className={`btn text-xs py-2.5 w-full justify-start px-4 ${cls} transition-all`}>{label}</a>
                  : <button key={label} className={`btn text-xs py-2.5 w-full justify-start px-4 ${cls} transition-all`}>{label}</button>
              )}
            </div>
          </div>

          {/* Recent activity from dashboard */}
          {stats?.recent_activity?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-navy text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Recent activity
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.recent_activity.slice(0, 5).map((a, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">📋</div>
                    <div>
                      <p className="text-xs text-slate-700 leading-relaxed">{a.description || a.action || JSON.stringify(a)}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {a.created_at ? new Date(a.created_at).toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
