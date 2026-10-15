create policy users_select on public.users for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

create policy users_select_applicants on public.users for select to authenticated
using (exists (select 1 from public.applications a join public.opportunities o on o.id = a.opportunity_id
  where a.student_id = users.id and o.company_id = (select auth.uid())));

create policy sp_select on public.student_profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin())
  or exists (select 1 from public.applications a join public.opportunities o on o.id = a.opportunity_id
    where a.student_id = student_profiles.id and o.company_id = (select auth.uid())));

create policy sp_update on public.student_profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy cp_public on public.company_profiles for select to anon
using (status = 'approved');

create policy cp_select on public.company_profiles for select to authenticated
using (id = (select auth.uid()) or status = 'approved' or (select public.is_admin()));

create policy cp_update on public.company_profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy opp_public on public.opportunities for select to anon, authenticated
using (status = 'published' and exists (select 1 from public.company_profiles c where c.id = company_id and c.status = 'approved'));

create policy opp_owner on public.opportunities for select to authenticated
using (company_id = (select auth.uid()) or (select public.is_admin()));

create policy opp_insert on public.opportunities for insert to authenticated
with check (company_id = (select auth.uid()) and (select public.app_role()) = 'company'
  and exists (select 1 from public.company_profiles c where c.id = company_id and c.status = 'approved'));

create policy opp_update on public.opportunities for update to authenticated
using (company_id = (select auth.uid())) with check (company_id = (select auth.uid()));
