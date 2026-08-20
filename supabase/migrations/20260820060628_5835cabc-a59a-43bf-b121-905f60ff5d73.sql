DROP POLICY IF EXISTS "Anyone can view shared report by token" ON public.health_reports;
REVOKE SELECT ON public.health_reports FROM anon;

CREATE OR REPLACE FUNCTION public.get_shared_health_report(_token text)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  symptoms text,
  image_url text,
  diagnoses jsonb,
  medicines jsonb,
  doctors jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hr.id, hr.created_at, hr.symptoms, hr.image_url,
         to_jsonb(hr.diagnoses), to_jsonb(hr.medicines), to_jsonb(hr.doctors)
  FROM public.health_reports hr
  WHERE hr.share_token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_health_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_health_report(text) TO anon, authenticated, service_role;