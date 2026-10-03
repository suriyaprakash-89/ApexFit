// frontend/src/pages/Sleep.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Moon, Star } from "lucide-react";
import toast from "@/lib/toast";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useActivityStore } from "../store/activityStore";
import { runOrQueue, offlineSavedToast } from "../store/syncStore";
import Page from "../components/UI/Page";
import EmptyState from "../components/UI/EmptyState";
import { SkeletonStatGrid, SkeletonCard } from "../components/UI/Skeleton";
import { localDate, formatDate } from "../utils/date";

const QUALITY_LABELS = ["", "Very poor", "Poor", "Average", "Good", "Excellent"];

const Sleep = () => {
  const { user } = useAuthStore();
  const { fetchDashboardData } = useActivityStore();
  const [sleepData, setSleepData] = useState([]);
  const [todaySleep, setTodaySleep] = useState({ hours: "", quality: 3 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSleepData = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("sleep")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);
      if (error) throw error;

      const todayEntry = data?.find((entry) => entry.date === localDate());
      if (todayEntry) setTodaySleep({ hours: todayEntry.hours, quality: todayEntry.quality || 3 });
      setSleepData(data || []);
    } catch (error) {
      console.error("Error fetching sleep data:", error);
      if (navigator.onLine) toast.error("Failed to load sleep data");
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSleepData();
  }, [fetchSleepData]);

  const logSleep = async (e) => {
    e.preventDefault();
    const hours = parseFloat(todaySleep.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      toast.error("Please enter valid sleep hours (0–24)");
      return;
    }

    setSaving(true);
    try {
      const row = { hours, quality: todaySleep.quality, date: localDate(), user_id: user.id };
      const { queued } = await runOrQueue({ kind: "upsert", table: "sleep", payload: row, onConflict: "user_id,date" });
      if (queued) {
        setSleepData((prev) => [row, ...prev.filter((e) => e.date !== row.date)]);
        offlineSavedToast();
        return;
      }
      toast.success("Sleep logged");
      fetchSleepData();
      fetchDashboardData();
    } catch (error) {
      console.error("Error logging sleep:", error);
      toast.error("Failed to log sleep");
    } finally {
      setSaving(false);
    }
  };

  const avgHours = sleepData.length
    ? (sleepData.reduce((sum, e) => sum + parseFloat(e.hours), 0) / sleepData.length).toFixed(1)
    : "0";
  const rated = sleepData.filter((e) => e.quality);
  const avgQuality = rated.length ? (rated.reduce((sum, e) => sum + e.quality, 0) / rated.length).toFixed(1) : "–";

  if (initialLoading) {
    return (
      <Page title="Sleep" icon={Moon}>
        <SkeletonStatGrid count={3} />
        <SkeletonCard lines={4} className="mt-6" />
      </Page>
    );
  }

  return (
    <Page title="Sleep" icon={Moon} subtitle="Aim for 7–9 hours of quality sleep">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mb-6">
        <div className="card text-center col-span-2 md:col-span-1">
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{todaySleep.hours || "0"}h</p>
          <p className="text-muted mt-1">Last night</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">{avgHours}h</p>
          <p className="text-muted mt-1 text-sm sm:text-base">30-day average</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">{avgQuality}/5</p>
          <p className="text-muted mt-1 text-sm sm:text-base">Avg quality</p>
        </div>
      </div>

      <form className="card mb-6" onSubmit={logSleep}>
        <h2 className="card-title mb-4">Log last night's sleep</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="sleep-hours" className="label">
              Sleep duration (hours)
            </label>
            <input
              id="sleep-hours"
              type="number"
              inputMode="decimal"
              step="0.25"
              min="0"
              max="24"
              value={todaySleep.hours}
              onChange={(e) => setTodaySleep({ ...todaySleep, hours: e.target.value })}
              className="input-field"
              placeholder="7.5"
              required
            />
          </div>

          <fieldset>
            <legend className="label">Sleep quality</legend>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Sleep quality">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  role="radio"
                  aria-checked={todaySleep.quality === rating}
                  aria-label={`${rating} out of 5, ${QUALITY_LABELS[rating]}`}
                  onClick={() => setTodaySleep({ ...todaySleep, quality: rating })}
                  className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Star
                    className={`w-7 h-7 ${
                      rating <= todaySleep.quality ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted mt-1">{QUALITY_LABELS[todaySleep.quality]}</p>
          </fieldset>
        </div>

        <button type="submit" disabled={saving || !todaySleep.hours} className="btn-primary w-full sm:w-auto mt-6">
          {saving ? "Saving..." : "Save sleep"}
        </button>
      </form>

      <div className="card">
        <h2 className="card-title mb-4">History</h2>
        {sleepData.length === 0 ? (
          <EmptyState compact icon={Moon} title="No sleep logged yet" description="Log last night's sleep above to see your trends." />
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sleepData.map((entry) => {
              const good = entry.hours >= 7;
              return (
                <li key={entry.date} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(entry.date, { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <div className="flex items-center gap-0.5 mt-1" aria-label={`Quality ${entry.quality || 0} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          aria-hidden="true"
                          className={`w-4 h-4 ${
                            i < entry.quality ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{entry.hours} h</span>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        good
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      }`}
                    >
                      {good ? "Good" : "Below 7h"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Page>
  );
};

export default Sleep;
