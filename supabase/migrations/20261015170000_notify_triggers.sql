create or replace function public.notify(p_type text, p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare u text; s text;
begin
  select decrypted_secret into u from vault.decrypted_secrets where name = 'notify_url';
  select decrypted_secret into s from vault.decrypted_secrets where name = 'notify_secret';
  if u is null or s is null then return; end if;
  perform net.http_post(
    url := u,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', s),
    body := jsonb_build_object('type', p_type, 'id', p_id)
  );
exception when others then
  raise warning 'notify failed: %', sqlerrm;
end $$;
revoke all on function public.notify(text, uuid) from public, anon, authenticated;

create or replace function public.trg_application_notify()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then perform public.notify('application_created', new.id);
  elsif new.status is distinct from old.status then perform public.notify('application_status', new.id);
  end if;
  return new;
end $$;

drop trigger if exists trg_applications_notify on public.applications;
create trigger trg_applications_notify after insert or update of status on public.applications
  for each row execute function public.trg_application_notify();

create or replace function public.trg_company_notify()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then perform public.notify('company_registered', new.id);
  elsif new.status is distinct from old.status and new.status in ('approved','rejected') then
    perform public.notify('company_status', new.id);
  end if;
  return new;
end $$;

drop trigger if exists trg_company_profiles_notify on public.company_profiles;
create trigger trg_company_profiles_notify after insert or update of status on public.company_profiles
  for each row execute function public.trg_company_notify();
