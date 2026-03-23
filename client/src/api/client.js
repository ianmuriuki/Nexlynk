import axios from 'axios'
import { tokenStorage } from '@/utils/security'
import { refreshStorage } from '@/store/authStore'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api'

const api = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  timeout:         15_000,
  headers:         { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue  = []

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch(Promise.reject)
      }

      original._retry = true
      isRefreshing    = true

      try {
        const refreshToken = refreshStorage.get()
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        )
        const newAccess  = data.accessToken
        const newRefresh = data.refreshToken

        tokenStorage.set(newAccess)
        if (newRefresh) refreshStorage.set(newRefresh)

        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.remove()
        refreshStorage.remove()
        window.dispatchEvent(new CustomEvent('nx:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error   ||
      error.message                  ||
      'An unexpected error occurred'
    const details = error.response?.data?.details || []
    const status  = error.response?.status

    return Promise.reject({ message, details, status })
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login:          (body) => api.post('/auth/login', body),
  signup:         (body) => api.post('/auth/signup', body),
  refresh:        (body) => api.post('/auth/refresh', body),
  logout:         (body) => api.post('/auth/logout', body),
  forgotPassword:       (body)          => api.post('/auth/forgot-password', body),
  resetPassword:        (body)          => api.post('/auth/reset-password', body),
  verifyEmail:          (token)         => api.get(`/auth/verify?token=${token}`),
  resendVerification:   (body)          => api.post('/auth/resend-verification', body),
}

// ── Student ──────────────────────────────────────────────────
export const studentAPI = {
  getProfile:      (id)       => api.get(`/students/${id}/profile`),
  updateProfile:   (id, body) => api.patch(`/students/${id}/profile`, body),
  getApplications: (id)       => api.get(`/students/${id}/applications`),
  uploadCV:        (id, file) => {
    const fd = new FormData()
    fd.append('cv', file)
    return api.post(`/students/${id}/cv`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ── Opportunities ────────────────────────────────────────────
export const opportunityAPI = {
  list:   (params) => api.get('/opportunities', { params }),
  getOne: (id)     => api.get(`/opportunities/${id}`),
  trackView: (id) => api.post(`/opportunities/${id}/view`),
  apply:  (id, body) => api.post(`/opportunities/${id}/apply`, body || {}),
}

// ── Company ──────────────────────────────────────────────────
export const companyAPI = {
  register:          (body)                   => api.post('/companies', body),
  getProfile:        (id)                     => api.get(`/companies/${id}`),
  update:            (id, body)               => api.patch(`/companies/${id}`, body),
  getOpportunities:  (id, params)             => api.get(`/companies/${id}/opportunities`, { params }),
  postOpportunity:   (id, body)               => api.post(`/companies/${id}/opportunities`, body),
  updateOpportunity: (cId, oId, body)         => api.patch(`/companies/${cId}/opportunities/${oId}`, body),
  getApplicants:     (id, params)             => api.get(`/companies/${id}/applicants`, { params }),
  updateAppStatus:   (companyId, appId, body) => api.patch(`/companies/${companyId}/applications/${appId}/status`, body),
  uploadLogo:        (id, file)               => {
    const fd = new FormData()
    fd.append('logo', file)
    return api.post(`/companies/${id}/logo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ── Files ────────────────────────────────────────────────────
export const filesAPI = {
  cvSignedUrl:   (encodedKey) => api.get(`/files/cv/${encodedKey}`),
  logoSignedUrl: (encodedKey) => api.get(`/files/logo/${encodedKey}`),
}

// ── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:       ()         => api.get('/admin/dashboard'),
  stats:           (params)   => api.get('/admin/stats', { params }),
  companies:       (params)   => api.get('/admin/companies', { params }),
  approveCompany:  (id)       => api.post(`/admin/companies/${id}/approve`),
  rejectCompany:   (id)       => api.post(`/admin/companies/${id}/reject`),
  applications:    (params)   => api.get('/admin/applications', { params }),
  updateAppStatus: (id, body) => api.put(`/admin/applications/${id}/status`, body),
}