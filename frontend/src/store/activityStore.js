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
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
      }

      const startDateString = startDate.toISOString().split("T")[0];

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

  // --- NEW UNIFIED FUNCTION FOR LOGGING ACTIVITIES AND UPDATING GOALS ---
  logActivityAndUpdateGoals: async (activityData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Step 1: Insert the new activity (e.g., a 'run' with calories, or a 'walk' with steps)
      const { data: newActivity, error: insertError } = await supabase
        .from("activities")
        .insert([{ ...activityData, user_id: user.id }])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("Activity logged:", newActivity);
      set((state) => ({ activities: [newActivity, ...state.activities] }));

      // Step 2: After logging, call the database function to update relevant goals.
      // We check for both 'calories' and 'steps' as an activity might contribute to either.

      // Update calories goal if calories were logged
      if (newActivity.calories && newActivity.calories > 0) {
        const { error: rpcError } = await supabase.rpc(
          "increment_goal_progress",
          {
            user_id_input: user.id,
            activity_type: "calories",
            value_added: newActivity.calories,
          }
        );
        if (rpcError) console.error("Error updating calories goal:", rpcError);
      }

      // Update steps goal if steps were logged (assuming steps are part of the activity data)
      if (newActivity.steps && newActivity.steps > 0) {
        const { error: rpcError } = await supabase.rpc(
          "increment_goal_progress",
          {
            user_id_input: user.id,
            activity_type: "steps",
            value_added: newActivity.steps,
          }
        );
        if (rpcError) console.error("Error updating steps goal:", rpcError);
      }

      // Step 3: Refresh all data to show the latest progress everywhere
      await get().fetchDashboardData();

      return newActivity;
    } catch (error) {
      console.error("Error in logActivityAndUpdateGoals:", error);
      throw error;
    }
  },

  // This function is kept for backwards compatibility but now just calls the new one.
  addActivity: async (activityData) => {
    return get().logActivityAndUpdateGoals(activityData);
  },

  addWaterIntake: async (glassesToAdd) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const today = new Date().toISOString().split("T")[0];

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

  updateGoal: async (goalType, newGoalValue) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: existingGoal } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("goal_type", goalType)
        .single();

      // THE FIX IS HERE: When creating or updating a goal, its current_value must be 0.
      const newCurrentValue = 0;

      if (existingGoal) {
        const { error } = await supabase
          .from("goals")
          .update({
            target_value: newGoalValue,
            current_value: newCurrentValue, // Reset progress on goal update
            achieved: false, // Reset achieved status
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert([
          {
            user_id: user.id,
            goal_type: goalType,
            target_value: newGoalValue,
            current_value: newCurrentValue, // Always start new goals at 0
            achieved: false,
          },
        ]);
        if (error) throw error;
      }

      get().fetchDashboardData();
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  },
}));

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    useActivityStore.getState().setupRealtime();
  }
});
