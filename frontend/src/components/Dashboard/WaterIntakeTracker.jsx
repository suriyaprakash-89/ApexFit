// frontend/src/components/Dashboard/WaterIntakeTracker.jsx
import React, { useEffect, useState } from "react";
import { useActivityStore } from "../../store/activityStore";
import toast from "react-hot-toast";

const WaterIntakeTracker = () => {
  const [todayWater, setTodayWater] = useState(0);
  const { water, addWaterIntake, goals } = useActivityStore();

  // Conversion factor: 1 glass = 0.25 liters (standard glass size)
  const GLASS_TO_LITER = 0.25;

  // Get today's water intake from the store
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayEntry = water.find((entry) => entry.date === today);
    setTodayWater(todayEntry?.amount || 0);
  }, [water]);

  // Get water goal from database
  const getWaterGoal = () => {
    const waterGoal = goals.find((g) => g.goal_type === "water");
    return waterGoal?.target_value || 15; // Default to 15 glasses (3.75L)
  };

  const waterGoalGlasses = getWaterGoal();
  const waterGoalLiters = (waterGoalGlasses * GLASS_TO_LITER).toFixed(1);

  const todayWaterLiters = (todayWater * GLASS_TO_LITER).toFixed(1);

  const handleAddWater = async (glassesToAdd) => {
    try {
      // Check if adding these glasses would exceed the maximum of 20
      if (todayWater + glassesToAdd > 20) {
        toast.error("Maximum water intake is 20 glasses per day");
        return;
      }

      await addWaterIntake(glassesToAdd);
      toast.success(
        `Added ${glassesToAdd} glass${glassesToAdd > 1 ? "es" : ""} (${(
          glassesToAdd * GLASS_TO_LITER
        ).toFixed(1)}L) of water!`
      );
    } catch (error) {
      toast.error("Failed to track water intake");
    }
  };

  const percentage = Math.min(
    Math.round((todayWater / waterGoalGlasses) * 100),
    100
  );

  // Get hydration status message
  const getHydrationStatus = () => {
    if (percentage >= 100) return "Excellent hydration! 💪";
    if (percentage >= 75) return "Great job! Almost there! 👍";
    if (percentage >= 50) return "Good progress! Keep going! 💧";
    if (percentage >= 25) return "Getting started! Stay hydrated! 🌊";
    return "Time to hydrate! Your body needs water! ⚡";
  };

  // Create water glasses array based on the goal, max 20
  const waterGlasses = Array.from(
    { length: Math.min(waterGoalGlasses, 20) },
    (_, i) => i + 1
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold text-gray-900 dark:text-white">
          Water Intake
        </h3>
        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-300 text-xs">💧</span>
        </div>
      </div>

      {/* Main water intake display */}
      <div className="text-center mb-2">
        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
          {todayWaterLiters}L
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {todayWater} glass{todayWater !== 1 ? "es" : ""} today
        </p>
      </div>

      {/* Goal progress - Replaced circle with compact bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Goal Progress</span>
          <span>
            {todayWater}/{waterGoalGlasses} glasses
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium text-center">
          {getHydrationStatus()}
        </p>
      </div>

      {/* Water glasses grid */}
      <div className="mb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">
          Track your glasses
        </p>
        <div className="grid grid-cols-8 gap-1">
          {waterGlasses.map((glass) => (
            <button
              key={glass}
              onClick={() => handleAddWater(1)}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${
                todayWater >= glass
                  ? "bg-blue-500 text-white shadow-md transform scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:scale-110"
              }`}
            >
              {glass}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          onClick={() => handleAddWater(1)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs font-medium transition-colors flex items-center justify-center"
        >
          <span className="mr-1">+1</span>
          <span>Glass</span>
        </button>
        <button
          onClick={() => handleAddWater(2)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs font-medium transition-colors flex items-center justify-center"
        >
          <span className="mr-1">+2</span>
          <span>Glasses</span>
        </button>
      </div>

      {/* Hydration tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs mt-auto">
        <div className="flex items-start">
          <span className="text-blue-500 mr-1 text-xs">💡</span>
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Hydration Tips
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-0.5">
              {percentage < 50
                ? "Drink a glass after each meal"
                : percentage < 80
                ? "Keep a water bottle nearby"
                : "You're doing great! Maintain consistency"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily recommendation */}
      <div className="mt-1 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Recommended: 2-4L daily
        </p>
      </div>
    </div>
  );
};

export default WaterIntakeTracker;
