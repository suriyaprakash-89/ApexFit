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

  // Get only the first 3 active goals
  const activeGoals = goals.filter((goal) => !goal.achieved).slice(0, 3);

  const handleSetNewGoal = () => {
    navigate("/goals");
  };

  return (
    <div>
      {activeGoals.length > 0 ? (
        <div className="space-y-4">
          {activeGoals.map((goal) => {
            const percentage = Math.min(
              Math.round((goal.current_value / goal.target_value) * 100),
              100
            );
            return (
              <div key={goal.id}>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span className="text-gray-700 dark:text-gray-300 flex items-center">
                    <span className="text-lg mr-2">
                      {getGoalIcon(goal.goal_type)}
                    </span>
                    {getGoalName(goal.goal_type)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {goal.current_value.toLocaleString()}/
                    {goal.target_value.toLocaleString()}{" "}
                    {getGoalUnit(goal.goal_type)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No active goals. Set your first goal to track your progress!
          </p>
        </div>
      )}

      <button
        onClick={handleSetNewGoal}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
      >
        Set New Goal
      </button>
    </div>
  );
};

export default ProgressOverview;
