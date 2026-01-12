-- Fix the overly permissive notifications INSERT policy
-- The current policy allows ANY user to insert notifications, which is a security risk
-- Edge functions use service_role which bypasses RLS, so we don't need a permissive policy

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a more restrictive policy - users can only insert notifications for themselves
-- Edge functions will continue to work because they use service_role key which bypasses RLS
CREATE POLICY "Users can insert their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);