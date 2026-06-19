DROP POLICY IF EXISTS "Anyone can view active hatcheries" ON public.hatcheries;
CREATE POLICY "Authenticated users can view active hatcheries"
  ON public.hatcheries FOR SELECT
  TO authenticated
  USING (is_active = true);
REVOKE SELECT ON public.hatcheries FROM anon;