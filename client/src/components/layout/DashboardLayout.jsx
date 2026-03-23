import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import NexlynkLogo from '@/components/shared/NexlynkLogo'
import {
  LayoutDashboard, Search, FileText, User,
  Building2, Users, Briefcase, Settings,
  BarChart3, Shield, LogOut, Bell, ChevronDown, CheckCircle, Clock, X, Menu
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/authStore'
import { studentAPI, companyAPI, adminAPI } from '@/api/client'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLE_LABEL  = { student: 'Student', company: 'Company', admin: 'Administrator' }
const ROLE_ACCENT = { student: 'bg-blue-700/40', company: 'bg-success/20', admin: 'bg-purple-700/30' }

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])
  return { open, setOpen, ref }
}

function useNotifications(role, userId) {
  const studentQ = useQuery({
    queryKey: ['student-applications', userId],
    queryFn:  () => studentAPI.getApplications(userId).then(r => r.data.data ?? r.data),
    enabled:  role === 'student' && !!userId,
  })
  const companyQ = useQuery({
    queryKey: ['company-applicants-recent', userId],
    queryFn:  () => companyAPI.getApplicants(userId, { limit: 20 }).then(r => r.data.data ?? r.data),
    enabled:  role === 'company' && !!userId,
  })
  const adminQ = useQuery({
    queryKey: ['admin-companies-pending'],
    queryFn:  () => adminAPI.companies({ status: 'pending', limit: 20 }).then(r => r.data.data ?? r.data),
    enabled:  role === 'admin',
  })

  if (role === 'student') {
    const apps  = Array.isArray(studentQ.data) ? studentQ.data : []
    const items = apps.filter(a => a.status !== 'pending').slice(0, 8).map(a => ({
      id: a.id, text: `${a.opportunity?.title || 'Opportunity'} — ${a.status}`,
      sub: a.opportunity?.company_name || '',
      icon: a.status === 'shortlisted' ? 'shortlisted' : a.status === 'placed' ? 'placed' : 'rejected',
      time: a.updated_at,
    }))
    return { items, count: items.length }
  }
  if (role === 'company') {
    const apps    = Array.isArray(companyQ.data) ? companyQ.data : []
    const pending = apps.filter(a => a.status === 'pending').slice(0, 8)
    const items   = pending.map(a => ({
      id: a.id, text: `${a.student?.name || 'Applicant'} applied`,
      sub: a.opportunity?.title || '', icon: 'pending', time: a.created_at,
    }))
    return { items, count: items.length }
  }
  if (role === 'admin') {
    const companies = Array.isArray(adminQ.data) ? adminQ.data : []
    const items     = companies.slice(0, 8).map(c => ({
      id: c.id, text: `${c.name} awaiting approval`,
      sub: c.industry || '', icon: 'pending', time: c.created_at,
    }))
    return { items, count: items.length }
  }
  return { items: [], count: 0 }
}

function useBadgeCounts(role, userId) {
  const studentApps = useQuery({
    queryKey: ['student-applications', userId],
    queryFn:  () => studentAPI.getApplications(userId).then(r => r.data.data ?? r.data),
    enabled:  role === 'student' && !!userId,
  })
  const companyApplicants = useQuery({
    queryKey: ['company-applicants-recent', userId],
    queryFn:  () => companyAPI.getApplicants(userId, { limit: 100 }).then(r => r.data.data ?? r.data),
    enabled:  role === 'company' && !!userId,
  })
  const adminPending = useQuery({
    queryKey: ['admin-companies-pending'],
    queryFn:  () => adminAPI.companies({ status: 'pending' }).then(r => r.data.data ?? r.data),
    enabled:  role === 'admin',
  })

  if (role === 'student') {
    const apps = Array.isArray(studentApps.data) ? studentApps.data : []
    return { '/student/applications': apps.length || null }
  }
  if (role === 'company') {
    const apps    = Array.isArray(companyApplicants.data) ? companyApplicants.data : []
    const pending = apps.filter(a => a.status === 'pending').length
    return { '/company/applicants': pending || null }
  }
  if (role === 'admin') {
    const companies = Array.isArray(adminPending.data) ? adminPending.data : []
    return { '/admin/companies': companies.length || null }
  }
  return {}
}

function useProfileName(role, userId) {
  const { data } = useQuery({
    queryKey: role === 'student' ? ['student-profile', userId] : ['company-profile', userId],
    queryFn:  () => role === 'student'
      ? studentAPI.getProfile(userId).then(r => r.data.data ?? r.data)
      : companyAPI.getProfile(userId).then(r => r.data.data ?? r.data),
    enabled:  !!userId && role !== 'admin',
  })
  return data?.name || null
}

const NOTIF_ICON = {
  shortlisted: <CheckCircle className="w-4 h-4 text-blue-DEFAULT" />,
  placed:      <CheckCircle className="w-4 h-4 text-success" />,
  rejected:    <X className="w-4 h-4 text-danger" />,
  pending:     <Clock className="w-4 h-4 text-warning" />,
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const NAV_BASE = {
  student: [
    { label: 'Dashboard',        to: '/student',               icon: LayoutDashboard },
    { label: 'Browse Jobs',      to: '/student/opportunities',  icon: Search },
    { label: 'Applications',     to: '/student/applications',   icon: FileText },
    { label: 'My Profile',       to: '/student/profile',        icon: User },
  ],
  company: [
    { label: 'Dashboard',        to: '/company',                icon: LayoutDashboard },
    { label: 'Post Opportunity', to: '/company/post',           icon: Briefcase },
    { label: 'Applicants',       to: '/company/applicants',     icon: Users },
    { label: 'Settings',         to: '/company/settings',       icon: Settings },
  ],
  admin: [
    { label: 'Dashboard',        to: '/admin',                  icon: BarChart3 },
    { label: 'Companies',        to: '/admin/companies',        icon: Building2 },
    { label: 'Applications',     to: '/admin/applications',     icon: FileText },
  ],
}

// ── Sidebar content — reused in both desktop and mobile drawer
function SidebarContent({ role, navItems, badgeCounts, displayName, initials, onNav, handleLogout, user }) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[.08] flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 group" onClick={onNav}>
          <NexlynkLogo variant="white" className="group-hover:opacity-80 transition-opacity" />
        </NavLink>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3">
        <div className={clsx('flex items-center gap-2 rounded-lg px-3 py-2', ROLE_ACCENT[role])}>
          {role === 'admin'   && <Shield    className="w-3.5 h-3.5 text-purple-300" />}
          {role === 'company' && <Building2 className="w-3.5 h-3.5 text-success" />}
          {role === 'student' && <User      className="w-3.5 h-3.5 text-blue-300" />}
          <span className={clsx('text-xs font-bold',
            role === 'admin'   ? 'text-purple-300' :
            role === 'company' ? 'text-success' : 'text-blue-300'
          )}>{ROLE_LABEL[role]}</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 pt-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon }) => {
          const badge = badgeCounts[to]
          return (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length <= 2}
              onClick={onNav}
              className={({ isActive }) => clsx('nav-link', isActive && 'active')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="text-[10px] font-bold bg-danger text-white px-1.5 py-0.5 rounded-full">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-white/[.08]">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left text-danger/70 hover:text-danger hover:bg-danger/10"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>

      {/* User strip */}
      <div className="px-4 pb-5 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-DEFAULT flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const location         = useLocation()
  const notifDD          = useDropdown()
  const accountDD        = useDropdown()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const { items: notifItems, count: notifCount } = useNotifications(role, user?.id)
  const badgeCounts = useBadgeCounts(role, user?.id)
  const profileName = useProfileName(role, user?.id)

  const displayName = profileName || user?.name || user?.email || 'Account'
  const firstName   = displayName.split(' ')[0]
  const initials    = displayName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
  const navItems    = NAV_BASE[role] || []

  const handleLogout = async () => {
    accountDD.setOpen(false)
    setSidebarOpen(false)
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const sidebarProps = {
    role, navItems, badgeCounts, displayName,
    initials, handleLogout, user,
    onNav: () => setSidebarOpen(false),
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Desktop sidebar — hidden on mobile ─────────── */}
      <aside className="hidden lg:flex w-60 bg-navy flex-col flex-shrink-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile sidebar overlay ──────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ───────────────────────── */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-72 bg-navy flex flex-col z-50 transition-transform duration-300 ease-in-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-3 flex-shrink-0 z-30">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600 flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            <NexlynkLogo variant="full" className="h-7" />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">

            {/* Notifications */}
            <div className="relative" ref={notifDD.ref}>
              <button
                onClick={() => { notifDD.setOpen(o => !o); accountDD.setOpen(false) }}
                className="btn-icon relative"
              >
                <Bell className="w-4 h-4" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full ring-2 ring-white" />
                )}
              </button>

              {notifDD.open && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-navy text-sm">Notifications</h3>
                    {notifCount > 0 && <span className="text-xs font-bold text-blue-DEFAULT">{notifCount} new</span>}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifItems.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No notifications yet</p>
                      </div>
                    ) : notifItems.map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-50 flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">{NOTIF_ICON[n.icon]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy leading-tight">{n.text}</p>
                          {n.sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{n.sub}</p>}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">{timeAgo(n.time)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Account dropdown */}
            <div className="relative" ref={accountDD.ref}>
              <button
                onClick={() => { accountDD.setOpen(o => !o); notifDD.setOpen(false) }}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-DEFAULT transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">
                  {firstName}
                </span>
                <ChevronDown className={clsx('w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block', accountDD.open && 'rotate-180')} />
              </button>

              {accountDD.open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-navy truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    <span className={clsx('text-[10px] font-bold mt-1 inline-block capitalize px-2 py-0.5 rounded-full',
                      role === 'admin'   ? 'bg-purple-100 text-purple-700' :
                      role === 'company' ? 'bg-success-light text-success-dark' :
                      'bg-blue-50 text-blue-700'
                    )}>{ROLE_LABEL[role]}</span>
                  </div>
                  <div className="py-1">
                    {role === 'student' && (
                      <Link to="/student/profile" onClick={() => accountDD.setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <User className="w-4 h-4 text-slate-400" /> My Profile
                      </Link>
                    )}
                    {role === 'company' && (
                      <Link to="/company/settings" onClick={() => accountDD.setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <Settings className="w-4 h-4 text-slate-400" /> Company Settings
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-light w-full text-left transition-colors">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>

        {/* ── Mobile bottom nav bar ───────────────────── */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 flex items-center">
          {navItems.map(({ label, to, icon: Icon }) => {
            const badge = badgeCounts[to]
            return (
              <NavLink
                key={to}
                to={to}
                end={to.split('/').length <= 2}
                className={({ isActive }) => clsx(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-colors',
                  isActive ? 'text-blue-DEFAULT' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-danger text-white w-4 h-4 rounded-full flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">{label.split(' ')[0]}</span>
              </NavLink>
            )
          })}
        </nav>

      </div>
    </div>
  )
}