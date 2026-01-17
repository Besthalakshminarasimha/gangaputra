-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can log their own views" ON public.carousel_analytics;

-- Create a more restrictive policy that requires authentication
CREATE POLICY "Authenticated users can log views"
ON public.carousel_analytics
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);