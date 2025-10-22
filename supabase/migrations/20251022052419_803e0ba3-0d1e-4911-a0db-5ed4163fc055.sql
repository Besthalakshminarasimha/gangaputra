-- Create farms table
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL,
  location TEXT NOT NULL,
  number_of_ponds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for farms
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for farms
CREATE POLICY "Users can view their own farms" 
ON public.farms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own farms" 
ON public.farms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farms" 
ON public.farms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farms" 
ON public.farms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create powermon_devices table
CREATE TABLE public.powermon_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity DECIMAL(10,2) NOT NULL,
  current_amps DECIMAL(10,2),
  status TEXT DEFAULT 'Normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for powermon_devices
ALTER TABLE public.powermon_devices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for powermon_devices
CREATE POLICY "Users can view their own powermon devices" 
ON public.powermon_devices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own powermon devices" 
ON public.powermon_devices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own powermon devices" 
ON public.powermon_devices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own powermon devices" 
ON public.powermon_devices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create service_requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for service_requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_requests
CREATE POLICY "Users can view their own service requests" 
ON public.service_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service requests" 
ON public.service_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_farms_updated_at
BEFORE UPDATE ON public.farms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_powermon_devices_updated_at
BEFORE UPDATE ON public.powermon_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();