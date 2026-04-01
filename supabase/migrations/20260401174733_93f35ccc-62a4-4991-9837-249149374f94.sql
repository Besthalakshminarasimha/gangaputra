
-- Create crop_cycles table
CREATE TABLE public.crop_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cycle_name TEXT NOT NULL,
  species TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crop cycles" ON public.crop_cycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own crop cycles" ON public.crop_cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crop cycles" ON public.crop_cycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crop cycles" ON public.crop_cycles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crop_cycles_updated_at BEFORE UPDATE ON public.crop_cycles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create ledger_entries table
CREATE TABLE public.ledger_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crop_cycle_id UUID NOT NULL REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL, -- 'expense' or 'revenue'
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  quantity_details TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ledger entries" ON public.ledger_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ledger entries" ON public.ledger_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ledger entries" ON public.ledger_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ledger_entries_updated_at BEFORE UPDATE ON public.ledger_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ledger_entries_cycle ON public.ledger_entries(crop_cycle_id);
CREATE INDEX idx_ledger_entries_user ON public.ledger_entries(user_id);
CREATE INDEX idx_crop_cycles_user ON public.crop_cycles(user_id);
