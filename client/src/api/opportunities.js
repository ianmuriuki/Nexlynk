import { supabase } from '@/lib/supabase'

const flat = (o) => {
  const { company_profiles: c, ...rest } = o
  return { ...rest, company_name: c?.name ?? '', company_logo: c?.logo_path ?? null, company_industry: c?.industry ?? null }
}

const fail = (error) => {
  if (error.code === '23505') throw { status: 409, message: 'You have already applied to this opportunity.' }
  if (error.code === '42501') throw { status: 403, message: 'You are not allowed to do that.' }
  throw { status: 400, message: error.message }
}

export const opportunityAPI = {
  async list({ page = 1, limit = 12, type, keyword, location } = {}) {
    let q = supabase
      .from('opportunities')
      .select('*, company_profiles(name, logo_path, industry)', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (type) q = q.eq('type', type)
    if (location) q = q.ilike('location', `%${location}%`)
    if (keyword) {
      const k = keyword.replace(/[%,()]/g, ' ')
      q = q.or(`title.ilike.%${k}%,description.ilike.%${k}%`)
    }
    const { data, count, error } = await q
    if (error) fail(error)
    return { data: { data: data.map(flat), pagination: { total: count, page, limit, total_pages: Math.ceil(count / limit) } } }
  },

  async getOne(id) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*, company_profiles(name, logo_path, industry)')
      .eq('id', id).eq('status', 'published').single()
    if (error) fail(error)
    return { data: { data: flat(data) } }
  },

  async trackView(id) {
    await supabase.rpc('track_view', { p_id: id })
  },

  async apply(id, body = {}) {
    const { data: s } = await supabase.auth.getSession()
    const uid = s.session?.user?.id
    const { error } = await supabase.from('applications')
      .insert({ opportunity_id: id, student_id: uid, cover_letter: body.cover_letter || null })
    if (error) fail(error)
    return { data: { ok: true } }
  },
}

export const studentAPI = {
  async getProfile(id) {
    const { data, error } = await supabase.from('student_profiles').select('*').eq('id', id).single()
    if (error) fail(error)
    return { data: { data } }
  },

  async getApplications(id) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, opportunity:opportunities(id, title, type, location, stipend, application_deadline, company_profiles(name))')
      .eq('student_id', id)
      .order('applied_at', { ascending: false })
    if (error) fail(error)
    const rows = data.map((a) => {
      const { company_profiles: c, ...o } = a.opportunity || {}
      return { ...a, opportunity: { ...o, company_name: c?.name ?? '' } }
    })
    return { data: { data: rows } }
  },

  async uploadCV(id, file) {
    const path = `${id}/cv.pdf`
    const up = await supabase.storage.from('cvs').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (up.error) fail(up.error)
    const { error } = await supabase.from('student_profiles').update({ cv_path: path }).eq('id', id)
    if (error) fail(error)
    return { data: { cv_path: path } }
  },
}

export async function getCvUrl(path) {
  const { data, error } = await supabase.storage.from('cvs').createSignedUrl(path, 300)
  if (error) fail(error)
  return data.signedUrl
}
