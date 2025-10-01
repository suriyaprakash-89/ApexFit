// frontend/src/store/activityStore.js
import { create } from "zustand";
import { supabase } from "../lib/supabase";

export const useActivityStore = create((set, get) => ({
  activities: [],
  steps: [],
  sleep: [],
  water: [],
  goals: [],
  chartData: {
    day: { steps: [], activities: [] },
    week: { steps: [], activities: [] },
    month: { steps: [], activities: [] },
  },

  fetchDashboardData: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all data in parallel
      const [activitiesRes, stepsRes, sleepRes, waterRes, goalsRes] =
        await Promise.all([
          supabase
            .from("activities")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(10),
          supabase
            .from("steps")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(7),
          supabase
            .from("sleep")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(7),
          supabase
            .from("water")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(7),
          supabase
            .from("goals")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      set({
        activities: activitiesRes.data || [],
        steps: stepsRes.data || [],
        sleep: sleepRes.data || [],
        water: waterRes.data || [],
        goals: goalsRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  },

  fetchChartData: async (period) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate;

      switch (period) {
        case "day":
          // Get data for today only
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          // Get data for the last 7 days
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          // Get data for the last 30 days
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
      }

      const startDateString = startDate.toISOString().split("T")[0];

      // Fetch steps and activities for the selected period
      const [stepsRes, activitiesRes] = await Promise.all([
        supabase
          .from("steps")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startDateString)
          .order("date", { ascending: true }),
        supabase
          .from("activities")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startDateString)
          .order("date", { ascending: true }),
      ]);

      set((state) => ({
        chartData: {
          ...state.chartData,
          [period]: {
            steps: stepsRes.data || [],
            activities: activitiesRes.data || [],
          },
        },
      }));
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  },

  addActivity: async (activityData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("activities")
        .insert([{ ...activityData, user_id: user.id }])
        .select();

      if (error) throw error;

      set((state) => ({
        activities: [data[0], ...state.activities],
      }));

      return data[0];
    } catch (error) {
      console.error("Error adding activity:", error);
      throw error;
    }
  },

  // In your activityStore.js, replace the addWaterIntake function with this:
  addWaterIntake: async (glassesToAdd) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const today = new Date().toISOString().split("T")[0];

      // Get current water intake for today
      const { data: existingEntry } = await supabase
        .from("water")
        .select("amount")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      const currentAmount = existingEntry?.amount || 0;
      const newAmount = currentAmount + glassesToAdd;

      const { data, error } = await supabase
        .from("water")
        .upsert(
          {
            amount: newAmount,
            date: today,
            user_id: user.id,
          },
          { onConflict: "user_id,date" }
        )
        .select();

      if (error) throw error;

      set((state) => ({
        water: [data[0], ...state.water.filter((w) => w.date !== today)],
      }));

      return data[0];
    } catch (error) {
      console.error("Error adding water intake:", error);
      throw error;
    }
  },

  // Real-time subscription setup
  setupRealtime: () => {
    const user = supabase.auth.getUser();
    if (!user) return;

    const subscription = supabase
      .channel("activities-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Realtime update:", payload);
          get().fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
  // Add to your existing activityStore.js
  updateGoal: async (goalType, newGoalValue) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First check if goal already exists
      const { data: existingGoal } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("goal_type", goalType)
        .single();

      if (existingGoal) {
        // Update existing goal
        const { error } = await supabase
          .from("goals")
          .update({
            target_value: newGoalValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingGoal.id);

        if (error) throw error;
      } else {
        // Create new goal
        const { error } = await supabase.from("goals").insert([
          {
            user_id: user.id,
            goal_type: goalType,
            target_value: newGoalValue,
            current_value: 0,
            achieved: false,
          },
        ]);

        if (error) throw error;
      }

      // Refresh goals data
      get().fetchDashboardData();
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  },
}));

// Setup real-time when user logs in
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    useActivityStore.getState().setupRealtime();
  }
});
