
CREATE TABLE public.health_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symptoms text,
  image_url text,
  diagnoses jsonb NOT NULL DEFAULT '[]'::jsonb,
  medicines jsonb NOT NULL DEFAULT '[]'::jsonb,
  doctors jsonb NOT NULL DEFAULT '[]'::jsonb,
  stores jsonb NOT NULL DEFAULT '[]'::jsonb,
  latitude double precision,
  longitude double precision,
  share_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX health_reports_share_token_idx ON public.health_reports(share_token);
CREATE INDEX health_reports_user_id_idx ON public.health_reports(user_id, created_at DESC);

ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health reports"
  ON public.health_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared report by token"
  ON public.health_reports FOR SELECT
  USING (share_token IS NOT NULL);

CREATE POLICY "Users can create own health reports"
  ON public.health_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health reports"
  ON public.health_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health reports"
  ON public.health_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER health_reports_updated_at
  BEFORE UPDATE ON public.health_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
