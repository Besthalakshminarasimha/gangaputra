-- Create admin_carousel_updates table for rich media updates
CREATE TABLE public.admin_carousel_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'gif', 'text')),
  media_url TEXT,
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_carousel_updates ENABLE ROW LEVEL SECURITY;

-- Everyone can view active updates
CREATE POLICY "Anyone can view active carousel updates"
ON public.admin_carousel_updates
FOR SELECT
USING (is_active = true);

-- Only admins can manage updates
CREATE POLICY "Admins can manage carousel updates"
ON public.admin_carousel_updates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create storage bucket for admin uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-uploads', 'admin-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for admin uploads
CREATE POLICY "Anyone can view admin uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'admin-uploads');

CREATE POLICY "Admins can upload to admin-uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'admin-uploads' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update admin-uploads"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'admin-uploads'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete from admin-uploads"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'admin-uploads'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_admin_carousel_updates_updated_at
BEFORE UPDATE ON public.admin_carousel_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for carousel updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_carousel_updates;