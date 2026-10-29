import { supabase } from '@/lib/supabase'

const FIELDS = 'id, kind, title, summary, body, event_date, location, link_url, link_label, status, published_at, created_at, updated_at'

const fail = (error) => {
  if (error.code === '42501') throw { status: 403, message: 'Admin access required.' }
  throw { status: 400, message: error.message }
}

export async function getPublishedAnnouncements({ limit = 6 } = {}) {
  const { data, error } = await supabase.from('announcements')
    .select(FIELDS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) fail(error)
  return { data: { data: data ?? [] } }
}

export const announcementsAPI = {
  async list() {
    const { data, error } = await supabase.from('announcements')
      .select(FIELDS)
      .order('created_at', { ascending: false })
    if (error) fail(error)
    return { data: { data: data ?? [] } }
  },

  async create(body) {
    const { data, error } = await supabase.from('announcements').insert(body).select(FIELDS).single()
    if (error) fail(error)
    return { data: { data } }
  },

  async update(id, body) {
    const { data, error } = await supabase.from('announcements')
      .update(body).eq('id', id).select(FIELDS).maybeSingle()
    if (error) fail(error)
    if (!data) throw { status: 403, message: 'You cannot change this post.' }
    return { data: { data } }
  },

  async remove(id) {
    const { data, error } = await supabase.from('announcements')
      .delete().eq('id', id).select('id')
    if (error) fail(error)
    if (!data?.length) throw { status: 403, message: 'You cannot delete this post.' }
    return { data: { data: true } }
  },
}
