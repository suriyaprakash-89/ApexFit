import React from "react";
import { Link } from "react-router-dom";

const RecentActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case "running":
        return "🏃‍♂️";
      case "walking":
        return "🚶‍♂️";
      case "cycling":
        return "🚴‍♂️";
      case "swimming":
        return "🏊‍♂️";
      case "gym":
        return "💪";
      case "yoga":
        return "🧘‍♂️";
      default:
        return "🏅";
    }
  };

  // --- NEW FUNCTION TO FORMAT DATE AND TIME ---
  const formatDateTime = (timestampString) => {
    if (!timestampString) return "Just now"; // Fallback for new activities

    return new Date(timestampString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true, // Use AM/PM
    });
  };

  return (
    <div>
      {activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {getActivityIcon(activity.type)}
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {activity.type}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {/* --- FIX: Use the new function and the correct field --- */}
                    {activity.duration} min •{" "}
                    {formatDateTime(activity.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {activity.calories} cal
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No activities logged yet.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Click 'Log Activity' to get started!
          </p>
        </div>
      )}

      {activities && activities.length > 0 && (
        <Link
          to="/activities"
          className="block w-full text-center mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-2 px-4 rounded-md transition-colors font-semibold"
        >
          View All Activities
        </Link>
      )}
    </div>
  );
};

export default RecentActivities;
