insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cvs', 'cvs', false, 5242880, array['application/pdf']),
  ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy cv_insert on storage.objects for insert to authenticated
with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy cv_update on storage.objects for update to authenticated
using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy cv_delete on storage.objects for delete to authenticated
using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy cv_select on storage.objects for select to authenticated
using (bucket_id = 'cvs' and (
  (storage.foldername(name))[1] = (select auth.uid())::text
  or (select public.is_admin())
  or exists (
    select 1 from public.applications a
    join public.opportunities o on o.id = a.opportunity_id
    where a.student_id::text = (storage.foldername(name))[1]
      and o.company_id = (select auth.uid())
  )
));

create policy logo_insert on storage.objects for insert to authenticated
with check (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy logo_update on storage.objects for update to authenticated
using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy logo_delete on storage.objects for delete to authenticated
using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
