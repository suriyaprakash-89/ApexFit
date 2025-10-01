// frontend/src/components/Dashboard/RecentActivities.jsx
import React from "react";

const RecentActivities = ({ activities }) => {
  const mockActivities = [
    { id: 1, type: "running", duration: 30, calories: 300, date: "2024-01-15" },
    { id: 2, type: "walking", duration: 45, calories: 180, date: "2024-01-14" },
    { id: 3, type: "cycling", duration: 60, calories: 450, date: "2024-01-13" },
    { id: 4, type: "yoga", duration: 40, calories: 150, date: "2024-01-12" },
  ];

  const activityData = activities.length > 0 ? activities : mockActivities;

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activities
      </h3>

      <div className="space-y-3">
        {activityData.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {activity.type}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.duration} min • {formatDate(activity.date)}
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

      <button className="w-full mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-2 px-4 rounded-md transition-colors">
        View All Activities
      </button>
    </div>
  );
};

export default RecentActivities;
