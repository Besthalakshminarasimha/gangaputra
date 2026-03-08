
-- Job Postings table for employers
CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  location text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  skills_required text[] NOT NULL DEFAULT '{}'::text[],
  salary_range text,
  job_type text NOT NULL DEFAULT 'full-time',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active job postings" ON public.job_postings FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can create job postings" ON public.job_postings FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Users can update own job postings" ON public.job_postings FOR UPDATE USING (auth.uid() = employer_id);
CREATE POLICY "Users can delete own job postings" ON public.job_postings FOR DELETE USING (auth.uid() = employer_id);
CREATE POLICY "Admins can manage all job postings" ON public.job_postings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Job Applications table
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  job_profile_id uuid REFERENCES public.job_profiles(id) ON DELETE SET NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_posting_id, applicant_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Employers can view applications for their postings" ON public.job_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.job_postings WHERE id = job_posting_id AND employer_id = auth.uid())
);
CREATE POLICY "Authenticated users can apply" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Employers can update application status" ON public.job_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.job_postings WHERE id = job_posting_id AND employer_id = auth.uid())
);

-- Messages table for in-app chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can mark as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
