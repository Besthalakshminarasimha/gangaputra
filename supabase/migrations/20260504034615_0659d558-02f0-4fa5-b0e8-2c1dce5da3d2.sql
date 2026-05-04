CREATE TABLE public.comet_agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  citations JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comet_agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comet tasks" ON public.comet_agent_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own comet tasks" ON public.comet_agent_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comet tasks" ON public.comet_agent_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comet tasks" ON public.comet_agent_tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_comet_agent_tasks_updated_at
  BEFORE UPDATE ON public.comet_agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_comet_agent_tasks_user_created ON public.comet_agent_tasks(user_id, created_at DESC);