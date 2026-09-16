GRANT SELECT ON public.shrimp_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shrimp_rates TO authenticated;
GRANT ALL ON public.shrimp_rates TO service_role;
ALTER TABLE public.shrimp_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage shrimp rates" ON public.shrimp_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.fish_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species text NOT NULL,
  location text NOT NULL,
  state text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  rate_per_kg numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fish_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fish_rates TO authenticated;
GRANT ALL ON public.fish_rates TO service_role;
ALTER TABLE public.fish_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view fish rates" ON public.fish_rates FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage fish rates" ON public.fish_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX fish_rates_date_location_idx ON public.fish_rates (date DESC, location);
CREATE INDEX shrimp_rates_date_location_idx ON public.shrimp_rates (date DESC, location);
CREATE TRIGGER update_fish_rates_updated_at BEFORE UPDATE ON public.fish_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();