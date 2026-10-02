// frontend/src/store/challengeStore.js
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { apiJson } from "../lib/api";
import { localDate } from "../utils/date";

export const useChallengeStore = create((set, get) => ({
  availableChallenges: [],
  userChallenges: [],
  leaderboard: [],
  loading: true,
  error: null,

  // Fetches all data for the challenges page
  fetchChallengeData: async () => {
    set({ loading: get().availableChallenges.length === 0, error: null });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("User not found");

      const today = localDate();

      const [challengesRes, userChallengesRes, leaderboardRes] = await Promise.all([
        // Active challenges: public ones plus the user's own (private AI-generated) ones
        supabase
          .from("challenges")
          .select("*")
          .or(`is_public.eq.true,created_by.eq.${userId}`)
          .gte("end_date", today)
          .order("created_at", { ascending: false }),

        // Challenges the current user has joined
        supabase
          .from("user_challenges")
          .select("*, challenges(*)")
          .eq("user_id", userId)
          .eq("completed", false),

        // Top users by points
        supabase
          .from("profiles")
          .select("id, name, points, avatar_url")
          .order("points", { ascending: false })
          .limit(5),
      ]);

      if (challengesRes.error) throw challengesRes.error;

      set({
        availableChallenges: challengesRes.data || [],
        userChallenges: (userChallengesRes.data || []).filter((uc) => uc.challenges),
        leaderboard: leaderboardRes.data || [],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching challenge data:", error);
      set({ loading: false, error: "Couldn't load challenges." });
    }
  },

  joinChallenge: async (challengeId) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error("User not found");

    // Upsert on the unique (user_id, challenge_id) pair so joining twice is harmless
    const { error } = await supabase
      .from("user_challenges")
      .upsert({ user_id: userId, challenge_id: challengeId }, { onConflict: "user_id,challenge_id" });
    if (error) throw error;

    await get().fetchChallengeData();
    return true;
  },

  generateAIChallenge: async () => {
    const newChallenge = await apiJson("/api/ai/generate-challenge", {
      method: "POST",
      body: JSON.stringify({ clientDate: localDate() }),
    });
    set((state) => ({ availableChallenges: [newChallenge, ...state.availableChallenges] }));
    return newChallenge;
  },
}));
