// frontend/src/store/activityStore.js
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { localDate, addDays } from "../utils/date";
import { runOrQueue, newClientId, isNetworkError } from "./syncStore";
import { apiJson, withClientDate } from "../lib/api";
import { scheduleEngagementCheck } from "../lib/engagement";

// Last successful dashboard load, so Home still shows something offline
const snapshotKey = (userId) => `apexfit-dashboard-${userId}`;
const writeSnapshot = (userId, snapshot) => {
  try {
    localStorage.setItem(snapshotKey(userId), JSON.stringify(snapshot));
  } catch {
    // ignore: storage full or unavailable
  }
};
const readSnapshot = (userId) => {
  try {
    return userId ? JSON.parse(localStorage.getItem(snapshotKey(userId)) || "null") : null;
  } catch {
    return null;
  }
};

const getUserId = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

/** Date range [start, end] (inclusive, local "YYYY-MM-DD") for a chart period around `anchor`. */
export const getChartRange = (period, anchor = new Date()) => {
  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  switch (period) {
    case "month":
      return {
        start: new Date(a.getFullYear(), a.getMonth(), 1),
        end: new Date(a.getFullYear(), a.getMonth() + 1, 0),
      };
    case "year":
      return { start: new Date(a.getFullYear(), 0, 1), end: new Date(a.getFullYear(), 11, 31) };
    case "week":
    default: {
      const start = addDays(a, -a.getDay()); // Sunday
      return { start, end: addDays(start, 6) };
    }
  }
};

let realtimeChannel = null;

export const useActivityStore = create((set, get) => ({
  activities: [],
  steps: [],
  sleep: [],
  water: [],
  goals: [],
  goalProgress: [],
  goalProgressLoading: true,
  dashboardLoading: true,
  dashboardError: null,
  chart: { key: null, steps: [], activities: [], loading: true },

  fetchDashboardData: async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;
      const since = localDate(addDays(new Date(), -6));

      const [activitiesRes, stepsRes, sleepRes, waterRes, goalsRes] = await Promise.all([
        supabase
          .from("activities")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("steps").select("*").eq("user_id", userId).gte("date", since).order("date", { ascending: false }),
        supabase.from("sleep").select("*").eq("user_id", userId).gte("date", since).order("date", { ascending: false }),
        supabase.from("water").select("*").eq("user_id", userId).gte("date", since).order("date", { ascending: false }),
        supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      const firstError = [activitiesRes, stepsRes, sleepRes, waterRes, goalsRes].find((r) => r.error)?.error;
      if (firstError) throw firstError;

      const snapshot = {
        activities: activitiesRes.data || [],
        steps: stepsRes.data || [],
        sleep: sleepRes.data || [],
        water: waterRes.data || [],
        goals: goalsRes.data || [],
      };
      set({ ...snapshot, dashboardLoading: false, dashboardError: null });
      writeSnapshot(userId, snapshot);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Offline (or a hiccup): fall back to the last data synced on this device
      const userId = await getUserId();
      const snapshot = get().dashboardLoading ? readSnapshot(userId) : null;
      set({
        ...(snapshot || {}),
        dashboardLoading: false,
        dashboardError: isNetworkError(error)
          ? snapshot
            ? "You're offline. Showing your last synced data."
            : "You're offline. Connect to load your data."
          : "Couldn't load your latest data.",
      });
    }
  },

  fetchChartData: async (period, anchor = new Date()) => {
    const { start, end } = getChartRange(period, anchor);
    const key = `${period}:${localDate(start)}`;
    set((state) => ({ chart: { ...state.chart, key, loading: true } }));
    try {
      const userId = await getUserId();
      if (!userId) return;

      const [stepsRes, activitiesRes] = await Promise.all([
        supabase
          .from("steps")
          .select("date, steps")
          .eq("user_id", userId)
          .gte("date", localDate(start))
          .lte("date", localDate(end)),
        supabase
          .from("activities")
          .select("date, calories")
          .eq("user_id", userId)
          .gte("date", localDate(start))
          .lte("date", localDate(end)),
      ]);

      // Ignore responses for a period the user has already navigated away from
      if (get().chart.key !== key) return;
      set({
        chart: { key, steps: stepsRes.data || [], activities: activitiesRes.data || [], loading: false },
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
      if (get().chart.key === key) set((state) => ({ chart: { ...state.chart, loading: false } }));
    }
  },

  /** Goals with progress computed live from the user's logs (server-side). */
  fetchGoalProgress: async () => {
    try {
      const goalProgress = await apiJson(`/api/goals/progress?${withClientDate()}`);
      set({ goalProgress, goalProgressLoading: false, goalProgressError: null });
    } catch (error) {
      console.warn("Goal progress unavailable:", error.message);
      set({ goalProgressLoading: false, goalProgressError: error.message });
    }
  },

  /**
   * Save an activity. Works offline: the client-generated id makes a later replay
   * idempotent. Goal progress is computed from logs, so nothing else to update.
   * Returns { activity, queued }.
   */
  logActivity: async (activityData) => {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");

    const activity = { ...activityData, id: newClientId(), user_id: userId };
    const { queued } = await runOrQueue({ kind: "upsert", table: "activities", payload: activity, onConflict: "id" });

    if (queued) {
      // Show it right away; it syncs when the connection returns
      set((state) => ({ activities: [{ ...activity, pending: true }, ...state.activities] }));
    } else {
      get().fetchDashboardData();
      get().fetchGoalProgress();
    }
    return { activity, queued };
  },

  setWaterIntake: async (glasses) => {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    const today = localDate();
    const row = { amount: glasses, date: today, user_id: userId };

    const { data, queued } = await runOrQueue({ kind: "upsert", table: "water", payload: row, onConflict: "user_id,date" });
    set((state) => ({ water: [data || row, ...state.water.filter((w) => w.date !== today)] }));
    return { data, queued };
  },

  addWaterIntake: async (glassesToAdd) => {
    const today = localDate();
    const current = get().water.find((w) => w.date === today)?.amount || 0;
    return get().setWaterIntake(current + glassesToAdd);
  },

  updateGoal: async (goalType, newGoalValue) => {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { data: existingGoal } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", userId)
      .eq("goal_type", goalType)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingGoal) {
      const { error } = await supabase
        .from("goals")
        .update({ target_value: newGoalValue, achieved: false, updated_at: new Date().toISOString() })
        .eq("id", existingGoal.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("goals").insert([
        { user_id: userId, goal_type: goalType, target_value: newGoalValue, current_value: 0, achieved: false },
      ]);
      if (error) throw error;
    }

    await Promise.all([get().fetchDashboardData(), get().fetchGoalProgress()]);
    scheduleEngagementCheck();
  },

  /** One realtime channel per signed-in user; call stopRealtime on sign-out. */
  startRealtime: (userId) => {
    if (!userId || realtimeChannel) return;
    realtimeChannel = supabase
      .channel(`activities-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities", filter: `user_id=eq.${userId}` },
        () => get().fetchDashboardData()
      )
      .subscribe();
  },

  stopRealtime: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },

  reset: () =>
    set({
      activities: [],
      steps: [],
      sleep: [],
      water: [],
      goals: [],
      goalProgress: [],
      goalProgressLoading: true,
      dashboardLoading: true,
      dashboardError: null,
      chart: { key: null, steps: [], activities: [], loading: true },
    }),
}));
