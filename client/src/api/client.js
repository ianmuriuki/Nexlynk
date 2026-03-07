/**
 * Nexlynk API client
 * - Attaches Bearer token to every request
 * - Handles 401 → silent token refresh → retry once
 * - Handles 429 → surfaces rate-limit message
 * - All error shapes normalised to { message, details }
 */
import axios from 'axios'
import { tokenStorage } from '@/utils/security'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,          // send httpOnly refresh-token cookie
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

//  Request interceptor — attach access token 
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Flag to prevent multiple refresh attempts at once 
let isRefreshing = false
let failedQueue  = []

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

//  Response interceptor — refresh & retry 
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // 401 → attempt silent refresh once
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch(Promise.reject)
      }

      original._retry  = true
      isRefreshing     = true

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = data.accessToken
        tokenStorage.set(newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Refresh failed — log out
        tokenStorage.remove()
        window.dispatchEvent(new CustomEvent('nx:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Normalise error shape
    const message =
      error.response?.data?.message ||
      error.response?.data?.error   ||
      error.message                  ||
      'An unexpected error occurred'

    const details  = error.response?.data?.details || []
    const status   = error.response?.status

    return Promise.reject({ message, details, status })
  }
)

export default api

// this are the API endpoint wrappers.
//  Each function corresponds to an API endpoint and abstracts away the details of making the HTTP request.
//  This way, the rest of the frontend code can simply call these functions without worrying about the underlying API structure or error handling, which is all managed in one place.
export const authAPI = {
  login:          (body) => api.post('/auth/login', body),
  signup:         (body) => api.post('/auth/signup', body),
  refresh:        ()     => api.post('/auth/refresh'),
  logout:         ()     => api.post('/auth/logout'),
  forgotPassword: (body) => api.post('/auth/forgot-password', body),
}

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

export const opportunityAPI = {
  list:    (params) => api.get('/opportunities', { params }),
  getOne:  (id)     => api.get(`/opportunities/${id}`),
  apply:   (id)     => api.post(`/opportunities/${id}/apply`),
}

export const companyAPI = {
  register:         (body)           => api.post('/companies', body),
  getProfile:       (id)             => api.get(`/companies/${id}`),
  update:           (id, body)       => api.patch(`/companies/${id}`, body),
  getOpportunities: (id, params)     => api.get(`/companies/${id}/opportunities`, { params }),
  postOpportunity:  (id, body)       => api.post(`/companies/${id}/opportunities`, body),
  updateOpportunity:(cId, oId, body) => api.patch(`/companies/${cId}/opportunities/${oId}`, body),
  getApplicants:    (id, params)     => api.get(`/companies/${id}/applicants`, { params }),
  uploadLogo:       (id, file)       => {
    const fd = new FormData()
    fd.append('logo', file)
    return api.post(`/companies/${id}/logo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const filesAPI = {
  cvSignedUrl:   (encodedKey) => api.get(`/files/cv/${encodedKey}`),
  logoSignedUrl: (encodedKey) => api.get(`/files/logo/${encodedKey}`),
}

export const adminAPI = {
  dashboard:       ()         => api.get('/admin/dashboard'),
  companies:       (params)   => api.get('/admin/companies', { params }),
  approveCompany:  (id)       => api.post(`/admin/companies/${id}/approve`),
  rejectCompany:   (id)       => api.post(`/admin/companies/${id}/reject`),
  applications:    (params)   => api.get('/admin/applications', { params }),
  updateAppStatus: (id, body) => api.put(`/admin/applications/${id}/status`, body),
}