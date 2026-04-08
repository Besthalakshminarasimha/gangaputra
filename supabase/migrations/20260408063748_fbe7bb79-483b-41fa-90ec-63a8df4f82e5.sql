
-- Partner banks table
CREATE TABLE public.partner_banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  logo_url TEXT,
  interest_rate_min NUMERIC,
  interest_rate_max NUMERIC,
  max_loan_amount NUMERIC,
  min_loan_amount NUMERIC DEFAULT 50000,
  loan_types TEXT[] DEFAULT '{}'::TEXT[],
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  requirements TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partner banks" ON public.partner_banks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active banks" ON public.partner_banks FOR SELECT USING (is_active = true);

CREATE TRIGGER update_partner_banks_updated_at BEFORE UPDATE ON public.partner_banks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Loan applications table
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_id UUID NOT NULL REFERENCES public.partner_banks(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  farm_location TEXT NOT NULL,
  farm_size_acres NUMERIC NOT NULL,
  species_cultivated TEXT,
  years_in_aquaculture INTEGER DEFAULT 0,
  annual_revenue NUMERIC,
  loan_amount_requested NUMERIC NOT NULL,
  loan_purpose TEXT NOT NULL,
  existing_loans_amount NUMERIC DEFAULT 0,
  collateral_details TEXT,
  aadhaar_number TEXT,
  pan_number TEXT,
  bank_account_number TEXT,
  ifsc_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own loan applications" ON public.loan_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own loan applications" ON public.loan_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all loan applications" ON public.loan_applications FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update loan applications" ON public.loan_applications FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete loan applications" ON public.loan_applications FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON public.loan_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
