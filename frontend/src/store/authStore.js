// frontend/src/store/authStore.js
import { create } from "zustand";
import { supabase } from "../lib/supabase";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true, // Start with loading = true

  // --- NEW INITIALIZATION FUNCTION ---
  initializeSession: () => {
    // 1. Get the current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Set user and, crucially, set loading to false only after the first check is done
      set({ user: session?.user ?? null, loading: false });
    });

    // 2. Set up a listener for future auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // When auth state changes, just update the user. No need to touch 'loading' again.
      set({ user: session?.user ?? null });
    });

    // Return the unsubscribe function for cleanup
    return () => {
      subscription.unsubscribe();
    };
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
          "Please check your email to confirm your account before logging in."
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
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
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

// This part is removed from here. We will call initializeSession from App.jsx
