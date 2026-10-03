-- supabase/migrations/0007_workouts_body_metrics.sql
-- Workout logging (sessions + sets) and body measurements (weight, body fat, tape measures).
-- Every table is locked to its owner with row-level security, like the existing tracking tables.

CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_min INTEGER CHECK (duration_min IS NULL OR (duration_min >= 0 AND duration_min <= 1440)),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),
  -- The "gym" activity created alongside, so goals/streaks/challenges count the session
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise TEXT NOT NULL CHECK (char_length(exercise) BETWEEN 1 AND 80),
  set_number INTEGER NOT NULL DEFAULT 1 CHECK (set_number >= 1),
  reps INTEGER NOT NULL CHECK (reps >= 0 AND reps <= 1000),
  weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0 AND weight_kg <= 1500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.body_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5, 2) CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 700)),
  body_fat_pct NUMERIC(4, 1) CHECK (body_fat_pct IS NULL OR (body_fat_pct >= 2 AND body_fat_pct <= 70)),
  waist_cm NUMERIC(5, 1) CHECK (waist_cm IS NULL OR (waist_cm > 0 AND waist_cm <= 400)),
  chest_cm NUMERIC(5, 1) CHECK (chest_cm IS NULL OR (chest_cm > 0 AND chest_cm <= 400)),
  hips_cm NUMERIC(5, 1) CHECK (hips_cm IS NULL OR (hips_cm > 0 AND hips_cm <= 400)),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 300),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS workouts_user_date_idx ON public.workouts (user_id, date DESC);
CREATE INDEX IF NOT EXISTS workout_sets_workout_idx ON public.workout_sets (workout_id);
CREATE INDEX IF NOT EXISTS workout_sets_user_exercise_idx ON public.workout_sets (user_id, exercise);
CREATE INDEX IF NOT EXISTS body_metrics_user_date_idx ON public.body_metrics (user_id, date DESC);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workouts" ON public.workouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own workout sets" ON public.workout_sets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own body metrics" ON public.body_metrics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
