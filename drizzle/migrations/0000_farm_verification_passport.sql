CREATE SEQUENCE IF NOT EXISTS public.farm_passport_seq START 1;
GRANT USAGE ON SEQUENCE public.farm_passport_seq TO authenticated, service_role;

ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS passport_number text DEFAULT ('GF-AP-' || lpad(nextval('public.farm_passport_seq')::text, 6, '0'));
CREATE UNIQUE INDEX IF NOT EXISTS farms_passport_number_key ON public.farms(passport_number);

ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE public.ponds ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE public.water_quality_logs ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE public.daily_farm_logs ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';

CREATE POLICY "Admins can view all farms" ON public.farms FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all farms" ON public.farms FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all ponds" ON public.ponds FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all ponds" ON public.ponds FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all water logs" ON public.water_quality_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all water logs" ON public.water_quality_logs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all daily logs" ON public.daily_farm_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all daily logs" ON public.daily_farm_logs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_farm_passport(_number text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'passport_number', f.passport_number,
    'farm_name', f.farm_name,
    'location', f.location,
    'verification_status', f.verification_status,
    'created_at', f.created_at,
    'ponds', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'pond_name', p.pond_name,
        'species', p.species,
        'status', p.status,
        'stocking_date', p.stocking_date,
        'verification_status', p.verification_status,
        'water_logs', (SELECT count(*) FROM public.water_quality_logs w WHERE w.pond_id = p.id),
        'daily_logs', (SELECT count(*) FROM public.daily_farm_logs d WHERE d.pond_id = p.id),
        'last_water', (SELECT jsonb_build_object('recorded_at', w.recorded_at, 'ph', w.ph, 'dissolved_oxygen', w.dissolved_oxygen, 'temperature', w.temperature, 'salinity', w.salinity)
                       FROM public.water_quality_logs w WHERE w.pond_id = p.id ORDER BY w.recorded_at DESC LIMIT 1)
      ) ORDER BY p.created_at)
      FROM public.ponds p WHERE p.farm_id = f.id
    ), '[]'::jsonb)
  )
  FROM public.farms f
  WHERE f.passport_number = _number
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_farm_passport(text) TO anon, authenticated;