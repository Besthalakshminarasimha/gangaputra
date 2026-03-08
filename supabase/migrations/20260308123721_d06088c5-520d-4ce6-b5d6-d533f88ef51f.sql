
CREATE TABLE public.skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_profile_id uuid NOT NULL REFERENCES public.job_profiles(id) ON DELETE CASCADE,
  skill text NOT NULL,
  endorser_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_profile_id, skill, endorser_id)
);

ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view endorsements" ON public.skill_endorsements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can endorse" ON public.skill_endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id);
CREATE POLICY "Users can remove own endorsements" ON public.skill_endorsements FOR DELETE USING (auth.uid() = endorser_id);
