ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS passport_share_token text DEFAULT ('GF-AP-' || upper(replace(gen_random_uuid()::text, '-', '')));
UPDATE public.farms SET passport_share_token = 'GF-AP-' || upper(replace(gen_random_uuid()::text, '-', '')) WHERE passport_share_token IS NULL;
ALTER TABLE public.farms ALTER COLUMN passport_share_token SET DEFAULT ('GF-AP-' || upper(replace(gen_random_uuid()::text, '-', '')));
ALTER TABLE public.farms ALTER COLUMN passport_share_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS farms_passport_share_token_key ON public.farms(passport_share_token);
COMMENT ON COLUMN public.farms.passport_number IS 'DEPRECATED: predictable legacy number; public passport links use passport_share_token';
CREATE OR REPLACE FUNCTION public.get_farm_passport(_number text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'passport_number', f.passport_share_token,
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
        'water_logs', (SELECT count(*) FROM public.water_quality_logs w WHERE w.pond_id = p.id AND w.verification_status = 'verified'),
        'daily_logs', (SELECT count(*) FROM public.daily_farm_logs d WHERE d.pond_id = p.id AND d.verification_status = 'verified'),
        'last_water', (SELECT jsonb_build_object('recorded_at', w.recorded_at, 'ph', w.ph, 'dissolved_oxygen', w.dissolved_oxygen, 'temperature', w.temperature, 'salinity', w.salinity)
                       FROM public.water_quality_logs w WHERE w.pond_id = p.id AND w.verification_status = 'verified' ORDER BY w.recorded_at DESC LIMIT 1)
      ) ORDER BY p.created_at)
      FROM public.ponds p WHERE p.farm_id = f.id AND p.verification_status = 'verified'
    ), '[]'::jsonb)
  )
  FROM public.farms f
  WHERE f.passport_share_token = _number AND f.verification_status = 'verified'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_farm_passport(text) TO anon, authenticated;