create or replace function public.track_view(p_id uuid)
returns void language sql security definer set search_path = ''
as $$
  update public.opportunities set view_count = view_count + 1
  where id = p_id and status = 'published';
$$;
revoke all on function public.track_view(uuid) from public;
grant execute on function public.track_view(uuid) to anon, authenticated;
