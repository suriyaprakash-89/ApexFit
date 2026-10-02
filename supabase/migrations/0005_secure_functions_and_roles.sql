-- supabase/migrations/0005_secure_functions_and_roles.sql
-- 1. Defines the two RPCs the app calls (they were never in a migration).
-- 2. Stops users from editing their own role/points (privilege escalation).
-- 3. Mirrors admin roles into app_metadata, which only the server can write.

-- Drop any hand-made versions first, whatever their argument types were,
-- so CREATE below doesn't leave ambiguous overloads behind.
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('increment_goal_progress', 'award_ar_challenge_points')
  LOOP
    EXECUTE format('DROP FUNCTION %s', fn.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- increment_goal_progress: add to the caller's open goal of the given type
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.increment_goal_progress(
  user_id_input UUID,
  activity_type TEXT,
  value_added NUMERIC
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated_count INTEGER;
BEGIN
  -- Callers may only update their own goals
  IF auth.uid() IS NULL OR auth.uid() <> user_id_input THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF value_added IS NULL OR value_added <= 0 OR value_added > 100000 THEN
    RAISE EXCEPTION 'value_added out of range' USING ERRCODE = '22003';
  END IF;

  UPDATE public.goals
  SET current_value = COALESCE(current_value, 0) + value_added,
      achieved = COALESCE(current_value, 0) + value_added >= target_value,
      updated_at = NOW()
  WHERE user_id = auth.uid()
    AND goal_type = activity_type
    AND achieved = FALSE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_goal_progress(UUID, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_goal_progress(UUID, TEXT, NUMERIC) TO authenticated;

-- ---------------------------------------------------------------------------
-- award_ar_challenge_points: only known AR challenges, at most once per day each.
-- Returns the points awarded (0 if already earned today).
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.award_ar_challenge_points(
  user_id_input UUID,
  points_to_add INTEGER,
  challenge_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_points INTEGER;
  label TEXT := 'AR: ' || challenge_name;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> user_id_input THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  -- Server-side source of truth for rewards (keep in sync with ARFitnessChallenge.jsx)
  allowed_points := CASE challenge_name
    WHEN 'Wall Sit Challenge' THEN 100
    WHEN 'Plank Challenge' THEN 150
    ELSE NULL
  END;
  IF allowed_points IS NULL OR points_to_add <> allowed_points THEN
    RAISE EXCEPTION 'unknown challenge' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_points
    WHERE user_id = auth.uid()
      AND source_type = 'challenge'
      AND description = label
      AND created_at >= date_trunc('day', NOW())
  ) THEN
    RETURN 0;
  END IF;

  -- The on_user_points_updated trigger recalculates profiles.points
  INSERT INTO public.user_points (user_id, points, source_type, description)
  VALUES (auth.uid(), allowed_points, 'challenge', label);

  RETURN allowed_points;
END;
$$;

REVOKE ALL ON FUNCTION public.award_ar_challenge_points(UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_ar_challenge_points(UUID, INTEGER, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Protect profiles.role and profiles.points from direct client writes.
-- Requests made with a user's JWT run as "authenticated"/"anon"; the backend's
-- service key ("service_role") and SECURITY DEFINER functions are unaffected.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'user';
      NEW.points := 0;
    ELSIF NEW.role IS DISTINCT FROM OLD.role OR NEW.points IS DISTINCT FROM OLD.points THEN
      RAISE EXCEPTION 'role and points can only be changed by the server' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- Recalculating points runs inside SECURITY DEFINER code, so let it bypass the guard
ALTER FUNCTION public.update_user_points() SECURITY DEFINER SET search_path = public;

-- Mirror existing admins into app_metadata (the app reads the role from there)
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE p.id = u.id;
