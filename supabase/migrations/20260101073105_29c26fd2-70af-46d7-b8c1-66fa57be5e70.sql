-- Create enum for disease types
CREATE TYPE public.disease_category AS ENUM ('shrimp', 'fish');

-- Create enum for content types
CREATE TYPE public.content_category AS ENUM ('disease', 'magazine', 'crop_manual', 'product');

-- Create diseases table
CREATE TABLE public.diseases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category disease_category NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  symptoms TEXT,
  treatment TEXT,
  prevention TEXT,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create magazines table
CREATE TABLE public.magazines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  content TEXT,
  pdf_url TEXT,
  published_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crop manuals table
CREATE TABLE public.crop_manuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  image_urls TEXT[] DEFAULT '{}',
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table for Ganga Store
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  image_urls TEXT[] DEFAULT '{}',
  video_url TEXT,
  category TEXT,
  in_stock BOOLEAN DEFAULT true,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily updates table
CREATE TABLE public.daily_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_updates ENABLE ROW LEVEL SECURITY;

-- Diseases policies
CREATE POLICY "Anyone can view diseases" ON public.diseases FOR SELECT USING (true);
CREATE POLICY "Admins can manage diseases" ON public.diseases FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Magazines policies
CREATE POLICY "Anyone can view magazines" ON public.magazines FOR SELECT USING (true);
CREATE POLICY "Admins can manage magazines" ON public.magazines FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Crop manuals policies
CREATE POLICY "Anyone can view crop manuals" ON public.crop_manuals FOR SELECT USING (true);
CREATE POLICY "Admins can manage crop manuals" ON public.crop_manuals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Products policies
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Daily updates policies
CREATE POLICY "Anyone can view active updates" ON public.daily_updates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage daily updates" ON public.daily_updates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_diseases_updated_at BEFORE UPDATE ON public.diseases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_magazines_updated_at BEFORE UPDATE ON public.magazines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crop_manuals_updated_at BEFORE UPDATE ON public.crop_manuals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_updates_updated_at BEFORE UPDATE ON public.daily_updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();