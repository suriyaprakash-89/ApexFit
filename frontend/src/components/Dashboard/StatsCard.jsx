// frontend/src/components/Dashboard/StatsCard.jsx
import React from "react";

const StatsCard = ({ title, value, goal, icon, color }) => {
  // Convert value to number if it's a string with commas
  const numericValue =
    typeof value === "string" ? parseInt(value.replace(/,/g, "")) : value;

  // Handle NaN cases and ensure valid percentage calculation
  const percentage =
    isNaN(numericValue) || isNaN(goal) || goal === 0
      ? 0
      : Math.min(Math.round((numericValue / goal) * 100), 100);

  const colorClasses = {
    blue: "bg-blue-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    teal: "bg-teal-500",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Goal: {goal.toLocaleString()}
        </p>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {percentage}% of goal
      </p>
    </div>
  );
};

export default StatsCard;
