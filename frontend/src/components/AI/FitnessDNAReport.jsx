// frontend/src/components/AI/FitnessDNAReport.jsx
// 30-day "Fitness DNA" report: ratings are computed from real data on the server,
// the AI writes the summary/notes/recommendations (cached once per day).
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Moon,
  Droplets,
  CalendarCheck,
  HeartPulse,
  RefreshCw,
  Sparkles,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import toast from "@/lib/toast";
import { apiJson, withClientDate } from "../../lib/api";
import EmptyState from "../UI/EmptyState";
import { SkeletonCard, SkeletonStatGrid } from "../UI/Skeleton";
import { formatDate } from "../../utils/date";

const DIMENSIONS = [
  { key: "activity", label: "Activity", icon: Activity },
  { key: "sleep", label: "Sleep", icon: Moon },
  { key: "hydration", label: "Hydration", icon: Droplets },
  { key: "consistency", label: "Consistency", icon: CalendarCheck },
  { key: "recovery", label: "Recovery", icon: HeartPulse },
];

const RATING_STYLES = {
  Excellent: "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40",
  Good: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40",
  Average: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40",
  "Needs Improvement": "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40",
  "Not enough data": "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700",
};

const fmt = (value, digits = 0) =>
  value == null ? "–" : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

const FitnessDNAReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await apiJson(`/api/ai/insights?${withClientDate(refresh ? { refresh: "1" } : {})}`);
      setReport(data);
      if (refresh) toast.success("Insights refreshed");
    } catch (err) {
      if (refresh) toast.error(err.message);
      else setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading insights">
        <SkeletonCard lines={3} />
        <SkeletonStatGrid />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <EmptyState
          icon={BarChart3}
          title="Couldn't load your insights"
          description={error}
          action={
            <button onClick={() => load()} className="btn-primary">
              Try again
            </button>
          }
        />
      </div>
    );
  }

  if (report?.empty) {
    return (
      <div className="card">
        <EmptyState
          icon={Sparkles}
          title="Your Fitness DNA needs some data"
          description="Log steps, sleep, water or a workout and your personalised 30-day report will appear here."
          action={
            <Link to="/activities?new=1" className="btn-primary">
              Log an activity
            </Link>
          }
        />
      </div>
    );
  }

  const p = report.period;
  const stats = [
    { label: "Avg daily steps", value: fmt(p.avgSteps), sub: `${p.daysWithSteps} days logged` },
    { label: "Workouts", value: fmt(p.workouts), sub: `${fmt(p.totalActiveMinutes)} active min` },
    { label: "Avg sleep", value: p.avgSleepHours == null ? "–" : `${fmt(p.avgSleepHours, 1)} h`, sub: `${p.nightsLogged} nights logged` },
    { label: "Avg water", value: p.avgWaterGlasses == null ? "–" : `${fmt(p.avgWaterGlasses, 1)}`, sub: `glasses · goal ${report.goals.water}` },
  ];

  return (
    <div className="space-y-6">
      <section className="card ambient border-primary/25">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-foreground">Your last 30 days</h2>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-soft min-h-[36px] px-3"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <p className="mt-3 leading-relaxed text-foreground/90">
          {report.summary ||
            "Here's how your activity, sleep and hydration have looked over the last month."}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {report.aiGenerated ? "Written by your AI coach from your logs" : "Based on your logs"} · updated{" "}
          {formatDate(report.generatedFor, { month: "short", day: "numeric" })}
        </p>
      </section>

      <section aria-label="30-day stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((s) => (
          <div key={s.label} className="card !p-4 sm:!p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="stat-number mt-1 text-2xl text-foreground">{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </section>

      <section aria-label="Ratings" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DIMENSIONS.map(({ key, label, icon: Icon }) => {
          const rating = report.scores?.[key] || "Not enough data";
          return (
            <div key={key} className="card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <h3 className="font-semibold text-foreground">{label}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RATING_STYLES[rating] || RATING_STYLES["Not enough data"]}`}>
                  {rating}
                </span>
              </div>
              {report.notes?.[key] && <p className="mt-3 text-sm text-muted">{report.notes[key]}</p>}
            </div>
          );
        })}
      </section>

      <section className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <h2 className="card-title">Recommendations</h2>
        </div>
        <ol className="space-y-3">
          {report.recommendations.map((rec, i) => (
            <li key={rec} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
            </li>
          ))}
        </ol>
        <Link to="/coach" className="btn-soft mt-5">
          Discuss with your coach
        </Link>
      </section>
    </div>
  );
};

export default FitnessDNAReport;
