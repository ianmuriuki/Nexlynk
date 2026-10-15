import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

function toUser(session) {
  const u = session?.user
  if (!u) return null
  return {
    id: u.id,
    email: u.email,
    role: u.app_metadata?.role ?? 'student',
    name: u.user_metadata?.name ?? '',
  }
}

const actions = {
  async sendCode(email, { create = false, data } = {}) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: create, data },
    })
    if (error) {
      if (/signups not allowed/i.test(error.message)) {
        throw new Error('No account found for this email. Please register first.')
      }
      throw new Error(error.message)
    }
  },
  async verifyCode(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) throw new Error('That code is wrong or has expired.')
    return toUser(data.session)
  },
  async logout() {
    await supabase.auth.signOut()
  },
}


const useAuthStore = create(() => ({ user: null, ready: false, ...actions }))

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ user: toUser(session), ready: true })
})


export default useAuthStore
