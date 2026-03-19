import { create } from 'zustand'
import { tokenStorage } from '@/utils/security'
import { authAPI } from '@/api/client'

const REFRESH_KEY = '__nx_rt'

const refreshStorage = {
  get:    () => sessionStorage.getItem(REFRESH_KEY),
  set:    (t) => sessionStorage.setItem(REFRESH_KEY, t),
  remove: () => sessionStorage.removeItem(REFRESH_KEY),
}

function getInitialState() {
  try {
    const token = tokenStorage.get()
    if (!token) return { user: null, accessToken: null }

    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) {
      tokenStorage.remove()
      refreshStorage.remove()
      return { user: null, accessToken: null }
    }

    return {
      accessToken: token,
      user: {
        id:    payload.sub,
        role:  payload.role,
        email: payload.email,
        name:  payload.name,
      },
    }
  } catch {
    tokenStorage.remove()
    refreshStorage.remove()
    return { user: null, accessToken: null }
  }
}

const initial = getInitialState()

const useAuthStore = create((set) => ({
  user:        initial.user,
  accessToken: initial.accessToken,
  isLoading:   false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await authAPI.login({ email, password })
      const { accessToken, refreshToken, user } = data
      tokenStorage.set(accessToken)
      if (refreshToken) refreshStorage.set(refreshToken)
      set({ user, accessToken, isLoading: false })
      return { user }
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    const refreshToken = refreshStorage.get()
    try { await authAPI.logout({ refreshToken }) } catch { /* swallow */ }
    tokenStorage.remove()
    refreshStorage.remove()
    set({ user: null, accessToken: null })
  },

  setUserFromSignup: (user, accessToken, refreshToken) => {
    tokenStorage.set(accessToken)
    if (refreshToken) refreshStorage.set(refreshToken)
    set({ user, accessToken })
  },

  getRefreshToken: () => refreshStorage.get(),
}))

if (typeof window !== 'undefined') {
  window.addEventListener('nx:logout', () => {
    tokenStorage.remove()
    refreshStorage.remove()
    useAuthStore.setState({ user: null, accessToken: null })
  })
}

export default useAuthStore
export { refreshStorage }