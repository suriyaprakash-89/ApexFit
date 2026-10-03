// frontend/src/pages/Overview.jsx
// The command center: where you stand today, what to do next, and recent momentum.
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Droplets, Dumbbell, Flame, Footprints, Moon, Plus, RefreshCw, Sparkles, Target, Trophy } from "lucide-react";
import { useActivityStore } from "../store/activityStore";
import { useAuthStore } from "../store/authStore";
import { useTrainingStore } from "../store/trainingStore";
import ActivityChart from "../components/Dashboard/ActivityChart";
import ProgressOverview from "../components/Dashboard/ProgressOverview";
import RecentActivities from "../components/Dashboard/RecentActivities";
import WaterIntakeTracker from "../components/Dashboard/WaterIntakeTracker";
import GoalModal from "../components/Dashboard/GoalModal";
import Page from "../components/UI/Page";
import ProgressRing from "../components/UI/ProgressRing";
import { SkeletonStatGrid, SkeletonCard } from "../components/UI/Skeleton";
import { Button } from "@/components/shadcn/button";
import { Progress } from "@/components/shadcn/progress";
import { useCountUp } from "../hooks/useCountUp";
import { localDate, getGreeting, formatDate } from "../utils/date";
import { getGoalTarget, percentOf } from "../utils/goals";
import { formatKg, formatVolume, personalRecords, totalVolume } from "../utils/training";
import { cn } from "@/lib/utils";

const STAT_CONFIG = [
  { type: "steps", icon: Footprints, title: "Steps", color: "hsl(var(--primary))", unit: "" },
  { type: "calories", icon: Flame, title: "Active calories", color: "#ff8a4c", unit: "cal" },
  { type: "sleep", icon: Moon, title: "Sleep", color: "#a78bfa", unit: "hrs" },
  { type: "water", icon: Droplets, title: "Water", color: "#4cc9f0", unit: "glasses" },
];

const COACH_PROMPTS = {
  steps: "I'm behind on my steps today. How can I fit more movement into the rest of my day?",
  calories: "How can I burn a bit more active energy today without overdoing it?",
  sleep: "My sleep is below target. What should I change tonight?",
  water: "I'm behind on water today. Give me a simple plan to catch up.",
};

const CountedNumber = ({ value, decimals = 0 }) => {
  const shown = useCountUp(value);
  return <>{decimals ? shown.toFixed(decimals) : Math.round(shown).toLocaleString()}</>;
};

/* ---------------------------------- Hero ---------------------------------- */
const TodayHero = ({ name, overall, behind, streak }) => {
  const message =
    overall >= 100
      ? "All of today's goals are complete. Nicely done."
      : behind
      ? `Next up: ${behind.title.toLowerCase()}, ${Math.max(0, Math.round(behind.goal - behind.value)).toLocaleString()}${behind.unit ? ` ${behind.unit}` : ""} to go.`
      : "Log something to get today moving.";

  return (
    <section className="card ambient relative overflow-hidden" aria-label="Today at a glance">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ProgressRing percent={overall} size={128} stroke={11} label={`${overall} percent of today's goals complete`}>
          <div className="text-center leading-none">
            <p className="stat-number text-4xl text-foreground">
              <CountedNumber value={overall} />
              <span className="text-lg text-muted-foreground">%</span>
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">today</p>
          </div>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{formatDate(localDate(), { weekday: "long", month: "long", day: "numeric" })}</p>
          <h2 className="mt-1 text-balance font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {getGreeting()}
            {name ? `, ${name}` : ""}.
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2" aria-label={`${streak.count} day streak`}>
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", streak.count > 0 ? "bg-ember-500/15 text-ember-400" : "bg-muted text-muted-foreground")}>
                <Flame className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="leading-tight">
                <p className="stat-number text-lg text-foreground">{streak.loading ? "–" : streak.count}</p>
                <p className="text-[11px] text-muted-foreground">day streak</p>
              </div>
            </div>
            {streak.week.length > 0 && (
              <ol className="flex gap-1.5" aria-label="Last 7 days">
                {streak.week.map((d) => (
                  <li key={d.date} className="flex flex-col items-center gap-1">
                    <span
                      className={cn("h-3.5 w-3.5 rounded-full border", d.logged ? "border-primary bg-primary" : "border-border bg-transparent", d.date === localDate() && !d.logged && "border-dashed")}
                      title={`${formatDate(d.date, { weekday: "long" })}: ${d.logged ? "logged" : "nothing logged"}`}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------ Coach nudge ------------------------------- */
const CoachNudge = ({ behind }) => {
  const prompt = behind ? COACH_PROMPTS[behind.type] : "Give me a quick plan for a great workout today based on my week.";
  return (
    <section className="card flex flex-col border-pulse-500/20 bg-gradient-to-b from-pulse-500/[0.07] to-transparent" aria-label="AI coach">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pulse-500/15 ring-1 ring-pulse-500/30">
          <Brain className="h-5 w-5 text-pulse-400" aria-hidden="true" />
        </span>
        <div>
          <h2 className="card-title">Coach suggestion</h2>
          <p className="text-xs text-muted-foreground">Based on today&apos;s numbers</p>
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
        {behind
          ? `You're furthest from your ${behind.title.toLowerCase()} goal today. Ask the coach for a plan that fits the rest of your day.`
          : "You're on track. Ask the coach what to focus on next, or for a workout that fits the time you have."}
      </p>
      <Button asChild variant="outline" className="mt-5 justify-between">
        <Link to={`/coach?prompt=${encodeURIComponent(prompt)}`}>
          <span className="flex items-center gap-2">
            <Sparkles aria-hidden="true" /> Ask the coach
          </span>
        </Link>
      </Button>
    </section>
  );
};

/* ----------------------------- Training summary ---------------------------- */
const TrainingCard = () => {
  const { workouts, sets, workoutsLoading, workoutsError } = useTrainingStore();
  const records = useMemo(() => personalRecords(sets).slice(0, 3), [sets]);
  const last = workouts[0];

  return (
    <section className="card flex flex-col" aria-label="Training">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="card-title">Training</h2>
        <Dumbbell className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      {workoutsLoading ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="skeleton h-14" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      ) : workoutsError ? (
        <p className="flex-1 text-sm text-muted-foreground">
          {workoutsError === "setup" ? "Workout tracking is waiting on a database update." : "Couldn't load your workouts right now."}
        </p>
      ) : !last ? (
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">No workouts logged yet. Track sets, reps and weight and ApeXfit will spot your records.</p>
          <Button asChild className="mt-4">
            <Link to="/workouts?new=1">
              <Plus aria-hidden="true" /> Log a workout
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          <Link to="/workouts" className="block rounded-xl border border-border bg-background/50 p-3.5 transition-colors hover:bg-accent/40">
            <p className="eyebrow">Last session</p>
            <p className="mt-1 truncate font-display font-semibold text-foreground">{last.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(last.date, { weekday: "short", month: "short", day: "numeric" })} · {last.sets.length} sets · {formatVolume(totalVolume(last.sets))}
            </p>
          </Link>
          {records.length > 0 && (
            <div>
              <p className="eyebrow mb-2 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Top lifts
              </p>
              <ul className="space-y-1.5">
                {records.map((r) => (
                  <li key={r.exercise} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{r.exercise}</span>
                    <span className="stat-number shrink-0 text-primary">{r.maxWeight ? formatKg(r.maxWeight) : `${r.maxWeightReps} reps`}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to="/workouts?new=1">
              <Plus aria-hidden="true" /> Log workout
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
};

/* ---------------------------------- Page ---------------------------------- */
const Overview = () => {
  const user = useAuthStore((s) => s.user);
  const {
    activities,
    steps,
    sleep,
    water,
    goals,
    goalProgress,
    goalProgressLoading,
    goalProgressError,
    dashboardLoading,
    dashboardError,
    streak,
    fetchDashboardData,
    fetchGoalProgress,
  } = useActivityStore();
  const fetchWorkouts = useTrainingStore((s) => s.fetchWorkouts);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchGoalProgress();
    fetchWorkouts();
  }, [fetchDashboardData, fetchGoalProgress, fetchWorkouts]);

  const today = localDate();
  const todayValues = {
    steps: steps.find((e) => e.date === today)?.steps || 0,
    calories: activities.filter((a) => a.date === today).reduce((sum, a) => sum + (a.calories || 0), 0),
    sleep: Number(sleep.find((e) => e.date === today)?.hours || 0),
    water: water.find((e) => e.date === today)?.amount || 0,
  };

  const metrics = STAT_CONFIG.map((cfg) => {
    const goal = getGoalTarget(goals, cfg.type);
    const value = todayValues[cfg.type];
    return { ...cfg, goal, value, pct: percentOf(value, goal) };
  });
  const overall = Math.round(metrics.reduce((sum, m) => sum + Math.min(100, m.pct), 0) / metrics.length);
  const behind = metrics.some((m) => m.pct < 100) ? [...metrics].sort((a, b) => a.pct - b.pct)[0] : null;

  const firstName = user?.user_metadata?.name?.split(" ")[0];

  return (
    <Page
      title="Dashboard"
      documentTitle="Dashboard"
      actions={
        <>
          <Button asChild variant="outline">
            <Link to="/activities?new=1">
              <Plus aria-hidden="true" /> Log activity
            </Link>
          </Button>
          <Button asChild>
            <Link to="/workouts?new=1">
              <Dumbbell aria-hidden="true" /> Log workout
            </Link>
          </Button>
        </>
      }
    >
      {dashboardError && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{dashboardError}</span>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw aria-hidden="true" /> Retry
          </Button>
        </div>
      )}

      {dashboardLoading ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SkeletonCard lines={5} className="lg:col-span-2" />
            <SkeletonCard lines={5} />
          </div>
          <div className="mt-6">
            <SkeletonStatGrid />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SkeletonCard lines={6} className="lg:col-span-2" />
            <SkeletonCard lines={6} />
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TodayHero name={firstName} overall={overall} behind={behind} streak={streak} />
            </div>
            <CoachNudge behind={behind} />
          </div>

          <section aria-label="Today's progress" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {metrics.map(({ type, icon: Icon, title, color, unit, goal, value, pct }) => {
              const display = type === "sleep" ? value.toFixed(1) : value.toLocaleString();
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedGoal({ type, currentGoal: goal, currentValue: value })}
                  className="card group !p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:!p-5"
                  aria-label={`${title}: ${display} ${unit} of ${goal.toLocaleString()} goal, ${pct}%. Change goal`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5" style={{ color }} aria-hidden="true" />
                    <span className="stat-number text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <p className="stat-number mt-3 text-2xl text-foreground sm:text-3xl">
                    {display}
                    {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {title} · goal {goal.toLocaleString()}
                  </p>
                  <Progress className="mt-3 h-1.5" value={pct} indicatorStyle={{ background: color }} aria-hidden="true" />
                </button>
              );
            })}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="card lg:col-span-2" aria-label="Activity chart">
              <ActivityChart defaultPeriod="week" />
            </section>
            <section className="card" aria-label="Water intake">
              <WaterIntakeTracker />
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <TrainingCard />
            <section className="card">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="card-title">Goals progress</h2>
                <Target className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <ProgressOverview goals={goalProgress} loading={goalProgressLoading} error={goalProgressError} onRetry={fetchGoalProgress} />
            </section>
            <section className="card md:col-span-2 lg:col-span-1">
              <h2 className="card-title mb-5">Recent activities</h2>
              <RecentActivities activities={activities.slice(0, 4)} />
            </section>
          </div>
        </div>
      )}

      <GoalModal
        isOpen={Boolean(selectedGoal)}
        onClose={() => setSelectedGoal(null)}
        goalType={selectedGoal?.type}
        currentGoal={selectedGoal?.currentGoal}
        currentValue={selectedGoal?.currentValue}
      />
    </Page>
  );
};

export default Overview;
