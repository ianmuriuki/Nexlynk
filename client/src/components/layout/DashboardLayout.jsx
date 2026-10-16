import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Icon from '@/components/Icon'
import NexlynkLogo from '@/components/shared/NexlynkLogo'
import useAuthStore from '@/store/authStore'
import { studentAPI } from '@/api/opportunities'
import { companyAPI } from '@/api/company'
import { adminAPI } from '@/api/admin'

const ROLE_LABEL = { student: 'Student', company: 'Company', admin: 'Administrator' }

const NAV = {
  student: [
    { label: 'Dashboard',    short: 'Home',    to: '/student',               icon: 'dashboard' },
    { label: 'Browse Jobs',  short: 'Jobs',    to: '/student/opportunities', icon: 'search' },
    { label: 'Applications', short: 'Applied', to: '/student/applications',  icon: 'file' },
    { label: 'My Profile',   short: 'Profile', to: '/student/profile',       icon: 'user' },
  ],
  company: [
    { label: 'Dashboard',        short: 'Home',       to: '/company',            icon: 'dashboard' },
    { label: 'Post Opportunity', short: 'Post',       to: '/company/post',       icon: 'briefcase' },
    { label: 'Applicants',       short: 'Applicants', to: '/company/applicants', icon: 'users' },
    { label: 'Settings',         short: 'Settings',   to: '/company/settings',   icon: 'settings' },
  ],
  admin: [
    { label: 'Dashboard',    short: 'Home',         to: '/admin',              icon: 'bar-chart' },
    { label: 'Companies',    short: 'Companies',    to: '/admin/companies',    icon: 'building' },
    { label: 'Applications', short: 'Applications', to: '/admin/applications', icon: 'file' },
  ],
}

const TONE = {
  pending:      { icon: 'clock',        chip: 'bg-warning-light text-warning-dark' },
  under_review: { icon: 'eye',          chip: 'bg-info-light text-info-dark' },
  shortlisted:  { icon: 'check-circle', chip: 'bg-brand-soft text-brand-ink' },
  placed:       { icon: 'check-circle', chip: 'bg-success-light text-success-dark' },
  rejected:     { icon: 'x',            chip: 'bg-danger-light text-danger-dark' },
}

const unwrap = (r) => r.data.data ?? r.data
const asList = (d) => (Array.isArray(d) ? d : [])
const words = (s) => (s || '').replace(/_/g, ' ')

function timeAgo(iso) {
  if (!iso) return ''
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, ref }
}

function useRoleData(role, userId) {
  const student = useQuery({
    queryKey: ['student-applications', userId],
    queryFn: () => studentAPI.getApplications(userId).then(unwrap),
    enabled: role === 'student' && !!userId,
  })
  const company = useQuery({
    queryKey: ['company-applicants-recent', userId],
    queryFn: () => companyAPI.getApplicants(userId, { limit: 100 }).then(unwrap),
    enabled: role === 'company' && !!userId,
  })
  const admin = useQuery({
    queryKey: ['admin-companies-pending'],
    queryFn: () => adminAPI.companies({ status: 'pending' }).then(unwrap),
    enabled: role === 'admin',
  })

  if (role === 'student') {
    const apps = asList(student.data)
    const items = apps.filter((a) => a.status !== 'pending').slice(0, 8).map((a) => ({
      id: a.id,
      tone: a.status,
      title: `${a.opportunity?.title || 'Opportunity'}: ${words(a.status)}`,
      sub: a.opportunity?.company_name || '',
      time: a.updated_at,
    }))
    return { items, badges: { '/student/applications': apps.length || null } }
  }
  if (role === 'company') {
    const pending = asList(company.data).filter((a) => a.status === 'pending')
    const items = pending.slice(0, 8).map((a) => ({
      id: a.id,
      tone: 'pending',
      title: `${a.student?.name || 'Applicant'} applied`,
      sub: a.opportunity?.title || '',
      time: a.created_at,
    }))
    return { items, badges: { '/company/applicants': pending.length || null } }
  }
  if (role === 'admin') {
    const companies = asList(admin.data)
    const items = companies.slice(0, 8).map((c) => ({
      id: c.id,
      tone: 'pending',
      title: `${c.name} awaiting approval`,
      sub: c.industry || '',
      time: c.registered_at,
    }))
    return { items, badges: { '/admin/companies': companies.length || null } }
  }
  return { items: [], badges: {} }
}

function useProfileName(role, userId) {
  const { data } = useQuery({
    queryKey: role === 'student' ? ['student-profile', userId] : ['company-profile', userId],
    queryFn: () => role === 'student'
      ? studentAPI.getProfile(userId).then(unwrap)
      : companyAPI.getProfile(userId).then(unwrap),
    enabled: !!userId && role !== 'admin',
  })
  return data?.name || null
}

function SidebarItem({ item, badge, rail }) {
  return (
    <NavLink
      to={item.to}
      end={item.to.split('/').length <= 2}
      title={rail ? item.label : undefined}
      className={({ isActive }) => clsx(
        'relative flex items-center rounded-[11px] py-[9px] text-[13.5px] font-semibold transition-colors active:scale-[.98]',
        rail ? 'justify-center px-0' : 'gap-3 px-3',
        isActive ? 'bg-brand text-white shadow-brand' : 'text-ink-3 hover:bg-slate-100 hover:text-ink'
      )}
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} size={18} className="flex-shrink-0" />
          {!rail && <span className="flex-1 truncate">{item.label}</span>}
          {badge > 0 && (
            <span className={clsx(
              'font-bold rounded-full tabular-nums',
              rail ? 'absolute top-0.5 right-1 min-w-[16px] px-1 text-center text-[9.5px] leading-4' : 'ml-auto px-2 py-px text-[11px]',
              isActive ? 'bg-white text-brand-ink' : 'bg-canvas-2 text-ink-3'
            )}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function MenuRow({ icon, danger, onClick, to, children }) {
  const cls = clsx(
    'flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-[9px] text-left text-[13px] font-semibold transition-colors',
    danger ? 'text-danger-dark hover:bg-danger-light' : 'text-ink-2 hover:bg-canvas'
  )
  const content = (
    <>
      <Icon name={icon} size={16} className="flex-shrink-0" />
      <span className="truncate">{children}</span>
    </>
  )
  if (to) return <Link to={to} onClick={onClick} className={cls}>{content}</Link>
  return <button type="button" onClick={onClick} className={cls}>{content}</button>
}

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const notifDD = useDropdown()
  const accountDD = useDropdown()
  const [rail, setRail] = useState(() => {
    try { return localStorage.getItem('nx:rail') === '1' } catch { return false }
  })

  const toggleRail = () => setRail((r) => {
    try { localStorage.setItem('nx:rail', r ? '0' : '1') } catch { /* storage unavailable */ }
    return !r
  })

  const { items: notifItems, badges } = useRoleData(role, user?.id)
  const profileName = useProfileName(role, user?.id)

  const displayName = profileName || user?.name || user?.email || 'Account'
  const initials = displayName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?'
  const navItems = NAV[role] || []
  const current = navItems
    .filter((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]
  const atRoot = current?.to === navItems[0]?.to
  const settingsPath = role === 'student' ? '/student/profile' : role === 'company' ? '/company/settings' : null
  const showPost = role === 'company' && pathname !== '/company/post'

  const handleLogout = async () => {
    accountDD.setOpen(false)
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">

      <aside className={clsx(
        'relative hidden flex-shrink-0 flex-col gap-0.5 overflow-y-auto overflow-x-hidden border-r border-line bg-white px-3.5 pb-3.5 pt-[18px] transition-[width] duration-200 md:flex',
        rail ? 'w-[72px] !px-2.5' : 'w-[248px]'
      )}>
        <button
          type="button"
          onClick={toggleRail}
          aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          title={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          className={clsx(
            'z-10 grid h-6 w-6 place-items-center rounded-lg border border-line-2 bg-canvas text-ink-3 transition-colors hover:border-brand hover:text-brand',
            rail ? 'mx-auto mb-2.5' : 'absolute right-2 top-5'
          )}
        >
          <Icon name={rail ? 'chevron-right' : 'chevron-left'} size={13} />
        </button>

        <Link to="/" className={clsx('flex items-center gap-[11px] px-2 pb-4 pt-1', rail && 'justify-center px-0')}>
          <NexlynkLogo variant="icon" className="!h-9 !w-9 flex-shrink-0 !rounded-[11px] shadow-brand" />
          {!rail && (
            <div className="min-w-0">
              <div className="text-[17px] font-extrabold leading-tight tracking-tight text-ink">Nexlynk</div>
              <div className="mt-px text-[9.5px] font-bold uppercase tracking-[.16em] text-ink-4">{ROLE_LABEL[role]}</div>
            </div>
          )}
        </Link>

        {navItems.map((item) => (
          <SidebarItem key={item.to} item={item} badge={badges[item.to]} rail={rail} />
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        <header className="z-20 flex min-h-[58px] flex-shrink-0 items-center gap-2 border-b border-line bg-white px-3.5 py-2.5 md:h-[66px] md:gap-4 md:px-[26px] md:py-0">

          <div className="min-w-0 flex-1 md:hidden">
            {atRoot
              ? <NexlynkLogo variant="full" className="!h-[26px]" />
              : <div className="truncate text-[17px] font-extrabold tracking-tight text-ink">{current?.label}</div>}
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-[7px] text-[13px] font-semibold text-ink-4 md:flex">
            <span>{ROLE_LABEL[role]}</span>
            <Icon name="chevron-right" size={13} />
            <span className="truncate text-ink">{current?.label}</span>
          </div>

          {showPost && (
            <Link
              to="/company/post"
              aria-label="Post opportunity"
              title="Post opportunity"
              className="btn-primary hidden !h-[38px] !w-[38px] !px-0 md:inline-flex"
            >
              <Icon name="plus" size={18} color="#fff" />
            </Link>
          )}

          <div className="relative" ref={notifDD.ref}>
            <button
              type="button"
              onClick={() => { notifDD.setOpen((o) => !o); accountDD.setOpen(false) }}
              aria-label="Notifications"
              aria-expanded={notifDD.open}
              title="Notifications"
              className={clsx('btn-icon relative', notifDD.open && '!border-brand !text-brand')}
            >
              <Icon name="bell" size={19} />
              {notifItems.length > 0 && (
                <span className="absolute -right-1 -top-1 h-[18px] min-w-[18px] rounded-full bg-danger px-[5px] text-center text-[10px] font-bold leading-[18px] tabular-nums text-white">
                  {notifItems.length > 9 ? '9+' : notifItems.length}
                </span>
              )}
            </button>

            {notifDD.open && (
              <div className="animate-pop fixed inset-x-2.5 top-[62px] z-50 origin-top-right overflow-hidden rounded-2xl border border-line bg-white shadow-pop md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-[380px]">
                <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
                  <span className="text-sm font-extrabold tracking-tight">Notifications</span>
                  {notifItems.length > 0 && (
                    <span className="badge bg-brand-soft text-brand-ink">{notifItems.length} new</span>
                  )}
                </div>
                <div className="max-h-[420px] overflow-y-auto p-1.5">
                  {notifItems.length === 0 ? (
                    <div className="px-4 py-9 text-center">
                      <div className="mx-auto mb-2.5 grid h-11 w-11 place-items-center rounded-full bg-canvas text-ink-5">
                        <Icon name="bell" size={20} />
                      </div>
                      <p className="text-[13px] font-semibold text-ink-3">No notifications yet</p>
                    </div>
                  ) : notifItems.map((n) => {
                    const tone = TONE[n.tone] || TONE.pending
                    return (
                      <div key={n.id} className="flex items-start gap-[11px] rounded-[11px] px-[11px] py-2.5 hover:bg-canvas">
                        <span className={clsx('grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-full', tone.chip)}>
                          <Icon name={tone.icon} size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-semibold leading-snug text-ink-2">{n.title}</p>
                          {n.sub && <p className="mt-0.5 truncate text-[11.5px] font-semibold text-ink-3">{n.sub}</p>}
                        </div>
                        <span className="mt-0.5 whitespace-nowrap text-[11px] font-semibold text-ink-4">{timeAgo(n.time)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={accountDD.ref}>
            <button
              type="button"
              onClick={() => { accountDD.setOpen((o) => !o); notifDD.setOpen(false) }}
              aria-label="Account menu"
              aria-expanded={accountDD.open}
              title={displayName}
              className="flex items-center rounded-full border border-line-2 bg-white p-[3px] transition-colors hover:bg-canvas"
            >
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-brand text-xs font-bold text-white">
                {initials}
              </span>
            </button>

            {accountDD.open && (
              <div className="animate-pop fixed right-2.5 top-[62px] z-50 w-[250px] origin-top-right rounded-[14px] border border-line bg-white p-1.5 shadow-pop md:absolute md:right-0 md:top-full md:mt-2">
                <div className="px-2.5 pb-2 pt-1.5">
                  <p className="truncate text-[13px] font-extrabold text-ink">{displayName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] font-semibold text-ink-3">
                    <Icon name="mail" size={13} className="flex-shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </p>
                </div>
                <hr className="mx-1 my-1 border-0 bg-line" style={{ height: 1 }} />
                {settingsPath && (
                  <MenuRow icon="settings" to={settingsPath} onClick={() => accountDD.setOpen(false)}>
                    {role === 'student' ? 'My profile' : 'Company settings'}
                  </MenuRow>
                )}
                <MenuRow icon="logout" danger onClick={handleLogout}>Sign out</MenuRow>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-[110px] md:pb-0">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex items-center gap-3 px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-2.5 md:hidden"
      >
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-0.5 rounded-full border border-line bg-white/[.97] p-[7px] shadow-[0_8px_30px_rgba(22,24,43,.13),0_2px_8px_rgba(22,24,43,.06)]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              aria-label={item.label}
              className={({ isActive }) => clsx(
                'inline-flex h-11 min-w-0 items-center justify-center gap-[7px] rounded-full transition-all duration-200',
                isActive ? 'flex-[1.9] bg-white shadow-[0_2px_8px_rgba(22,24,43,.1)]' : 'flex-1'
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="relative grid flex-shrink-0 place-items-center">
                    <Icon name={item.icon} size={19} sw={isActive ? 2 : 1.7} className={isActive ? 'text-ink' : 'text-ink-3'} />
                    {badges[item.to] > 0 && (
                      <span className="absolute -right-0.5 -top-px h-[7px] w-[7px] rounded-full bg-danger ring-2 ring-white" />
                    )}
                  </span>
                  {isActive && <span className="truncate text-[13px] font-extrabold tracking-tight text-ink">{item.short}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
        {showPost && (
          <Link
            to="/company/post"
            aria-label="Post opportunity"
            title="Post opportunity"
            className="pointer-events-auto grid h-14 w-14 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#8273FF] via-brand to-brand-strong shadow-[0_8px_20px_rgba(109,93,246,.34),0_2px_8px_rgba(22,24,43,.12)] active:scale-[.94]"
          >
            <Icon name="plus" size={24} sw={2.2} color="#fff" />
          </Link>
        )}
      </nav>
    </div>
  )
}
