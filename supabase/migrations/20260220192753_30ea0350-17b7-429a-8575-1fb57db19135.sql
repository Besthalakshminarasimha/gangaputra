
CREATE TABLE public.doctor_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own appointments"
ON public.doctor_appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own appointments"
ON public.doctor_appointments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
ON public.doctor_appointments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
ON public.doctor_appointments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all appointments"
ON public.doctor_appointments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all appointments"
ON public.doctor_appointments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_doctor_appointments_updated_at
BEFORE UPDATE ON public.doctor_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
