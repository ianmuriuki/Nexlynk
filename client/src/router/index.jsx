import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import useAuthStore from '@/store/authStore'

const LandingPage         = lazy(() => import('@/pages/landing/LandingPage'))
const LoginPage           = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage        = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage  = lazy(() => import('@/pages/auth/ForgotPasswordPage'))

const StudentDashboard    = lazy(() => import('@/pages/student/StudentDashboard'))
const StudentProfile      = lazy(() => import('@/pages/student/StudentProfile'))
const BrowseOpportunities = lazy(() => import('@/pages/student/BrowseOpportunities'))
const MyApplications      = lazy(() => import('@/pages/student/MyApplications'))

const CompanyDashboard    = lazy(() => import('@/pages/company/CompanyDashboard'))
const PostOpportunity     = lazy(() => import('@/pages/company/PostOpportunity'))
const CompanyApplicants   = lazy(() => import('@/pages/company/CompanyApplicants'))
const CompanySettings     = lazy(() => import('@/pages/company/CompanySettings'))

const AdminDashboard      = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminCompanies      = lazy(() => import('@/pages/admin/AdminCompanies'))
const AdminApplications   = lazy(() => import('@/pages/admin/AdminApplications'))

const DashboardLayout     = lazy(() => import('@/components/layout/DashboardLayout'))

import PageLoader from '@/components/shared/PageLoader'
import NotFound   from '@/pages/NotFound'

function RequireAuth({ roles }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) {
    const dest = user.role === 'admin' ? '/admin' : user.role === 'company' ? '/company' : '/student'
    return <Navigate to={dest} replace />
  }
  return <Outlet />
}

function SW({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const router = createBrowserRouter([
  { path: '/', element: <SW><LandingPage /></SW> },

  // Auth pages — open to everyone
  { path: '/login',           element: <SW><LoginPage /></SW>          },
  { path: '/register',        element: <SW><RegisterPage /></SW>       },
  { path: '/forgot-password', element: <SW><ForgotPasswordPage /></SW> },

  {
    element: <RequireAuth roles={['student']} />,
    children: [{
      element: <SW><DashboardLayout role="student" /></SW>,
      children: [
        { path: '/student',               element: <SW><StudentDashboard /></SW>    },
        { path: '/student/profile',       element: <SW><StudentProfile /></SW>      },
        { path: '/student/opportunities', element: <SW><BrowseOpportunities /></SW> },
        { path: '/student/applications',  element: <SW><MyApplications /></SW>      },
      ],
    }],
  },

  {
    element: <RequireAuth roles={['company']} />,
    children: [{
      element: <SW><DashboardLayout role="company" /></SW>,
      children: [
        { path: '/company',            element: <SW><CompanyDashboard /></SW>  },
        { path: '/company/post',       element: <SW><PostOpportunity /></SW>   },
        { path: '/company/applicants', element: <SW><CompanyApplicants /></SW> },
        { path: '/company/settings',   element: <SW><CompanySettings /></SW>   },
      ],
    }],
  },

  {
    element: <RequireAuth roles={['admin']} />,
    children: [{
      element: <SW><DashboardLayout role="admin" /></SW>,
      children: [
        { path: '/admin',              element: <SW><AdminDashboard /></SW>    },
        { path: '/admin/companies',    element: <SW><AdminCompanies /></SW>    },
        { path: '/admin/applications', element: <SW><AdminApplications /></SW> },
      ],
    }],
  },

  { path: '*', element: <NotFound /> },
])

export default router