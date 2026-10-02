// frontend/src/store/challengeStore.js
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { apiJson, withClientDate } from "../lib/api";
import { localDate } from "../utils/date";
import { runEngagementCheck } from "../lib/engagement";

export const useChallengeStore = create((set, get) => ({
  availableChallenges: [],
  myChallenges: [], // joined, with live progress from the server
  leaderboard: { top: [], me: null },
  loading: true,
  error: null,

  fetchChallengeData: async () => {
    set({ loading: get().availableChallenges.length === 0 && get().myChallenges.length === 0, error: null });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("User not found");

      const [challengesRes, mine, leaderboard] = await Promise.all([
        // Active challenges: public ones plus the user's own (private AI-generated) ones
        supabase
          .from("challenges")
          .select("*")
          .or(`is_public.eq.true,created_by.eq.${userId}`)
          .gte("end_date", localDate())
          .order("created_at", { ascending: false }),
        apiJson(`/api/challenges/mine?${withClientDate()}`),
        apiJson("/api/challenges/leaderboard").catch(() => ({ top: [], me: null })),
      ]);
      if (challengesRes.error) throw challengesRes.error;

      set({
        availableChallenges: challengesRes.data || [],
        myChallenges: mine || [],
        leaderboard,
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

    // Progress from earlier today may already complete it; also checks "join 5" achievement
    await runEngagementCheck();
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
