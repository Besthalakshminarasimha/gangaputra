-- Drop the overly permissive admin policy that allows viewing all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a combined policy that ensures users can only view their own profile OR admins can view all
CREATE POLICY "Users can view own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));