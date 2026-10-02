// frontend/src/store/notificationStore.js
// Single owner of notification state + realtime (NotificationCenter only renders it).
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { localDate } from "../utils/date";
import { getGoalTarget } from "../utils/goals";

let channel = null;

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async (userId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      set({ notifications: data || [] });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      set({ loading: false });
    }
  },

  startRealtime: (userId) => {
    if (!userId || channel) return;
    channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => set((state) => ({ notifications: [payload.new, ...state.notifications] }))
      )
      .subscribe();
  },

  stopRealtime: () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    set({ notifications: [] });
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    }));
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) console.error("Error marking notification as read:", error);
  },

  markAllAsRead: async (userId) => {
    const unreadIds = get().notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, is_read: true })) }));
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
      .eq("user_id", userId);
    if (error) console.error("Error marking all as read:", error);
  },

  /** Hourly nudge if the user is well behind on water (respects their settings). */
  checkWaterReminder: async (userId) => {
    if (!userId) return;
    try {
      const [{ data: settingsRow }, { data: waterRow }, { data: goals }] = await Promise.all([
        supabase.from("user_settings").select("settings").eq("user_id", userId).maybeSingle(),
        supabase.from("water").select("amount").eq("user_id", userId).eq("date", localDate()).maybeSingle(),
        supabase.from("goals").select("goal_type, target_value").eq("user_id", userId).eq("goal_type", "water"),
      ]);
      const settings = settingsRow?.settings || {};
      if (settings.notifications === false || settings.water_reminders === false) return;

      const hour = new Date().getHours();
      if (hour < 8 || hour >= 22) return; // no reminders at night

      const goal = getGoalTarget(goals, "water");
      const amount = waterRow?.amount || 0;
      if (amount < goal / 2) {
        toast(`💧 Time for some water! You've had ${amount} of ${goal} glasses today.`, { duration: 6000 });
      }
    } catch (error) {
      console.error("Error checking water reminder:", error);
    }
  },
}));
