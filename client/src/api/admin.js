import { supabase } from '@/lib/supabase'

const fail = (error) => {
  if (error.code === '42501') throw { status: 403, message: 'Admin access required.' }
  throw { status: 400, message: error.message }
}

const page = (data, count, p, limit) => ({ data: { data, pagination: { total: count, page: p, limit, total_pages: Math.ceil(count / limit) } } })

export const adminAPI = {
  async dashboard() {
    const { data, error } = await supabase.rpc('admin_dashboard')
    if (error) fail(error)
    return { data: { data } }
  },

  async stats({ period = '6months' } = {}) {
    const { data, error } = await supabase.rpc('admin_stats', { p_period: period })
    if (error) fail(error)
    return { data: { data } }
  },

  async companies({ page: p = 1, limit = 20, status } = {}) {
    let q = supabase.from('company_profiles')
      .select('*, users(email, created_at), opportunities(id, applications(count)), placements(count)', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range((p - 1) * limit, p * limit - 1)
    if (status) q = q.eq('status', status)
    const { data, count, error } = await q
    if (error) fail(error)
    const rows = data.map(({ users, opportunities, placements, ...c }) => ({
      ...c,
      email: users?.email ?? '',
      registered_at: users?.created_at,
      opportunity_count: opportunities.length,
      application_count: opportunities.reduce((n, o) => n + (o.applications?.[0]?.count ?? 0), 0),
      placement_count: placements?.[0]?.count ?? 0,
    }))
    return page(rows, count, p, limit)
  },

  async students({ page: p = 1, limit = 20, search, cv } = {}) {
    let q = supabase.from('student_profiles')
      .select('*, users(email, created_at), applications(count)', { count: 'exact' })
      .order('name', { ascending: true })
      .range((p - 1) * limit, p * limit - 1)
    const term = (search || '').replace(/[,()%*\\]/g, ' ').trim()
    if (term) {
      q = q.or(`name.ilike.%${term}%,university.ilike.%${term}%,course.ilike.%${term}%,discipline.ilike.%${term}%`)
    }
    if (cv === 'with_cv') q = q.not('cv_path', 'is', null)
    if (cv === 'no_cv') q = q.is('cv_path', null)
    const { data, count, error } = await q
    if (error) fail(error)
    const rows = data.map(({ users, applications, ...s }) => ({
      ...s,
      email: users?.email ?? '',
      joined_at: users?.created_at,
      application_count: applications?.[0]?.count ?? 0,
    }))
    return page(rows, count, p, limit)
  },

  async approveCompany(id) {
    const { data, error } = await supabase.rpc('approve_company', { p_id: id })
    if (error) fail(error)
    return { data: { data } }
  },

  async rejectCompany(id) {
    const { data, error } = await supabase.rpc('reject_company', { p_id: id })
    if (error) fail(error)
    return { data: { data } }
  },

  async applications({ page: p = 1, limit = 20, status, company_id } = {}) {
    let q = supabase.from('applications')
      .select('*, student:student_profiles(name, university, discipline), opportunity:opportunities!inner(title, company_id, company_profiles(name))', { count: 'exact' })
      .order('applied_at', { ascending: false })
      .range((p - 1) * limit, p * limit - 1)
    if (status) q = q.eq('status', status)
    if (company_id) q = q.eq('opportunity.company_id', company_id)
    const { data, count, error } = await q
    if (error) fail(error)
    const rows = data.map(({ student, opportunity, ...a }) => ({
      ...a,
      student_name: student?.name ?? '',
      student_university: student?.university ?? '',
      student_discipline: student?.discipline ?? '',
      opportunity_title: opportunity?.title ?? '',
      company_name: opportunity?.company_profiles?.name ?? '',
    }))
    return page(rows, count, p, limit)
  },

  async applicationsFull({ page: p = 1, limit = 25, status, opportunity_id } = {}) {
    let q = supabase.from('applications')
      .select('*, student:student_profiles(name, phone, city, university, course, year_of_study, discipline, education_level, attachment_window, skills, about, cv_path, availability, users(email)), opportunity:opportunities!inner(id, title, company_id, company_profiles(name))', { count: 'exact' })
      .order('applied_at', { ascending: false })
      .range((p - 1) * limit, p * limit - 1)
    if (status) q = q.eq('status', status)
    if (opportunity_id) q = q.eq('opportunity_id', opportunity_id)
    const { data, count, error } = await q
    if (error) fail(error)
    const rows = data.map(({ student, opportunity, ...a }) => {
      const { users, ...s } = student || {}
      return {
        ...a,
        student: { ...s, email: users?.email ?? '' },
        opportunity_title: opportunity?.title ?? '',
        company_name: opportunity?.company_profiles?.name ?? '',
      }
    })
    return page(rows, count, p, limit)
  },

  async statusCounts({ opportunity_id } = {}) {
    const keys = ['pending', 'shortlisted', 'placed', 'rejected']
    const results = await Promise.all(keys.map((s) => {
      let q = supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', s)
      if (opportunity_id) q = q.eq('opportunity_id', opportunity_id)
      return q
    }))
    const out = {}
    results.forEach((r, i) => { if (r.error) fail(r.error); out[keys[i]] = r.count ?? 0 })
    return { data: { data: out } }
  },

  async opportunityOptions() {
    const { data, error } = await supabase.from('opportunities')
      .select('id, title, company_profiles(name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) fail(error)
    return { data: { data: (data ?? []).map((o) => ({ id: o.id, title: o.title, company_name: o.company_profiles?.name ?? '' })) } }
  },

  async updateAppStatus(id, { status, note }) {
    const { data, error } = await supabase.rpc('update_application_status', { p_id: id, p_status: status, p_note: note ?? null })
    if (error) fail(error)
    return { data: { data } }
  },
}
