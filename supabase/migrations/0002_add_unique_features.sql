-- supabase/migrations/0002_add_unique_features.sql
-- Create challenges table
CREATE TABLE public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('steps', 'sleep', 'workout', 'water', 'custom')),
  target_value DECIMAL NOT NULL,
  points INTEGER DEFAULT 100,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  max_participants INTEGER,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_challenges table (many-to-many relationship)
CREATE TABLE public.user_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress DECIMAL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, challenge_id)
);

-- Create user_points table
CREATE TABLE public.user_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('activity', 'challenge', 'goal', 'streak', 'achievement')),
  source_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 50,
  condition_type TEXT NOT NULL,
  condition_value DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Create ai_sessions table for AI coach
CREATE TABLE public.ai_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for new tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Challenges are viewable by everyone" ON public.challenges
  FOR SELECT USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their challenge participation" ON public.user_challenges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their AI sessions" ON public.ai_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update user points
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles table with total points
  UPDATE public.profiles 
  SET points = COALESCE((
    SELECT SUM(points) 
    FROM public.user_points 
    WHERE user_id = NEW.user_id
  ), 0)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user points
CREATE TRIGGER on_user_points_updated
  AFTER INSERT OR UPDATE ON public.user_points
  FOR EACH ROW EXECUTE FUNCTION public.update_user_points();

-- Insert sample achievements
INSERT INTO public.achievements (name, description, icon, points, condition_type, condition_value) VALUES
  ('First Steps', 'Log your first activity', '👣', 50, 'activities_count', 1),
  ('Early Bird', 'Complete a morning workout', '🌅', 75, 'morning_activities', 5),
  ('Hydration Hero', 'Drink 8 glasses of water for 7 consecutive days', '💧', 100, 'water_streak', 7),
  ('Sleep Master', 'Average 7+ hours of sleep for a week', '😴', 100, 'sleep_quality', 7),
  ('Goal Crusher', 'Complete your first goal', '🎯', 150, 'goals_completed', 1),
  ('Social Butterfly', 'Join 5 challenges', '🦋', 125, 'challenges_joined', 5),
  ('Weekend Warrior', 'Complete activities on both weekend days', '💪', 85, 'weekend_activities', 2),
  ('Consistency King', 'Log activities for 30 consecutive days', '👑', 200, 'activity_streak', 30);

-- Create indexes for better performance
CREATE INDEX idx_challenges_end_date ON public.challenges(end_date);
CREATE INDEX idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_ai_sessions_user_id ON public.ai_sessions(user_id);