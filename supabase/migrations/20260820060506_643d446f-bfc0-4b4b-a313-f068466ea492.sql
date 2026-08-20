DROP POLICY IF EXISTS "Anyone can view active job profiles" ON public.job_profiles;
CREATE POLICY "Signed-in users can view active job profiles"
ON public.job_profiles FOR SELECT TO authenticated
USING (is_active = true);
REVOKE SELECT ON public.job_profiles FROM anon;