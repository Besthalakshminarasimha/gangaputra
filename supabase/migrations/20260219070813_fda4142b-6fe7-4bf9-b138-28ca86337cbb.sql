
-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  email TEXT,
  location TEXT NOT NULL,
  image_url TEXT,
  consultation_fee NUMERIC,
  available_hours TEXT,
  languages TEXT[] DEFAULT '{}'::TEXT[],
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Anyone can view active doctors
CREATE POLICY "Anyone can view active doctors"
ON public.doctors
FOR SELECT
USING (is_active = true);

-- Admins can manage doctors
CREATE POLICY "Admins can manage doctors"
ON public.doctors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
