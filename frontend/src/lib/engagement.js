// frontend/src/lib/engagement.js
// After the user logs something, ask the server to complete challenges, unlock
// achievements and create goal notifications. Debounced so quick taps (e.g. +1
// glass three times) only trigger one check.
import toast from "react-hot-toast";
import { apiJson, tzOffset } from "./api";
import { localDate } from "../utils/date";
import { supabase } from "./supabase";
import { useNotificationStore } from "../store/notificationStore";

const DEBOUNCE_MS = 1500;
let timer = null;
const listeners = new Set();

/** Subscribe to check results (e.g. the Challenges page refreshes itself). */
export const onEngagementUpdate = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export async function runEngagementCheck() {
  if (!navigator.onLine) return null;
  try {
    const result = await apiJson("/api/engagement/check", {
      method: "POST",
      body: JSON.stringify({ clientDate: localDate(), tzOffset: tzOffset() }),
    });
    result.completedChallenges?.forEach((name) =>
      toast.success(`Challenge complete: ${name}! 🏆`, { duration: 5000 })
    );
    result.unlockedAchievements?.forEach((name) =>
      toast.success(`Achievement unlocked: ${name}! 🎖️`, { duration: 5000 })
    );
    if (result.newNotifications) {
      const userId = (await supabase.auth.getSession()).data.session?.user?.id;
      useNotificationStore.getState().fetchNotifications(userId);
    }
    listeners.forEach((fn) => fn(result));
    return result;
  } catch (error) {
    // Progress checks are best-effort; the next log or app open retries
    console.warn("Engagement check failed:", error.message);
    return null;
  }
}

export function scheduleEngagementCheck() {
  clearTimeout(timer);
  timer = setTimeout(runEngagementCheck, DEBOUNCE_MS);
}
