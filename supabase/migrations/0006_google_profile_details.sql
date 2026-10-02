-- supabase/migrations/0006_google_profile_details.sql
-- Fill profiles from Google sign-in too: Google sends full_name/name and
-- avatar_url/picture. Numeric fields are cast safely so bad input can't
-- block a signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta JSONB := COALESCE(new.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, email, name, age, weight, height, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(NULLIF(meta->>'name', ''), NULLIF(meta->>'full_name', '')),
    CASE WHEN meta->>'age' ~ '^\d{1,3}$' THEN (meta->>'age')::integer END,
    CASE WHEN meta->>'weight' ~ '^\d+(\.\d+)?$' THEN (meta->>'weight')::decimal END,
    CASE WHEN meta->>'height' ~ '^\d+(\.\d+)?$' THEN (meta->>'height')::decimal END,
    COALESCE(NULLIF(meta->>'avatar_url', ''), NULLIF(meta->>'picture', ''))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id, settings)
  VALUES (
    new.id,
    jsonb_build_object(
      'notifications', true,
      'water_reminders', true,
      'goal_reminders', true,
      'weekly_report', true
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill name/photo for people who already signed in with Google
UPDATE public.profiles p
SET name = COALESCE(p.name, NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', '')),
    avatar_url = COALESCE(p.avatar_url, NULLIF(u.raw_user_meta_data->>'avatar_url', ''), NULLIF(u.raw_user_meta_data->>'picture', ''))
FROM auth.users u
WHERE u.id = p.id
  AND (p.name IS NULL OR p.avatar_url IS NULL);
