-- Create table for tracking carousel update views/engagement
CREATE TABLE public.carousel_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  update_id UUID NOT NULL REFERENCES public.admin_carousel_updates(id) ON DELETE CASCADE,
  user_id UUID,
  view_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'click', 'share'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carousel_analytics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own views
CREATE POLICY "Users can log their own views"
ON public.carousel_analytics
FOR INSERT
WITH CHECK (true);

-- Allow admins to read all analytics
CREATE POLICY "Admins can read all analytics"
ON public.carousel_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_carousel_analytics_update_id ON public.carousel_analytics(update_id);
CREATE INDEX idx_carousel_analytics_created_at ON public.carousel_analytics(created_at);