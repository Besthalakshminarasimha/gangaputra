CREATE TABLE public.ponds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pond_name text NOT NULL,
  area_acres numeric,
  depth_meters numeric,
  species text,
  stocking_date date,
  stocking_quantity numeric,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ponds TO authenticated;
GRANT ALL ON public.ponds TO service_role;
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own ponds" ON public.ponds FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ponds_user_id_idx ON public.ponds(user_id);
CREATE INDEX ponds_farm_id_idx ON public.ponds(farm_id);
CREATE TRIGGER update_ponds_updated_at BEFORE UPDATE ON public.ponds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.water_quality_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid NOT NULL REFERENCES public.ponds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  ph numeric,
  dissolved_oxygen numeric,
  temperature numeric,
  salinity numeric,
  ammonia numeric,
  nitrite numeric,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_quality_logs TO authenticated;
GRANT ALL ON public.water_quality_logs TO service_role;
ALTER TABLE public.water_quality_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own water quality logs" ON public.water_quality_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX water_quality_logs_user_id_idx ON public.water_quality_logs(user_id);
CREATE INDEX water_quality_logs_pond_recorded_idx ON public.water_quality_logs(pond_id, recorded_at DESC);
CREATE TRIGGER update_water_quality_logs_updated_at BEFORE UPDATE ON public.water_quality_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.daily_farm_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid REFERENCES public.ponds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  feed_quantity numeric,
  feed_type text,
  feeding_time text,
  mortality_count integer,
  symptoms text,
  weather_observation text,
  pond_observation text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_farm_logs TO authenticated;
GRANT ALL ON public.daily_farm_logs TO service_role;
ALTER TABLE public.daily_farm_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily farm logs" ON public.daily_farm_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX daily_farm_logs_user_id_idx ON public.daily_farm_logs(user_id);
CREATE INDEX daily_farm_logs_pond_date_idx ON public.daily_farm_logs(pond_id, log_date DESC);
CREATE TRIGGER update_daily_farm_logs_updated_at BEFORE UPDATE ON public.daily_farm_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();