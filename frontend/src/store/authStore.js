// frontend/src/store/authStore.js
import { create } from "zustand";
import { supabase } from "../lib/supabase";

// Module-level guard: StrictMode runs effects twice, but we only want one listener.
let authSubscription = null;

/**
 * Supabase hands back a NEW user object on every token refresh (~hourly).
 * Keep the old reference when nothing changed, otherwise every page that
 * depends on `user` refetches and wipes unsaved edits (Profile, Settings).
 */
const sameUser = (a, b) =>
  a === b ||
  (a && b && a.id === b.id && a.updated_at === b.updated_at && a.email === b.email &&
    JSON.stringify(a.user_metadata) === JSON.stringify(b.user_metadata) &&
    JSON.stringify(a.app_metadata) === JSON.stringify(b.app_metadata));

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true, // Start with loading = true

  // Called once on app startup (App.jsx)
  initializeSession: () => {
    if (authSubscription) return;

    // 1. Get the current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Set user and session, and set loading to false after the first check
      set({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
      });
    });

    // 2. Set up a listener for future auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      set({
        user: sameUser(get().user, nextUser) ? get().user : nextUser,
        session: session ?? null,
        loading: false,
      });
    });
    authSubscription = subscription;
  },

  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          age: userData.age,
          weight: userData.weight,
          height: userData.height,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        throw new Error(
          "Please check your email to confirm your account before logging in.",
        );
      }
      throw error;
    }
    return data;
  },

  signInWithProvider: async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    // Don't leave cached health data behind on shared devices
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("apexfit-dashboard-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // storage unavailable
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
    // The onAuthStateChange listener will handle setting the user to null.
  },

  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  updatePassword: async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  },

  resendConfirmation: async (email) => {
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    return data;
  },
}));
