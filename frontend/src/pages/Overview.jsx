// frontend/src/pages/Overview.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Footprints, Droplets, Moon, Target, Plus, RefreshCw, Brain } from "lucide-react";
import { useActivityStore } from "../store/activityStore";
import { useAuthStore } from "../store/authStore";
import ActivityChart from "../components/Dashboard/ActivityChart";
import ProgressOverview from "../components/Dashboard/ProgressOverview";
import RecentActivities from "../components/Dashboard/RecentActivities";
import WaterIntakeTracker from "../components/Dashboard/WaterIntakeTracker";
import GoalModal from "../components/Dashboard/GoalModal";
import Page from "../components/UI/Page";
import { SkeletonStatGrid, SkeletonCard } from "../components/UI/Skeleton";
import { localDate, getGreeting } from "../utils/date";
import { getGoalTarget, percentOf } from "../utils/goals";

const STAT_CONFIG = [
  { type: "steps", icon: Footprints, title: "Steps", gradient: "from-blue-500 to-cyan-500", unit: "" },
  { type: "calories", icon: Flame, title: "Active calories", gradient: "from-red-500 to-orange-500", unit: "cal" },
  { type: "sleep", icon: Moon, title: "Sleep", gradient: "from-purple-500 to-indigo-500", unit: "hrs" },
  { type: "water", icon: Droplets, title: "Water", gradient: "from-teal-500 to-emerald-500", unit: "glasses" },
];

const Overview = () => {
  const { user } = useAuthStore();
  const { activities, steps, sleep, water, goals, dashboardLoading, dashboardError, fetchDashboardData } =
    useActivityStore();
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const today = localDate();
  const todayValues = {
    steps: steps.find((e) => e.date === today)?.steps || 0,
    calories: activities.filter((a) => a.date === today).reduce((sum, a) => sum + (a.calories || 0), 0),
    sleep: Number(sleep.find((e) => e.date === today)?.hours || 0),
    water: water.find((e) => e.date === today)?.amount || 0,
  };

  const firstName = user?.user_metadata?.name?.split(" ")[0];
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Page
      title={`${getGreeting()}${firstName ? `, ${firstName}` : ""}`}
      documentTitle="Dashboard"
      subtitle={dateLabel}
      actions={
        <Link to="/activities?new=1" className="btn-primary">
          <Plus className="w-5 h-5" aria-hidden="true" />
          Log activity
        </Link>
      }
    >
      {dashboardError && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          <span>{dashboardError}</span>
          <button onClick={fetchDashboardData} className="btn-secondary min-h-[36px] px-3">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {dashboardLoading ? (
        <>
          <SkeletonStatGrid />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <SkeletonCard lines={6} className="lg:col-span-2" />
            <SkeletonCard lines={6} />
          </div>
        </>
      ) : (
        <>
          <section aria-label="Today's progress" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
            {STAT_CONFIG.map(({ type, icon: Icon, title, gradient, unit }) => {
              const value = todayValues[type];
              const goalValue = getGoalTarget(goals, type);
              const percentage = percentOf(value, goalValue);
              const display = type === "sleep" ? value.toFixed(1) : value.toLocaleString();
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedGoal({ type, currentGoal: goalValue, currentValue: value })}
                  className="card !p-4 sm:!p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
                  aria-label={`${title}: ${display} ${unit} of ${goalValue.toLocaleString()} goal, ${percentage}%. Change goal`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      {percentage}%
                    </span>
                  </div>
                  <p className="mt-3 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {display}
                    {unit && <span className="text-xs sm:text-sm font-normal text-muted ml-1">{unit}</span>}
                  </p>
                  <p className="text-xs sm:text-sm text-muted">
                    {title} · goal {goalValue.toLocaleString()}
                  </p>
                  <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2" aria-hidden="true">
                    <div
                      className={`bg-gradient-to-r ${gradient} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="card lg:col-span-2" aria-label="Activity chart">
              <ActivityChart defaultPeriod="week" />
            </section>
            <section className="card" aria-label="Water intake">
              <WaterIntakeTracker />
            </section>

            <section className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="card-title">Goals progress</h2>
                <Target className="w-5 h-5 text-primary-500" aria-hidden="true" />
              </div>
              <ProgressOverview goals={goals} />
            </section>
            <section className="card">
              <h2 className="card-title mb-5">Recent activities</h2>
              <RecentActivities activities={activities.slice(0, 3)} />
            </section>
            <section className="card bg-gradient-to-br from-primary-600 to-teal-600 !border-0 text-white flex flex-col">
              <Brain className="w-8 h-8 mb-3 opacity-90" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Ask your AI coach</h2>
              <p className="mt-1 text-sm text-white/85 flex-1">
                Get advice based on today's steps, sleep and water, not generic tips.
              </p>
              <Link
                to="/coach"
                className="btn mt-4 bg-white text-primary-700 hover:bg-primary-50 self-start"
              >
                Open coach
              </Link>
            </section>
          </div>
        </>
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
