// frontend/src/pages/Steps.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Footprints } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useActivityStore } from "../store/activityStore";
import { runOrQueue, offlineSavedToast } from "../store/syncStore";
import Page from "../components/UI/Page";
import EmptyState from "../components/UI/EmptyState";
import { SkeletonStatGrid, SkeletonCard } from "../components/UI/Skeleton";
import { localDate, formatDate } from "../utils/date";
import { getGoalTarget, percentOf } from "../utils/goals";

const MAX_STEPS = 100000;

const Steps = () => {
  const { user } = useAuthStore();
  const { fetchDashboardData } = useActivityStore();
  const [history, setHistory] = useState([]);
  const [goal, setGoal] = useState(getGoalTarget([], "steps"));
  const [input, setInput] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = localDate();
  const todaySteps = history.find((d) => d.date === today)?.steps || 0;

  const fetchSteps = useCallback(async () => {
    if (!user) return;
    try {
      const [stepsRes, goalsRes] = await Promise.all([
        supabase.from("steps").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
        supabase.from("goals").select("goal_type, target_value").eq("user_id", user.id).eq("goal_type", "steps"),
      ]);
      if (stepsRes.error) throw stepsRes.error;
      setHistory(stepsRes.data || []);
      setGoal(getGoalTarget(goalsRes.data, "steps"));
    } catch (error) {
      console.error("Error fetching steps:", error);
      if (navigator.onLine) toast.error("Failed to load steps data");
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const saveSteps = async (newSteps) => {
    const value = Math.round(Number(newSteps));
    if (!Number.isFinite(value) || value < 0 || value > MAX_STEPS) {
      toast.error(`Enter a number between 0 and ${MAX_STEPS.toLocaleString()}`);
      return;
    }
    setSaving(true);
    try {
      const row = { steps: value, date: today, user_id: user.id };
      const { queued } = await runOrQueue({ kind: "upsert", table: "steps", payload: row, onConflict: "user_id,date" });
      setInput("");
      if (queued) {
        setHistory((prev) => [row, ...prev.filter((d) => d.date !== today)]);
        offlineSavedToast();
        return;
      }
      toast.success(`Today: ${value.toLocaleString()} steps`);
      await fetchSteps();
      fetchDashboardData();
    } catch {
      toast.error("Failed to update steps");
    } finally {
      setSaving(false);
    }
  };

  const last30Total = history.reduce((total, day) => total + day.steps, 0);
  const daysHit = history.filter((d) => d.steps >= goal).length;

  if (initialLoading) {
    return (
      <Page title="Steps" icon={Footprints}>
        <SkeletonStatGrid count={3} />
        <SkeletonCard lines={4} className="mt-6" />
      </Page>
    );
  }

  return (
    <Page title="Steps" icon={Footprints} subtitle={`Daily goal: ${goal.toLocaleString()} steps`}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mb-6">
        <div className="card text-center col-span-2 md:col-span-1">
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{todaySteps.toLocaleString()}</p>
          <p className="text-muted mt-1">Today's steps</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
            {percentOf(todaySteps, goal)}%
          </p>
          <p className="text-muted mt-1 text-sm sm:text-base">of daily goal</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
            {last30Total.toLocaleString()}
          </p>
          <p className="text-muted mt-1 text-sm sm:text-base">Last 30 days</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="card-title mb-4">Update today's steps</h2>
        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveSteps(input);
          }}
        >
          <label htmlFor="steps-input" className="sr-only">
            Total steps today
          </label>
          <input
            id="steps-input"
            type="number"
            inputMode="numeric"
            min="0"
            max={MAX_STEPS}
            placeholder={`Total today (currently ${todaySteps.toLocaleString()})`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-field flex-1"
          />
          <button type="submit" disabled={saving || input === ""} className="btn-primary">
            {saving ? "Saving..." : "Set total"}
          </button>
        </form>

        <p className="mt-5 mb-2 text-sm text-muted">Quick add</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[500, 1000, 2000, 3000, 5000].map((stepCount) => (
            <button
              key={stepCount}
              onClick={() => saveSteps(todaySteps + stepCount)}
              disabled={saving}
              className="btn-soft"
              aria-label={`Add ${stepCount.toLocaleString()} steps`}
            >
              +{stepCount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">History</h2>
          {history.length > 0 && (
            <p className="text-sm text-muted">
              Goal hit on {daysHit} of {history.length} days
            </p>
          )}
        </div>

        {history.length === 0 ? (
          <EmptyState compact icon={Footprints} title="No steps recorded yet" description="Add today's steps above to start your history." />
        ) : (
          <ul className="space-y-3">
            {history.map((day) => {
              const pct = percentOf(day.steps, goal);
              return (
                <li key={day.date} className="grid grid-cols-[5.5rem_1fr_auto] sm:grid-cols-[8rem_1fr_6rem] items-center gap-3 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {day.date === today ? "Today" : formatDate(day.date, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${formatDate(day.date)} steps progress`}
                  >
                    <div
                      className={`h-2 rounded-full ${pct >= 100 ? "bg-green-500" : "bg-blue-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right font-medium text-gray-900 dark:text-white">{day.steps.toLocaleString()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Page>
  );
};

export default Steps;
