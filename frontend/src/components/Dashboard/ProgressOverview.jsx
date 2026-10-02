// frontend/src/components/Dashboard/ProgressOverview.jsx
// Goals with live progress from GET /api/goals/progress (computed from today's logs).
import React from "react";
import { Link } from "react-router-dom";
import { Target, Check } from "lucide-react";
import EmptyState from "../UI/EmptyState";
import { Skeleton } from "../UI/Skeleton";
import { GOAL_TYPES } from "../../utils/goals";

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });

const ProgressOverview = ({ goals, loading, error, onRetry }) => {
  // Unfinished goals first, then up to 4 in total
  const shown = [...goals].sort((a, b) => Number(a.done) - Number(b.done)).slice(0, 4);

  if (loading) {
    return (
      <div className="space-y-5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-2.5 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error && !goals.length) {
    return (
      <p className="text-sm text-muted">
        Couldn't load goal progress.{" "}
        <button onClick={onRetry} className="font-semibold underline">
          Try again
        </button>
      </p>
    );
  }

  return (
    <div>
      {shown.length > 0 ? (
        <ul className="space-y-4">
          {shown.map((goal) => {
            const type = GOAL_TYPES[goal.goal_type] || { label: goal.goal_type, unit: "", icon: "🎯" };
            return (
              <li key={goal.id}>
                <div className="flex justify-between gap-2 text-sm mb-1.5 font-medium">
                  <span className="text-gray-700 dark:text-gray-300 flex items-center min-w-0">
                    <span className="text-lg mr-2" aria-hidden="true">
                      {type.icon}
                    </span>
                    <span className="truncate">{type.label}</span>
                    {goal.done && <Check className="w-4 h-4 ml-1.5 text-green-600 shrink-0" aria-label="done" />}
                  </span>
                  <span className="text-muted shrink-0">
                    {goal.current_value == null ? "–" : fmt(goal.current_value)} / {fmt(goal.target_value)} {type.unit}
                  </span>
                </div>
                <div
                  className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
                  role="progressbar"
                  aria-valuenow={goal.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${type.label} progress ${goal.period}`}
                >
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${goal.done ? "bg-green-500" : "bg-primary-600"}`}
                    style={{ width: `${goal.percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-1 capitalize">{goal.period}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact icon={Target} title="No goals yet" description="Set a goal and your progress updates automatically as you log." />
      )}

      <Link to="/goals" className="btn-soft w-full mt-6">
        {shown.length > 0 ? "Manage goals" : "Set a goal"}
      </Link>
    </div>
  );
};

export default ProgressOverview;
