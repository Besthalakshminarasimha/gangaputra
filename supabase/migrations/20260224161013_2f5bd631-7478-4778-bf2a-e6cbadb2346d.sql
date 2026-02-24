
-- Create job_profiles table
CREATE TABLE public.job_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  location TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  skills TEXT[] NOT NULL DEFAULT '{}',
  education TEXT,
  languages TEXT[] DEFAULT '{}',
  expected_salary TEXT,
  availability TEXT NOT NULL DEFAULT 'full-time',
  bio TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.job_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view active profiles
CREATE POLICY "Anyone can view active job profiles"
ON public.job_profiles FOR SELECT
USING (is_active = true);

-- Users can manage their own profile
CREATE POLICY "Users can insert own job profile"
ON public.job_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job profile"
ON public.job_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job profile"
ON public.job_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all job profiles"
ON public.job_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_job_profiles_updated_at
BEFORE UPDATE ON public.job_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
