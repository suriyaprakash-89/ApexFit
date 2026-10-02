// frontend/src/pages/Privacy.jsx
// Plain-language description of how ApeXfit actually handles data.
// Keep this in sync with the code if data flows change.
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const LAST_UPDATED = "October 2, 2026";

const Section = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    <div className="mt-3 space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>
  </section>
);

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy · ApeXfit";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="ApeXfit home">
            <img src="/logo.png" alt="" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-gray-900 dark:text-white">ApeXfit</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Privacy</h1>
        <p className="mt-2 text-sm text-muted">Last updated {LAST_UPDATED}</p>
        <p className="mt-6 text-lg text-gray-700 dark:text-gray-300">
          ApeXfit is a fitness tracker. This page explains, in plain language, what we store, why, who else touches
          it, and how you stay in control.
        </p>

        <Section title="What we store">
          <p>
            <strong>Account details:</strong> your email, name, and (if you add them) age, weight and height.
          </p>
          <p>
            <strong>What you log:</strong> workouts, steps, sleep, water, goals, challenges you join, points and
            achievements.
          </p>
          <p>
            <strong>AI coach chats:</strong> your messages and the coach's replies, so the conversation is there next
            time. You can clear it anytime with "New chat".
          </p>
          <p>
            <strong>Settings:</strong> your notification and reminder preferences.
          </p>
        </Section>

        <Section title="Where it's stored and who can see it">
          <p>
            Your data is stored in our database hosted by Supabase. Row-level security means each record can only be
            read by the account that created it. The leaderboard shows only a short display name (for example
            "Priya S.") and your points.
          </p>
          <p>
            Some data is saved on your own device: your theme choice, the last dashboard you saw (so the app works
            offline, cleared when you sign out), and any logs waiting to sync.
          </p>
        </Section>

        <Section title="AI features">
          <p>
            When you use the AI coach, Insights or AI-generated challenges, we send a summary of your recent fitness
            data (for example your average steps and sleep) and your message to our AI provider, Groq, only to generate
            the reply. Groq's published policy says it does not use API inputs to train models; it may keep logs for a
            short time to investigate abuse.
          </p>
          <p>The AI coach gives general guidance only. It is not a doctor and does not provide medical advice.</p>
        </Section>

        <Section title="Camera (AR challenges)">
          <p>
            AR form checks run entirely in your browser. Camera video is processed on your device and is never
            uploaded or recorded. Only the result (challenge completed, points earned) is saved.
          </p>
        </Section>

        <Section title="What we don't do">
          <p>We don't sell your data, share it with advertisers, or show ads.</p>
        </Section>

        <Section title="Your controls">
          <p>
            <strong>Export:</strong> Settings → Your data → Export all data downloads everything you've logged.
          </p>
          <p>
            <strong>Delete:</strong> Settings → Danger zone → Delete account permanently removes your account and all
            of your data, including AI chat history.
          </p>
          <p>
            <strong>Notifications:</strong> turn reminders and weekly summaries on or off in Settings.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            If you have a privacy question or request, contact the ApeXfit team through the project's support channel.
          </p>
        </Section>
      </main>
    </div>
  );
};

export default Privacy;
