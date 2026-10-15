revoke all on all tables in schema public from anon, authenticated;
grant execute on function public.app_role(), public.is_admin() to anon, authenticated;

grant select on public.opportunities to anon, authenticated;
grant insert (company_id, title, description, disciplines, skills_required, location, type, positions, duration, stipend, application_deadline, status) on public.opportunities to authenticated;
grant update (title, description, disciplines, skills_required, location, type, positions, duration, stipend, application_deadline, status) on public.opportunities to authenticated;

grant select (id, name, industry, company_size, website, description, logo_path, status) on public.company_profiles to anon;
grant select on public.company_profiles to authenticated;
grant update (name, industry, company_size, website, description, contact_name, contact_email, contact_phone, logo_path) on public.company_profiles to authenticated;

grant select on public.student_profiles to authenticated;
grant update (name, phone, city, university, course, year_of_study, expected_graduation, skills, discipline, portfolio_links, availability, about, cv_path) on public.student_profiles to authenticated;

grant select (id, role, email, is_email_verified, created_at) on public.users to authenticated;

grant select on public.applications to authenticated;
grant insert (opportunity_id, student_id, cover_letter) on public.applications to authenticated;

grant select on public.placements, public.invoices, public.events to authenticated;
