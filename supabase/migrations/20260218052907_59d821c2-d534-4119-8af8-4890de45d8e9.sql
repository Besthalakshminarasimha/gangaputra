
-- Create diagnosis_history table for farmers to track disease diagnoses
CREATE TABLE public.diagnosis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symptoms TEXT,
  image_url TEXT,
  diagnoses JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagnosis_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own diagnosis history
CREATE POLICY "Users can view their own diagnoses"
ON public.diagnosis_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnoses"
ON public.diagnosis_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagnoses"
ON public.diagnosis_history FOR DELETE
USING (auth.uid() = user_id);
