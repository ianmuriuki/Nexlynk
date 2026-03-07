import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Search, FileText, User, Upload,
  Building2, Users, Briefcase, CheckCircle, Settings,
  BarChart3, Shield, LogOut, Bell, ChevronDown, Zap
} from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

//  Nav config per role — defines the sidebar links, icons, and optional badges for each user role. 
// This allows the DashboardLayout to be dynamic and render the appropriate navigation based on the logged-in user's role. 
const NAV = {
  student: [
    { label: 'Dashboard',      to: '/student',               icon: LayoutDashboard },
    { label: 'Browse Jobs',    to: '/student/opportunities',  icon: Search },
    { label: 'Applications',   to: '/student/applications',   icon: FileText, badge: 3 },
    { label: 'My Profile',     to: '/student/profile',        icon: User },
  ],
  company: [
    { label: 'Dashboard',      to: '/company',               icon: LayoutDashboard },
    { label: 'Post Opportunity', to: '/company/post',         icon: Briefcase },
    { label: 'Applicants',     to: '/company/applicants',    icon: Users, badge: 12 },
    { label: 'Settings',       to: '/company/settings',      icon: Settings },
  ],
  admin: [
    { label: 'Dashboard',      to: '/admin',                 icon: BarChart3 },
    { label: 'Companies',      to: '/admin/companies',       icon: Building2, badge: 7 },
    { label: 'Applications',   to: '/admin/applications',    icon: FileText },
    { label: 'Settings',       to: '/admin/settings',        icon: Settings },
  ],
}

//global layout for all dashboard pages. Contains the sidebar, topbar, and an Outlet for nested routes to render their content.
const ROLE_LABEL = { student: 'Student', company: 'Company', admin: 'Administrator' }
const ROLE_ACCENT = { student: 'bg-blue-700/40', company: 'bg-success/20', admin: 'bg-purple-700/30' }

//the sidebar renders navigation links based on the user's role, and includes a logout button and user info at the bottom.
//the topbar has a placeholder for notifications and a user chip that could be expanded into a dropdown for account settings in the future.
//the main content area uses an Outlet to render the specific page content based on the current route.
export default function DashboardLayout({ role }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)

  const navItems = NAV[role] || []
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* Sidebar  */}
      <aside className="w-60 bg-navy flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[.08]">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-DEFAULT rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-[19px] text-white tracking-tight group-hover:opacity-80 transition-opacity">
              Nexlynk
            </span>
          </NavLink>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3">
          <div className={clsx('flex items-center gap-2 rounded-lg px-3 py-2', ROLE_ACCENT[role])}>
            {role === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-300" />}
            {role === 'company' && <Building2 className="w-3.5 h-3.5 text-success" />}
            {role === 'student' && <User className="w-3.5 h-3.5 text-blue-300" />}
            <span className={clsx('text-xs font-bold',
              role === 'admin' ? 'text-purple-300' :
              role === 'company' ? 'text-success' : 'text-blue-300'
            )}>
              {ROLE_LABEL[role]}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-1 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, to, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length <= 2}
              className={({ isActive }) =>
                clsx('nav-link', isActive && 'active')
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] font-bold bg-danger text-white px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 pt-2 border-t border-white/[.08] space-y-0.5">
          <button
            onClick={handleLogout}
            className="nav-link w-full text-left text-danger/70 hover:text-danger hover:bg-danger/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>

        {/* User */}
        <div className="px-4 pb-5 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-DEFAULT flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main  */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 z-30">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button
              className="btn-icon relative"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full ring-2 ring-white" />
            </button>

            {/* User chip */}
            <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-DEFAULT transition-colors">
              <div className="w-7 h-7 rounded-lg bg-blue-DEFAULT flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">
                {user?.name?.split(' ')[0] || 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}