create policy app_select on public.applications for select to authenticated
using (student_id = (select auth.uid()) or (select public.is_admin())
  or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.company_id = (select auth.uid())));

create policy app_insert on public.applications for insert to authenticated
with check (student_id = (select auth.uid()) and (select public.app_role()) = 'student'
  and exists (select 1 from public.opportunities o where o.id = opportunity_id and o.status = 'published'));

create policy placements_select on public.placements for select to authenticated
using (student_id = (select auth.uid()) or company_id = (select auth.uid()) or (select public.is_admin()));

create policy invoices_select on public.invoices for select to authenticated
using ((select public.is_admin()));

create policy events_select on public.events for select to authenticated
using ((select public.is_admin()));
