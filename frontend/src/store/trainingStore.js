// frontend/src/store/trainingStore.js
// Workouts (sessions + sets) and body measurements. Reads/writes go straight to Supabase;
// row-level security keeps every row private to its owner.
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { localDate, addDays } from "../utils/date";
import { detectNewRecords, estimate1RM, estimateGymCalories } from "../utils/training";
import { scheduleEngagementCheck } from "../lib/engagement";
import { useActivityStore } from "./activityStore";

const getUserId = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

/** The workout/body tables come from migration 0007; report clearly if it hasn't been applied yet. */
const isMissingTable = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01" || /could not find the table|does not exist/i.test(error?.message || "");

const friendly = (error, fallback) =>
  isMissingTable(error)
    ? "setup"
    : /failed to fetch|network/i.test(error?.message || "")
    ? "You appear to be offline. Try again when you're connected."
    : fallback;

export const useTrainingStore = create((set, get) => ({
  workouts: [],
  sets: [], // every set joined with its workout date, newest first
  workoutsLoading: true,
  workoutsError: null, // "setup" | message | null

  body: [],
  bodyLoading: true,
  bodyError: null,

  fetchWorkouts: async () => {
    // Tables missing (migration not applied): don't keep hitting the API for a known 404
    if (get().workoutsError === "setup") return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      const since = localDate(addDays(new Date(), -365));
      const { data: workouts, error } = await supabase
        .from("workouts")
        .select("*, workout_sets(*)")
        .eq("user_id", userId)
        .gte("date", since)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;

      const rows = (workouts || []).map((w) => ({
        ...w,
        sets: (w.workout_sets || []).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.set_number - b.set_number),
      }));
      rows.forEach((w) => delete w.workout_sets);
      const sets = rows.flatMap((w) => w.sets.map((s) => ({ ...s, date: w.date, workout_name: w.name })));
      set({ workouts: rows, sets, workoutsLoading: false, workoutsError: null });
    } catch (error) {
      const message = friendly(error, "Couldn't load your workouts.");
      if (message !== "setup") console.error("Error fetching workouts:", error);
      set({ workoutsLoading: false, workoutsError: message });
    }
  },

  /**
   * Save a workout and its sets. Also logs a "gym" activity so goals, streaks and challenges
   * count the session. Returns { workout, records } where records are new personal bests.
   */
  saveWorkout: async ({ name, date, durationMin, notes, exercises, bodyWeightKg }) => {
    const userId = await getUserId();
    if (!userId) throw new Error("You are signed out. Please sign in again.");

    const flat = [];
    exercises.forEach((ex) => {
      ex.sets.forEach((s, i) => {
        flat.push({ exercise: ex.name.trim(), set_number: i + 1, reps: Number(s.reps), weight_kg: Number(s.weight_kg || 0) });
      });
    });
    if (!flat.length) throw new Error("Add at least one set.");

    // Personal bests before this session, to detect new records
    const previous = new Map();
    get().sets.forEach((s) => {
      const e = estimate1RM(s.weight_kg, s.reps);
      if (e > (previous.get(s.exercise) || 0)) previous.set(s.exercise, e);
    });
    const records = detectNewRecords(flat, previous);

    const minutes = Number(durationMin) > 0 ? Math.round(Number(durationMin)) : null;

    const { data: workout, error } = await supabase
      .from("workouts")
      .insert([{ user_id: userId, name: name.trim(), date, duration_min: minutes, notes: notes?.trim() || null }])
      .select()
      .single();
    if (error) throw Object.assign(new Error(friendly(error, "Couldn't save your workout.")), { cause: error });

    const { error: setsError } = await supabase
      .from("workout_sets")
      .insert(flat.map((s) => ({ ...s, workout_id: workout.id, user_id: userId })));
    if (setsError) {
      await supabase.from("workouts").delete().eq("id", workout.id);
      throw Object.assign(new Error(friendly(setsError, "Couldn't save your sets.")), { cause: setsError });
    }

    // Count the session toward goals, streaks and challenges as a "gym" activity. Only after the
    // workout is safely stored, so a failed save never leaves a stray activity behind.
    if (minutes) {
      try {
        const { activity, queued } = await useActivityStore.getState().logActivity({
          type: "gym",
          duration: minutes,
          calories: estimateGymCalories(minutes, bodyWeightKg),
          distance: null,
          notes: `Workout: ${name.trim()}`.slice(0, 200),
          date,
        });
        if (!queued) await supabase.from("workouts").update({ activity_id: activity.id }).eq("id", workout.id);
      } catch (activityError) {
        console.warn("Workout saved without a matching activity:", activityError.message);
      }
    }

    await get().fetchWorkouts();
    scheduleEngagementCheck();
    return { workout, records };
  },

  deleteWorkout: async (workout) => {
    const { error } = await supabase.from("workouts").delete().eq("id", workout.id);
    if (error) throw new Error("Couldn't delete that workout. Please try again.");
    if (workout.activity_id) await supabase.from("activities").delete().eq("id", workout.activity_id);
    set((state) => ({
      workouts: state.workouts.filter((w) => w.id !== workout.id),
      sets: state.sets.filter((s) => s.workout_id !== workout.id),
    }));
    useActivityStore.getState().fetchDashboardData();
  },

  /* ------------------------------- Body metrics ------------------------------ */
  fetchBody: async () => {
    if (get().bodyError === "setup") return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      const { data, error } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(400);
      if (error) throw error;
      set({ body: data || [], bodyLoading: false, bodyError: null });
    } catch (error) {
      const message = friendly(error, "Couldn't load your measurements.");
      if (message !== "setup") console.error("Error fetching body metrics:", error);
      set({ bodyLoading: false, bodyError: message });
    }
  },

  saveBody: async (entry) => {
    const userId = await getUserId();
    if (!userId) throw new Error("You are signed out. Please sign in again.");
    const row = { user_id: userId, date: entry.date };
    ["weight_kg", "body_fat_pct", "waist_cm", "chest_cm", "hips_cm"].forEach((k) => {
      row[k] = entry[k] === "" || entry[k] == null ? null : Number(entry[k]);
    });
    row.notes = entry.notes?.trim() || null;
    const { error } = await supabase.from("body_metrics").upsert([row], { onConflict: "user_id,date" });
    if (error) throw new Error(friendly(error, "Couldn't save your measurements."));
    await get().fetchBody();
    scheduleEngagementCheck();
  },

  deleteBody: async (id) => {
    const { error } = await supabase.from("body_metrics").delete().eq("id", id);
    if (error) throw new Error("Couldn't delete that entry. Please try again.");
    set((state) => ({ body: state.body.filter((b) => b.id !== id) }));
  },

  reset: () =>
    set({ workouts: [], sets: [], workoutsLoading: true, workoutsError: null, body: [], bodyLoading: true, bodyError: null }),
}));
