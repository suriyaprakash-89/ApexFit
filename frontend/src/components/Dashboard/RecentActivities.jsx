// frontend/src/components/Dashboard/RecentActivities.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import EmptyState from "../UI/EmptyState";
import { activityEmoji } from "../../utils/goals";
import { formatDate, isToday } from "../../utils/date";

const RecentActivities = ({ activities }) => {
  if (!activities?.length) {
    return (
      <EmptyState
        compact
        icon={Activity}
        title="No activities yet"
        description="Log your first workout to see it here."
        action={
          <Link to="/activities?new=1" className="btn-primary">
            Log activity
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl" aria-hidden="true">
                {activityEmoji(activity.type)}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white capitalize truncate">{activity.type}</p>
                <p className="text-sm text-muted">
                  {activity.duration} min · {isToday(activity.date) ? "Today" : formatDate(activity.date, { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <p className="font-semibold text-primary-600 dark:text-primary-400 shrink-0">{activity.calories} cal</p>
          </li>
        ))}
      </ul>
      <Link to="/activities" className="btn-soft w-full mt-4">
        View all activities
      </Link>
    </div>
  );
};

export default RecentActivities;
