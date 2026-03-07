import { create } from 'zustand'
import { tokenStorage } from '@/utils/security'
import { authAPI } from '@/api/client'

// Read token once at module load — synchronous, no effect needed
function getInitialUser() {
  const token = tokenStorage.get()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 > Date.now()) {
      return { id: payload.sub, role: payload.role, email: payload.email, name: payload.name }
    }
  } catch { /* ignore */ }
  tokenStorage.remove()
  return null
}

const useAuthStore = create((set) => ({
  user:        getInitialUser(),
  accessToken: tokenStorage.get(),

  login: async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    tokenStorage.set(data.accessToken)
    set({ user: data.user, accessToken: data.accessToken })
    return { user: data.user }
  },

  logout: async () => {
    try { await authAPI.logout() } catch { /* swallow */ }
    tokenStorage.remove()
    set({ user: null, accessToken: null })
  },

  setUserFromSignup: (user, accessToken) => {
    tokenStorage.set(accessToken)
    set({ user, accessToken })
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('nx:logout', () => {
    tokenStorage.remove()
    useAuthStore.setState({ user: null, accessToken: null })
  })
}

export default useAuthStore
