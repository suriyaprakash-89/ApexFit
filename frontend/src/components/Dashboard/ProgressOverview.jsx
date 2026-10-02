// frontend/src/components/Dashboard/ProgressOverview.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import EmptyState from "../UI/EmptyState";
import { GOAL_TYPES, percentOf } from "../../utils/goals";

const ProgressOverview = ({ goals }) => {
  // Show the first 3 active goals
  const activeGoals = goals.filter((goal) => !goal.achieved).slice(0, 3);

  return (
    <div>
      {activeGoals.length > 0 ? (
        <ul className="space-y-4">
          {activeGoals.map((goal) => {
            const type = GOAL_TYPES[goal.goal_type] || { label: goal.goal_type, unit: "", icon: "🎯" };
            const current = Number(goal.current_value || 0);
            const target = Number(goal.target_value);
            const percentage = percentOf(current, target);
            return (
              <li key={goal.id}>
                <div className="flex justify-between gap-2 text-sm mb-1.5 font-medium">
                  <span className="text-gray-700 dark:text-gray-300 flex items-center min-w-0">
                    <span className="text-lg mr-2" aria-hidden="true">
                      {type.icon}
                    </span>
                    <span className="truncate">{type.label}</span>
                  </span>
                  <span className="text-muted shrink-0">
                    {current.toLocaleString()} / {target.toLocaleString()} {type.unit}
                  </span>
                </div>
                <div
                  className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${type.label} progress`}
                >
                  <div
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact icon={Target} title="No active goals" description="Set a goal to start tracking your progress." />
      )}

      <Link to="/goals" className="btn-soft w-full mt-6">
        {activeGoals.length > 0 ? "Manage goals" : "Set a goal"}
      </Link>
    </div>
  );
};

export default ProgressOverview;
