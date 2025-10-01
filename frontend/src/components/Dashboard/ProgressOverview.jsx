// frontend/src/components/Dashboard/ProgressOverview.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const ProgressOverview = ({ goals }) => {
  const navigate = useNavigate();

  const getGoalIcon = (type) => {
    switch (type) {
      case "steps":
        return "👣";
      case "water":
        return "💧";
      case "sleep":
        return "😴";
      case "calories":
        return "🔥";
      default:
        return "🎯";
    }
  };

  const getGoalName = (type) => {
    switch (type) {
      case "steps":
        return "Daily Steps";
      case "water":
        return "Water Intake";
      case "sleep":
        return "Sleep Hours";
      case "calories":
        return "Calories Burned";
      default:
        return type;
    }
  };

  const getGoalUnit = (type) => {
    switch (type) {
      case "steps":
        return "steps";
      case "water":
        return "glasses";
      case "sleep":
        return "hours";
      case "calories":
        return "cal";
      default:
        return "";
    }
  };

  // Get only active goals (not achieved) or show empty state
  const activeGoals = goals.filter((goal) => !goal.achieved).slice(0, 3);

  const handleSetNewGoal = () => {
    navigate("/goals");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Goals Progress
      </h3>

      <div className="space-y-4">
        {activeGoals.length > 0 ? (
          activeGoals.map((goal) => {
            const percentage = Math.min(
              Math.round((goal.current_value / goal.target_value) * 100),
              100
            );

            return (
              <div key={goal.id} className="flex items-center space-x-4">
                <span className="text-2xl">{getGoalIcon(goal.goal_type)}</span>

                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">
                      {getGoalName(goal.goal_type)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {goal.current_value}/{goal.target_value}{" "}
                      {getGoalUnit(goal.goal_type)}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {percentage}% complete
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No active goals. Set your first goal to track your progress!
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleSetNewGoal}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
      >
        Set New Goal
      </button>
    </div>
  );
};

export default ProgressOverview;
