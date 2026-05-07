
CREATE TABLE public.agent_scheduled_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  completed boolean NOT NULL DEFAULT false,
  source text DEFAULT 'agent',
  email_recipient text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scheduled tasks" ON public.agent_scheduled_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own scheduled tasks" ON public.agent_scheduled_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scheduled tasks" ON public.agent_scheduled_tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own scheduled tasks" ON public.agent_scheduled_tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_agent_scheduled_tasks_updated_at
  BEFORE UPDATE ON public.agent_scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
