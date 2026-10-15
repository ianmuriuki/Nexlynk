create or replace function public.set_company_status(p_id uuid, p_status text)
returns public.company_profiles language plpgsql security definer set search_path = ''
as $$
declare c public.company_profiles; old_status public.company_status;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  select status into old_status from public.company_profiles where id = p_id;
  if not found then raise exception 'company not found'; end if;
  update public.company_profiles set status = p_status::public.company_status where id = p_id returning * into c;
  insert into public.events (actor_id, entity_type, entity_id, action, old_value, new_value)
    values (auth.uid(), 'company', p_id, p_status, jsonb_build_object('status', old_status), jsonb_build_object('status', p_status));
  return c;
end $$;

create or replace function public.approve_company(p_id uuid)
returns public.company_profiles language sql security definer set search_path = ''
as $$ select public.set_company_status(p_id, 'approved') $$;

create or replace function public.reject_company(p_id uuid)
returns public.company_profiles language sql security definer set search_path = ''
as $$ select public.set_company_status(p_id, 'rejected') $$;

create or replace function public.admin_dashboard()
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'students', (select count(*) from public.users where role = 'student'),
    'companies', (select count(*) from public.company_profiles),
    'pending_companies', (select count(*) from public.company_profiles where status = 'pending'),
    'opportunities', (select count(*) from public.opportunities where status = 'published'),
    'applications', (select count(*) from public.applications),
    'placements', (select count(*) from public.placements),
    'pending_applications', (select count(*) from public.applications where status = 'pending'),
    'shortlisted_applications', (select count(*) from public.applications where status = 'shortlisted'),
    'placed_applications', (select count(*) from public.applications where status = 'placed'),
    'rejected_applications', (select count(*) from public.applications where status = 'rejected'),
    'recent_applications', (select coalesce(jsonb_agg(r), '[]'::jsonb) from (
      select a.id, a.status, a.applied_at, sp.name as student_name, o.title as opportunity_title, cp.name as company_name
      from public.applications a
      join public.student_profiles sp on sp.id = a.student_id
      join public.opportunities o on o.id = a.opportunity_id
      join public.company_profiles cp on cp.id = o.company_id
      order by a.applied_at desc limit 10) r)
  );
end $$;

create or replace function public.admin_stats(p_period text default '6months')
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare trunc_unit text; span interval;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  select t, i into trunc_unit, span from (values
    ('day','hour','1 day'::interval), ('week','day','7 days'::interval), ('month','day','30 days'::interval),
    ('3months','week','90 days'::interval), ('6months','month','180 days'::interval), ('year','month','365 days'::interval)
  ) v(p, t, i) where p = p_period;
  if trunc_unit is null then trunc_unit := 'month'; span := interval '180 days'; end if;
  return (select coalesce(jsonb_agg(r order by r.period), '[]'::jsonb) from (
    select date_trunc(trunc_unit, applied_at) as period,
      count(*)::int as applications,
      (count(*) filter (where status = 'placed'))::int as placements,
      (count(*) filter (where status = 'shortlisted'))::int as shortlisted,
      (count(*) filter (where status = 'rejected'))::int as rejected
    from public.applications where applied_at >= now() - span
    group by 1) r);
end $$;

revoke all on function public.set_company_status(uuid, text), public.approve_company(uuid), public.reject_company(uuid),
  public.admin_dashboard(), public.admin_stats(text) from public, anon;
grant execute on function public.approve_company(uuid), public.reject_company(uuid),
  public.admin_dashboard(), public.admin_stats(text) to authenticated;
