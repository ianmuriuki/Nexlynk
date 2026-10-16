import { supabase } from '@/lib/supabase'

const fail = (error) => {
  if (error.code === '42501') throw { status: 403, message: 'Your company must be approved by an admin before posting opportunities.' }
  throw { status: 400, message: error.message }
}

export const companyAPI = {
  async getProfile(id) {
    const { data, error } = await supabase.from('company_profiles').select('*').eq('id', id).single()
    if (error) fail(error)
    return { data: { data } }
  },

  async update(id, body) {
    const { data, error } = await supabase.from('company_profiles').update(body).eq('id', id).select().single()
    if (error) fail(error)
    return { data: { data } }
  },

  async uploadLogo(id, file) {
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${id}/logo-${Date.now()}.${ext}`
    const up = await supabase.storage.from('logos').upload(path, file, { contentType: file.type })
    if (up.error) fail(up.error)
    const { error } = await supabase.from('company_profiles').update({ logo_path: path }).eq('id', id)
    if (error) fail(error)
    return { data: { logo_path: path } }
  },

  async postOpportunity(id, body) {
    const { data, error } = await supabase.from('opportunities')
      .insert({ ...body, company_id: id }).select().single()
    if (error) fail(error)
    return { data: { data } }
  },

  async getApplicants(id, { page = 1, limit = 20, status, opportunity_id } = {}) {
    let q = supabase.from('applications')
      .select('*, student:student_profiles(name, phone, university, course, year_of_study, discipline, skills, about, cv_path, profile_completion, users(email)), opportunity:opportunities!inner(id, title, type, company_id)', { count: 'exact' })
      .eq('opportunity.company_id', id)
      .order('applied_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (status) q = q.eq('status', status)
    if (opportunity_id) q = q.eq('opportunity_id', opportunity_id)
    const { data, count, error } = await q
    if (error) fail(error)
    const rows = data.map((a) => {
      const { users, ...sp } = a.student || {}
      return { ...a, created_at: a.applied_at, student: { ...sp, email: users?.email ?? '', year: sp.year_of_study } }
    })
    return { data: { data: rows, pagination: { total: count, page, limit, total_pages: Math.ceil(count / limit) } } }
  },

  async updateAppStatus(companyId, appId, { status }) {
    const { data, error } = await supabase.rpc('update_application_status', { p_id: appId, p_status: status })
    if (error) fail(error)
    return { data: { data } }
  },

  async getOpportunities(id) {
    const { data, error } = await supabase.from('opportunities')
      .select('*, applications(count)')
      .eq('company_id', id)
      .order('created_at', { ascending: false })
    if (error) fail(error)
    const rows = data.map(({ applications, ...o }) => ({ ...o, application_count: applications?.[0]?.count ?? 0 }))
    return { data: { data: rows } }
  },
}

export const filesAPI = {
  async cvSignedUrl(encodedPath) {
    let objectPath = decodeURIComponent(encodedPath)
    while (objectPath.startsWith('/')) objectPath = objectPath.slice(1)
    if (objectPath.startsWith('cvs/')) objectPath = objectPath.slice(4)

    const { data, error } = await supabase.storage.from('cvs').createSignedUrl(objectPath, 300)
    if (error) fail(error)
    return { data: { url: data.signedUrl } }
  },

  async logoSignedUrl(encodedPath) {
    const { data } = supabase.storage.from('logos').getPublicUrl(decodeURIComponent(encodedPath))
    return { data: { url: data.publicUrl } }
  },
}
