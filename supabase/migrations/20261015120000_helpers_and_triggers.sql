create or replace function public.app_role()
returns text language sql stable set search_path = ''
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') $$;

create or replace function public.is_admin()
returns boolean language sql stable set search_path = ''
as $$ select public.app_role() = 'admin' $$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nm text := coalesce(nullif(trim(m ->> 'name'), ''), split_part(new.email, '@', 1));
  r public.user_role;
begin
  r := (case when m ->> 'role' = 'company' then 'company' else 'student' end)::public.user_role;
  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', r::text);
  insert into public.users (id, role, email, is_email_verified)
    values (new.id, r, new.email, new.email_confirmed_at is not null)
    on conflict (id) do nothing;
  if r = 'student' then
    insert into public.student_profiles (id, name) values (new.id, nm) on conflict (id) do nothing;
  else
    insert into public.company_profiles (id, name, industry, company_size, contact_name, contact_email)
      values (new.id, nm, m ->> 'industry', m ->> 'company_size', m ->> 'contact_name', new.email)
      on conflict (id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created before insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.sync_email_verified()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin
  update public.users set is_email_verified = true where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.sync_email_verified();

create or replace function public.set_profile_completion()
returns trigger language plpgsql set search_path = ''
as $$
declare filled int;
begin
  filled :=
    (coalesce(trim(new.name), '') <> '')::int + (coalesce(trim(new.phone), '') <> '')::int +
    (coalesce(trim(new.city), '') <> '')::int + (coalesce(trim(new.university), '') <> '')::int +
    (coalesce(trim(new.course), '') <> '')::int + (coalesce(trim(new.discipline), '') <> '')::int +
    (coalesce(trim(new.about), '') <> '')::int + (new.year_of_study is not null)::int +
    (new.expected_graduation is not null)::int;
  new.profile_completion := round(filled * 100.0 / 9);
  return new;
end $$;

drop trigger if exists trg_student_profile_completion on public.student_profiles;
create trigger trg_student_profile_completion before insert or update on public.student_profiles
  for each row execute function public.set_profile_completion();
