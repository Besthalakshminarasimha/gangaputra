-- Create refund requests table
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund requests
CREATE POLICY "Users can view their own refund requests"
ON public.refund_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create refund requests for their orders
CREATE POLICY "Users can create refund requests"
ON public.refund_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all refund requests
CREATE POLICY "Admins can view all refund requests"
ON public.refund_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update refund requests
CREATE POLICY "Admins can update refund requests"
ON public.refund_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_refund_requests_updated_at
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();