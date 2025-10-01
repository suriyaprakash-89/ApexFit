// frontend/src/store/notificationStore.js
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  reminders: [],

  fetchNotifications: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ notifications: data || [] });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  },

  addReminder: async (reminderData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("reminders")
        .insert([{ ...reminderData, user_id: user.id }])
        .select();

      if (error) throw error;

      set((state) => ({
        reminders: [data[0], ...state.reminders],
      }));

      // Show notification
      toast.success(reminderData.message);

      return data[0];
    } catch (error) {
      console.error("Error adding reminder:", error);
      throw error;
    }
  },

  checkWaterReminder: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const { data: waterData } = await supabase
        .from("water")
        .select("amount")
        .eq("date", today)
        .eq("user_id", user.id)
        .single();

      if (!waterData || waterData.amount < 4) {
        // Send reminder if less than 4 glasses today
        get().addReminder({
          type: "water",
          message:
            "💧 Remember to drink water! You should aim for 8 glasses today.",
          scheduled_time: new Date().toISOString(),
          is_completed: false,
        });
      }
    } catch (error) {
      console.error("Error checking water reminder:", error);
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.filter(
          (n) => n.id !== notificationId
        ),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },
}));
