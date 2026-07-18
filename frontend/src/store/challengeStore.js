// frontend/src/store/challengeStore.js
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "./authStore";

export const useChallengeStore = create((set, get) => ({
  publicChallenges: [],
  userChallenges: [],
  leaderboard: [],
  loading: true,

  // Fetches all data for the challenges page
  fetchChallengeData: async () => {
    set({ loading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const today = new Date().toISOString().split("T")[0];

      const [publicChallengesRes, userChallengesRes, leaderboardRes] =
        await Promise.all([
          // 1. Get all public challenges that are currently active
          supabase
            .from("challenges")
            .select("*")
            .eq("is_public", true)
            .gte("end_date", today),

          // 2. Get the challenges the current user has joined
          supabase
            .from("user_challenges")
            .select("*, challenges(*)") // Also fetch the details of the challenge
            .eq("user_id", user.id)
            .eq("completed", false),

          // 3. Get the top 3 users by points
          supabase
            .from("profiles")
            .select("id, name, points, avatar_url")
            .order("points", { ascending: false })
            .limit(3),
        ]);

      set({
        publicChallenges: publicChallengesRes.data || [],
        userChallenges: userChallengesRes.data || [],
        leaderboard: leaderboardRes.data || [],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching challenge data:", error);
      set({ loading: false });
    }
  },

  // Function to let a user join a challenge
  joinChallenge: async (challengeId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Use upsert to prevent joining the same challenge twice
      const { error } = await supabase.from("user_challenges").upsert({
        user_id: user.id,
        challenge_id: challengeId,
      });

      if (error) throw error;

      // Refresh the data to show the user's newly joined challenge
      await get().fetchChallengeData();
      return true;
    } catch (error) {
      console.error("Error joining challenge:", error);
      return false;
    }
  },
  generateAIChallenge: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/ai/generate-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate challenge from server.");
      }

      const newChallenge = await response.json();

      // Add the new challenge to the start of the public list to make it visible
      set((state) => ({
        publicChallenges: [newChallenge, ...state.publicChallenges],
      }));

      return newChallenge;
    } catch (error) {
      console.error("Error generating AI challenge:", error);
      throw error; // Re-throw to be caught by toast.promise
    }
  },
}));
