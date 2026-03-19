import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, Users, Building2, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminAPI } from '@/api/client'
import ApplicationsChart from '@/components/shared/ApplicationsChart'
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
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        {alert && (
          <span className="text-[10px] font-bold bg-warning-light text-warning-dark px-2 py-0.5 rounded-full">
            {alert}
          </span>
        )}
      </div>
      {loading
        ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
        : <div className="font-serif text-3xl font-bold text-navy">
            {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
          </div>
      }
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const qc = useQueryClient()

  const { data: stats, isLoading: dashLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => adminAPI.dashboard().then(r => r.data.data ?? r.data),
  })

  const { data: companiesData, isLoading: cosLoading } = useQuery({
    queryKey: ['admin-companies-pending'],
    queryFn:  () => adminAPI.companies({ status: 'pending', limit: 10 }).then(r => r.data.data ?? r.data),
  })

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn:  () => adminAPI.applications({ limit: 10 }).then(r => r.data.data ?? r.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveCompany(id),
    onSuccess:  () => {
      toast.success('Company approved ✓')
      qc.invalidateQueries(['admin-companies-pending'])
      qc.invalidateQueries(['admin-dashboard'])
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectCompany(id),
    onSuccess:  () => {
      toast.success('Company rejected')
      qc.invalidateQueries(['admin-companies-pending'])
      qc.invalidateQueries(['admin-dashboard'])
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateAppStatus(id, { status }),
    onSuccess:  () => {
      toast.success('Status updated')
      qc.invalidateQueries(['admin-applications'])
      qc.invalidateQueries(['admin-dashboard'])
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  })

  // stats is now flat: { students, companies, applications, placements, pending_applications, ... }
  const companies    = Array.isArray(companiesData) ? companiesData : []
  const apps         = Array.isArray(appsData) ? appsData : []
  const pendingCount = stats?.pending_companies ?? companies.length

  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })


  return (
    <div className="p-6 lg:p-8 max-w-screen-xl">

      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="font-serif text-2xl font-bold text-navy">Platform Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{dateStr} · All systems operational 🟢</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-7">
        <StatCard icon={Users}       label="Students"      value={stats?.students}      accent="bg-blue-50 text-blue-DEFAULT"  loading={dashLoading} />
        <StatCard icon={Building2}   label="Companies"     value={stats?.companies}     accent="bg-purple-50 text-purple-600"  loading={dashLoading}
          alert={pendingCount > 0 ? `${pendingCount} pending` : undefined} />
        <StatCard icon={FileText}    label="Opportunities" value={stats?.opportunities} accent="bg-warning-light text-warning"  loading={dashLoading} />
        <StatCard icon={BarChart3}   label="Applications"  value={stats?.applications}  accent="bg-blue-50 text-blue-DEFAULT"  loading={dashLoading} />
        <StatCard icon={CheckCircle} label="Placements"    value={stats?.placements}    accent="bg-success-light text-success" loading={dashLoading} />
      </div>

      <ApplicationsChart />

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
                  {cosLoading ? 'Loading...' : `${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'} awaiting review`}
                </p>
              </div>
              <Link to="/admin/companies" className="text-sm font-semibold text-blue-DEFAULT hover:underline">
                View all →
              </Link>
            </div>

            {cosLoading ? (
              <div className="px-6 py-4 space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : companies.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-slate-400 text-sm">No pending approvals. 🎉</p>
              </div>
            ) : (
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
                      const date = (co.registered_at || co.created_at)
                        ? new Date(co.registered_at || co.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short' })
                        : '—'
                      return (
                        <tr key={co.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-navy">{co.name}</p>
                            <p className="text-xs text-slate-400">{co.email} · {co.company_size || '—'}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">{co.industry || '—'}</td>
                          <td className="px-5 py-4 text-sm text-slate-400">{date}</td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => approveMutation.mutate(co.id)}
                                disabled={approveMutation.isPending}
                                className="btn btn-sm bg-success-light text-success-dark hover:bg-success hover:text-white transition-all">
                                ✓ Approve
                              </button>
                              <button onClick={() => rejectMutation.mutate(co.id)}
                                disabled={rejectMutation.isPending}
                                className="btn btn-sm bg-danger-light text-danger hover:bg-danger hover:text-white transition-all">
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Applications management */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-navy">Application management</h2>
                <p className="text-xs text-slate-400 mt-0.5">Update statuses and confirm placements</p>
              </div>
              <Link to="/admin/applications" className="text-sm font-semibold text-blue-DEFAULT hover:underline">
                View all →
              </Link>
            </div>

            {appsLoading ? (
              <div className="px-6 py-4 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : apps.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-slate-400 text-sm">No applications yet.</p>
              </div>
            ) : (
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
                      // Server returns flat fields: student_name, opportunity_title, company_name
                      const studentName = a.student_name      || '—'
                      const oppTitle    = a.opportunity_title  || '—'
                      const coName      = a.company_name       || '—'
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-navy">{studentName}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[160px]">{oppTitle}</td>
                          <td className="px-5 py-4 text-sm text-slate-400">{coName}</td>
                          <td className="px-5 py-4">
                            <span className={STATUS_STYLES[a.status] || 'badge-pending'}>{a.status}</span>
                          </td>
                          <td className="px-5 py-4">
                            <select
                              defaultValue={a.status}
                              onChange={(e) => statusMutation.mutate({ id: a.id, status: e.target.value })}
                              disabled={statusMutation.isPending}
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
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Breakdown */}
          <div className="card p-5">
            <h3 className="font-semibold text-navy mb-5">Application breakdown</h3>
            {dashLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : (() => {
              const total = Math.max(stats?.applications || 1, 1)
              return [
                { label:'Pending',     count: stats?.pending_applications     ?? 0, color:'bg-warning' },
                { label:'Shortlisted', count: stats?.shortlisted_applications ?? 0, color:'bg-blue-DEFAULT' },
                { label:'Placed',      count: stats?.placed_applications      ?? 0, color:'bg-success' },
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
                    <div className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.round((count / total) * 100)}%` }} />
                  </div>
                </div>
              ))
            })()}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-navy mb-4">⚡ Quick actions</h3>
            <div className="space-y-2">
              <Link to="/admin/companies"
                className="btn text-xs py-2.5 w-full justify-start px-4 bg-blue-50 text-blue-DEFAULT hover:bg-blue-DEFAULT hover:text-white transition-all">
                View all companies
              </Link>
              <Link to="/admin/applications"
                className="btn text-xs py-2.5 w-full justify-start px-4 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white transition-all">
                View all applications
              </Link>
            </div>
          </div>

          {/* Recent activity */}
          {stats?.recent_applications?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-navy text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Recent applications
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.recent_applications.slice(0, 5).map((a) => (
                  <div key={a.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">📋</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-relaxed truncate">
                        <span className="font-semibold">{a.student_name}</span> applied for {a.opportunity_title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{a.company_name}</p>
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