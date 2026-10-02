-- supabase/migrations/0004_ai_messages_insights.sql

-- Saved AI coach conversations (written by the backend with the service key)
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_user_created
  ON public.ai_messages(user_id, created_at DESC);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AI messages" ON public.ai_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI messages" ON public.ai_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Daily cached "Fitness DNA" insight reports
CREATE TABLE IF NOT EXISTS public.ai_insights (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  report_date DATE NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, report_date)
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AI insights" ON public.ai_insights
  FOR SELECT USING (auth.uid() = user_id);

-- Deleting an account must not be blocked by challenges the user created
ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_created_by_fkey,
  ADD CONSTRAINT challenges_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
