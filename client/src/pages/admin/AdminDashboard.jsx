import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import Icon from '@/components/Icon'
import ConfirmModal from '@/components/ui/ConfirmModal'
import StatusPill from '@/components/ui/StatusPill'
import { Link } from 'react-router-dom'
import { adminAPI } from '@/api/admin'
import ApplicationsChart from '@/components/shared/ApplicationsChart'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function StatCard({ icon, label, value, alert, loading }) {
  return (
    <div className={clsx('stat-card', alert && 'border-warning/40')}>
      <div className="flex items-start justify-between mb-3">
        <div className="stat-icon">
          <Icon name={icon} size={20} />
        </div>
        {alert && (
          <span className="text-[10px] font-bold bg-warning-light text-warning-dark px-2 py-0.5 rounded-full">
            {alert}
          </span>
        )}
      </div>
      {loading
        ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
        : <div className="tabular-nums text-3xl font-extrabold text-ink">
            {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
          </div>
      }
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const qc = useQueryClient()
  const [confirmation, setConfirmation] = useState(null)

  const { data: stats, isPending: dashLoading, isError: dashError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => adminAPI.dashboard().then(r => r.data.data ?? r.data),
  })

  const { data: companiesData, isPending: cosLoading, isError: cosError } = useQuery({
    queryKey: ['admin-companies-pending'],
    queryFn:  () => adminAPI.companies({ status: 'pending', limit: 10 }).then(r => r.data.data ?? r.data),
  })

  const { data: appsData, isPending: appsLoading, isError: appsError } = useQuery({
    queryKey: ['admin-applications'],
    queryFn:  () => adminAPI.applications({ limit: 10 }).then(r => r.data.data ?? r.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveCompany(id),
    onSuccess:  () => {
      toast.success('Company approved')
      qc.invalidateQueries({ queryKey: ['admin-companies-pending'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectCompany(id),
    onSuccess:  () => {
      toast.success('Company rejected')
      qc.invalidateQueries({ queryKey: ['admin-companies-pending'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateAppStatus(id, { status }),
    onSuccess:  () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['admin-applications'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  })

  const companies    = Array.isArray(companiesData) ? companiesData : []
  const apps         = Array.isArray(appsData) ? appsData : []
  const pendingCount = stats?.pending_companies ?? companies.length

  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      <ConfirmModal
        open={Boolean(confirmation)}
        title={confirmation?.action === 'approve' ? 'Approve company?' : 'Reject company?'}
        description={confirmation ? `${confirmation.company.name} will be ${confirmation.action === 'approve' ? 'approved' : 'rejected'}.` : ''}
        confirmLabel={confirmation?.action === 'approve' ? 'Approve company' : 'Reject company'}
        variant={confirmation?.action === 'reject' ? 'danger' : 'primary'}
        isPending={approveMutation.isPending || rejectMutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (!confirmation) return
          const mutation = confirmation.action === 'approve' ? approveMutation : rejectMutation
          mutation.mutate(confirmation.company.id, {
            onSettled: () => setConfirmation(null),
          })
        }}
      />

      <div className="mb-7 animate-fade-up">
        <h1 className="text-2xl font-extrabold text-ink">Platform Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {dateStr}
          <span className="inline-flex items-center gap-1 text-success">
            <Icon name="check-circle" size={14} /> All systems operational
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-7">
        <StatCard icon="users"       label="Students"      value={stats?.students}      loading={dashLoading} />
        <StatCard icon="building"   label="Companies"     value={stats?.companies}     loading={dashLoading}
          alert={pendingCount > 0 ? `${pendingCount} pending` : undefined} />
        <StatCard icon="file"      label="Opportunities" value={stats?.opportunities} loading={dashLoading} />
        <StatCard icon="bar-chart" label="Applications"  value={stats?.applications}  loading={dashLoading} />
        <StatCard icon="check-circle" label="Placements"    value={stats?.placements}    loading={dashLoading} />
      </div>

      <ApplicationsChart />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="min-w-0 space-y-6">

          {/* Pending companies */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-ink flex items-center gap-2">
                  <Icon name="alert" size={16} className="text-warning" /> Pending company approvals
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {cosLoading ? <span role="status" aria-label="Loading companies" className="inline-block h-3.5 w-48 rounded bg-canvas-2 animate-shimmer" /> : cosError ? 'Company approvals could not be loaded' : `${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'} awaiting review`}
                </p>
              </div>
              <Link to="/admin/companies" className="text-sm font-semibold text-brand hover:underline">
                View all →
              </Link>
            </div>

            {cosLoading ? (
              <div className="px-6 py-4 space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : cosError ? (
              <div className="px-6 py-10 text-center">
                <Icon name="alert-circle" size={28} className="mx-auto mb-2 text-warning" />
                <p className="text-sm font-semibold text-ink-2">Could not load pending companies</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Icon name="check-circle" size={32} className="mx-auto mb-2 text-line-2" />
                <p className="text-slate-400 text-sm">No pending approvals</p>
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
                            <p className="text-sm font-semibold text-ink">{co.name}</p>
                            <p className="text-xs text-slate-400">{co.email} · {co.company_size || '—'}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">{co.industry || '—'}</td>
                          <td className="px-5 py-4 text-sm text-slate-400">{date}</td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => setConfirmation({ action: 'approve', company: co })}
                                disabled={approveMutation.isPending}
                                className="btn btn-sm bg-success-light text-success-dark hover:bg-success hover:text-white transition-all">
                                Approve
                              </button>
                              <button onClick={() => setConfirmation({ action: 'reject', company: co })}
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
                <h2 className="font-semibold text-ink">Application management</h2>
                <p className="text-xs text-slate-400 mt-0.5">Update statuses and confirm placements</p>
              </div>
              <Link to="/admin/applications" className="text-sm font-semibold text-brand hover:underline">
                View all →
              </Link>
            </div>

            {appsLoading ? (
              <div className="px-6 py-4 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : appsError ? (
              <div className="px-6 py-10 text-center">
                <Icon name="alert-circle" size={28} className="mx-auto mb-2 text-warning" />
                <p className="text-sm font-semibold text-ink-2">Could not load applications</p>
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
                      const studentName = a.student_name      || '—'
                      const oppTitle    = a.opportunity_title  || '—'
                      const coName      = a.company_name       || '—'
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-ink">{studentName}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[160px]">{oppTitle}</td>
                          <td className="px-5 py-4 text-sm text-slate-400">{coName}</td>
                          <td className="px-5 py-4">
                            <StatusPill status={a.status} />
                          </td>
                          <td className="px-5 py-4">
                            <select
                              defaultValue={a.status}
                              onChange={(e) => statusMutation.mutate({ id: a.id, status: e.target.value })}
                              disabled={statusMutation.isPending}
                              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:border-brand cursor-pointer"
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
        <div className="min-w-0 space-y-5">

          {/* Breakdown */}
          <div className="card p-5">
            <h3 className="font-semibold text-ink mb-5">Application breakdown</h3>
            {dashLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : dashError ? (
              <p className="py-8 text-center text-sm font-semibold text-ink-3">Could not load application breakdown</p>
            ) : (() => {
              const total = Math.max(stats?.applications || 1, 1)
              return [
                { label:'Pending',     count: stats?.pending_applications     ?? 0, color:'bg-warning' },
                { label:'Shortlisted', count: stats?.shortlisted_applications ?? 0, color:'bg-brand' },
                { label:'Placed',      count: stats?.placed_applications      ?? 0, color:'bg-success' },
                { label:'Rejected',    count: stats?.rejected_applications    ?? 0, color:'bg-danger' },
              ].map(({ label, count, color }) => (
                <div key={label} className="mb-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}
                    </span>
                    <span className="text-sm font-bold text-ink">{count.toLocaleString()}</span>
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
            <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
              <Icon name="zap" size={16} className="text-brand" /> Quick actions
            </h3>
            <div className="space-y-2">
              <Link to="/admin/companies"
                className="btn text-xs py-2.5 w-full justify-start px-4 bg-slate-50 text-ink border border-slate-200 hover:border-brand hover:text-brand transition-all">
                View all companies
              </Link>
              <Link to="/admin/applications"
                className="btn text-xs py-2.5 w-full justify-start px-4 bg-slate-50 text-ink border border-slate-200 hover:border-brand hover:text-brand transition-all">
                View all applications
              </Link>
            </div>
          </div>

          {/* Recent activity */}
          {stats?.recent_applications?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
                  <Icon name="clock" size={16} className="text-ink-4" /> Recent applications
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.recent_applications.slice(0, 5).map((a) => (
                  <div key={a.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                      <Icon name="file" size={14} className="text-brand" />
                    </div>
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
