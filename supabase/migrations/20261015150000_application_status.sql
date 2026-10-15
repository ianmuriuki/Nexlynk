create or replace function public.update_application_status(p_id uuid, p_status text, p_note text default null)
returns public.applications language plpgsql security definer set search_path = ''
as $$
declare
  a public.applications;
  opp public.opportunities;
  old_status public.application_status;
  uid uuid := auth.uid();
begin
  if p_status not in ('pending','under_review','shortlisted','placed','rejected') then
    raise exception 'invalid status';
  end if;
  select * into a from public.applications where id = p_id;
  if not found then raise exception 'application not found'; end if;
  select * into opp from public.opportunities where id = a.opportunity_id;
  if not (public.is_admin() or opp.company_id = uid) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  old_status := a.status;
  update public.applications
    set status = p_status::public.application_status, note = coalesce(p_note, note)
    where id = p_id returning * into a;
  insert into public.events (actor_id, entity_type, entity_id, action, old_value, new_value)
    values (uid, 'application', p_id, 'status_changed',
            jsonb_build_object('status', old_status), jsonb_build_object('status', p_status));
  if p_status = 'placed' then
    insert into public.placements (student_id, company_id, opportunity_id)
      values (a.student_id, opp.company_id, a.opportunity_id) on conflict do nothing;
  end if;
  return a;
end $$;
revoke all on function public.update_application_status(uuid, text, text) from public, anon;
grant execute on function public.update_application_status(uuid, text, text) to authenticated;
