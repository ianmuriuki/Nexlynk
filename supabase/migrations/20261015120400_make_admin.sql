create or replace function public.make_admin(p_email text)
returns void language plpgsql security definer set search_path = ''
as $$
declare uid uuid;
begin
  select id into uid from auth.users where email = p_email;
  if uid is null then raise exception 'no such user'; end if;
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where id = uid;
  update public.users set role = 'admin' where id = uid;
  delete from public.student_profiles where id = uid;
  delete from public.company_profiles where id = uid;
end $$;
revoke all on function public.make_admin(text) from public, anon, authenticated;
