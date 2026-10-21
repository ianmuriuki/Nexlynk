import { supabase } from '@/lib/supabase'

export function homepageLogoUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data?.publicUrl ?? null
}

const fail = (error) => {
  if (error.code === '42501') throw { status: 403, message: 'Admin access required.' }
  throw { status: 400, message: error.message }
}

export async function getHomepageJobs() {
  const { data, error } = await supabase.rpc('get_homepage_jobs')
  if (error) fail(error)
  return { data: { data: data ?? [] } }
}

export async function adminGetHomepage() {
  const { data, error } = await supabase.rpc('admin_get_homepage_jobs')
  if (error) fail(error)
  return { data: { data: data ?? [] } }
}

export async function adminSetHomepage(ids) {
  const { data, error } = await supabase.rpc('admin_set_homepage_jobs', { ids })
  if (error) fail(error)
  return { data: { data } }
}

export async function adminHomepageCandidates() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, description, skills_required, location, type, duration, stipend, created_at, application_deadline, status, company_profiles!inner(name, logo_path, industry, status)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) fail(error)
  const rows = (data ?? []).map(({ company_profiles: company, ...opportunity }) => ({
    ...opportunity,
    company_name: company?.name ?? '',
    company_logo: company?.logo_path ?? null,
    company_industry: company?.industry ?? null,
    company_status: company?.status ?? null,
  }))
  return { data: { data: rows } }
}
