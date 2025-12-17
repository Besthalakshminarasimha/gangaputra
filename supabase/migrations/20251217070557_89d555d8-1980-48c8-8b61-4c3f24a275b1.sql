-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create sell_crop_requests table
CREATE TABLE public.sell_crop_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  crop_type TEXT NOT NULL,
  count INTEGER NOT NULL,
  quantity_tons NUMERIC NOT NULL,
  pickup_date DATE NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  phone_number TEXT,
  preferred_contact_time TEXT,
  expected_price_per_kg NUMERIC,
  total_value_estimate NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sell_crop_requests
ALTER TABLE public.sell_crop_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for sell_crop_requests
CREATE POLICY "Users can create their own requests"
ON public.sell_crop_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
ON public.sell_crop_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
ON public.sell_crop_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all requests"
ON public.sell_crop_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete requests"
ON public.sell_crop_requests
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_sell_crop_requests_updated_at
BEFORE UPDATE ON public.sell_crop_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();