-- Create hatcheries table
CREATE TABLE public.hatcheries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  type TEXT NOT NULL,
  species TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  active_ingredient TEXT,
  dosage TEXT,
  price NUMERIC,
  approved BOOLEAN DEFAULT true,
  uses TEXT,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hatcheries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- Hatcheries policies
CREATE POLICY "Anyone can view active hatcheries" 
ON public.hatcheries 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage hatcheries" 
ON public.hatcheries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Medicines policies
CREATE POLICY "Anyone can view active medicines" 
ON public.medicines 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage medicines" 
ON public.medicines 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update timestamp triggers
CREATE TRIGGER update_hatcheries_updated_at
BEFORE UPDATE ON public.hatcheries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
BEFORE UPDATE ON public.medicines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();