import React, { useEffect, useState } from "react";
import { useActivityStore } from "../store/activityStore";
import ActivityChart from "../components/Dashboard/ActivityChart";
import ProgressOverview from "../components/Dashboard/ProgressOverview";
import RecentActivities from "../components/Dashboard/RecentActivities";
import WaterIntakeTracker from "../components/Dashboard/WaterIntakeTracker";
import GoalModal from "../components/Dashboard/GoalModal";
import { Flame, HeartPulse, Droplets, Moon, Target } from "lucide-react";

const Overview = () => {
  const { activities, steps, sleep, water, goals, fetchDashboardData } =
    useActivityStore();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getTodayDate = () => new Date().toISOString().split("T")[0];

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

  const defaultGoals = { steps: 10000, calories: 2000, sleep: 8, water: 8 };
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

  const statConfig = {
    steps: {
      icon: HeartPulse,
      title: "Daily Steps",
      gradient: "from-blue-500 to-cyan-500",
      unit: "",
    },
    calories: {
      icon: Flame,
      title: "Calories Burned",
      gradient: "from-red-500 to-orange-500",
      unit: "cal",
    },
    sleep: {
      icon: Moon,
      title: "Sleep Quality",
      gradient: "from-purple-500 to-indigo-500",
      unit: "hrs",
    },
    water: {
      icon: Droplets,
      title: "Hydration",
      gradient: "from-teal-500 to-emerald-500",
      unit: "cups",
    },
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { type: "steps", value: todaySteps, statConfig: statConfig.steps },
          {
            type: "calories",
            value: todayCalories,
            statConfig: statConfig.calories,
          },
          { type: "sleep", value: todaySleep, statConfig: statConfig.sleep },
          { type: "water", value: todayWater, statConfig: statConfig.water },
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
                          ? value.toFixed(1)
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
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Weekly Activity Summary
              </h2>
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
                Goals Progress
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
            </div>
            {/* --- MODIFICATION: Pass only the first 3 activities --- */}
            <RecentActivities activities={activities.slice(0, 3)} />
          </div>
        </div>
      </div>
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goalType={selectedGoal?.type}
        currentGoal={selectedGoal?.currentGoal}
        currentValue={selectedGoal?.currentValue}
        icon={selectedGoal?.icon}
      />
    </>
  );
};

export default Overview;
