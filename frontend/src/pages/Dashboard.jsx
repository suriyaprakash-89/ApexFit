// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useActivityStore } from "../store/activityStore";
import { useAuthStore } from "../store/authStore";
import ActivityChart from "../components/Dashboard/ActivityChart";
import ProgressOverview from "../components/Dashboard/ProgressOverview";
import RecentActivities from "../components/Dashboard/RecentActivities";
import WaterIntakeTracker from "../components/Dashboard/WaterIntakeTracker";
import AIHealthCoach from "../components/AI/AIHealthCoach";
import SocialChallenges from "../components/Social/SocialChallenges";
import FitnessDNAReport from "../components/AI/FitnessDNAReport";
import ARFitnessChallenge from "../components/AR/ARFitnessChallenge";
import GoalModal from "../components/Dashboard/GoalModal";
import {
  Activity,
  Brain,
  BarChart3,
  Box,
  Trophy,
  Calendar,
  Sparkles,
  Flame,
  HeartPulse,
  Droplets,
  Moon,
  User,
  Bell,
  Plus,
  Target,
} from "lucide-react";

const Dashboard = () => {
  const { activities, steps, sleep, water, goals, fetchDashboardData } =
    useActivityStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Calculate TODAY'S totals only (not cumulative)
  const todaySteps =
    steps.find((entry) => entry.date === getTodayDate())?.steps || 0;
  const todayActivities = activities.filter(
    (activity) => activity.date === getTodayDate()
  );
  const todayCalories = todayActivities.reduce(
    (sum, activity) => sum + (activity?.calories || 0),
    0
  );
  const todaySleep =
    sleep.find((entry) => entry.date === getTodayDate())?.hours || 0;
  const todayWater =
    water.find((entry) => entry.date === getTodayDate())?.amount || 0;

  // Default goals if not set in database
  const defaultGoals = {
    steps: 10000,
    calories: 2000,
    sleep: 8,
    water: 8, // Consistent 8 glasses goal
  };

  // Get goal from database or use default - FIXED to be consistent
  const getGoalValue = (goalType) => {
    const goal = goals.find((g) => g.goal_type === goalType);
    return goal?.target_value || defaultGoals[goalType];
  };

  const handleGoalClick = (goalType, currentValue, icon) => {
    setSelectedGoal({
      type: goalType,
      currentGoal: getGoalValue(goalType),
      currentValue,
      icon,
    });
    setIsGoalModalOpen(true);
  };

  const tabConfig = {
    overview: {
      icon: Activity,
      label: "Overview",
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
    },
    "ai-coach": {
      icon: Brain,
      label: "AI Coach",
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
    },
    challenges: {
      icon: Trophy,
      label: "Challenges",
      color: "green",
      gradient: "from-green-500 to-emerald-500",
    },
    insights: {
      icon: BarChart3,
      label: "Insights",
      color: "orange",
      gradient: "from-orange-500 to-amber-500",
    },
    ar: {
      icon: Box,
      label: "AR Fitness",
      color: "pink",
      gradient: "from-rose-500 to-red-500",
    },
  };

  const statConfig = {
    steps: {
      icon: HeartPulse,
      title: "Daily Steps",
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
      unit: "",
    },
    calories: {
      icon: Flame,
      title: "Calories Burned",
      color: "red",
      gradient: "from-red-500 to-orange-500",
      unit: "cal",
    },
    sleep: {
      icon: Moon,
      title: "Sleep Quality",
      color: "purple",
      gradient: "from-purple-500 to-indigo-500",
      unit: "hrs",
    },
    water: {
      icon: Droplets,
      title: "Hydration",
      color: "teal",
      gradient: "from-teal-500 to-emerald-500",
      unit: "cups",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Good morning,{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {user?.user_metadata?.name || "there"}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <button className="mt-4 md:mt-0 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition-colors shadow-md">
            <Plus className="w-5 h-5" />
            <span>Log Activity</span>
          </button>
        </div>

        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {Object.entries(tabConfig).map(([tab, { icon: Icon, label }]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              {
                type: "steps",
                value: todaySteps,
                statConfig: statConfig.steps,
              },
              {
                type: "calories",
                value: todayCalories,
                statConfig: statConfig.calories,
              },
              {
                type: "sleep",
                value: todaySleep,
                statConfig: statConfig.sleep,
              },
              {
                type: "water",
                value: todayWater,
                statConfig: statConfig.water,
              },
            ].map(
              ({
                type,
                value,
                statConfig: { icon: Icon, title, gradient, unit },
              }) => {
                const goalValue = getGoalValue(type);
                const percentage = Math.min(
                  Math.round((value / goalValue) * 100),
                  100
                );

                return (
                  <div
                    key={type}
                    className="cursor-pointer group transform hover:scale-[1.02] transition-all duration-300"
                    onClick={() => handleGoalClick(type, value, "")}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md transition-all duration-300 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center shadow-md`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {type === "sleep"
                              ? `${value.toFixed(1)}`
                              : value.toLocaleString()}
                            {unit && (
                              <span className="text-sm font-normal ml-1">
                                {unit}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {title}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            Goal: {goalValue.toLocaleString()}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${gradient} h-2 rounded-full transition-all duration-1000`}
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Weekly Activity Summary
                    </h2>
                    <div className="flex space-x-2">
                      <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                        Week
                      </button>
                      <button className="text-xs px-3 py-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        Month
                      </button>
                    </div>
                  </div>
                  <ActivityChart period="week" />
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full">
                  <WaterIntakeTracker />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Progress Overview
                  </h2>
                  <Target className="w-5 h-5 text-indigo-500" />
                </div>
                <ProgressOverview goals={goals} />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Activities
                  </h2>
                  <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                    View All
                  </button>
                </div>
                <RecentActivities activities={activities} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai-coach" && (
          <div className="space-y-6">
            <AIHealthCoach />
            <FitnessDNAReport />
          </div>
        )}

        {activeTab === "challenges" && <SocialChallenges />}
        {activeTab === "insights" && <FitnessDNAReport />}
        {activeTab === "ar" && <ARFitnessChallenge />}
      </main>

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goalType={selectedGoal?.type}
        currentGoal={selectedGoal?.currentGoal}
        currentValue={selectedGoal?.currentValue}
        icon={selectedGoal?.icon}
      />
    </div>
  );
};

export default Dashboard;
