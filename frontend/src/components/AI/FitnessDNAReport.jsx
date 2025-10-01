// frontend/src/components/AI/FitnessDNAReport.jsx
import React from "react";
import { useTheme } from "../../contexts/ThemeContext"; // Add this import

const FitnessDNAReport = () => {
  const { isDark } = useTheme(); // Add this line

  // Mock fitness data
  const fitnessData = {
    activityLevel: "Moderate",
    sleepQuality: "Good",
    hydration: "Needs Improvement",
    recovery: "Average",
    consistency: "Excellent",
  };

  return (
    <div className="card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md fade-in">
      {" "}
      {/* Added dark:bg-gray-800 */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Fitness DNA Report
      </h3>{" "}
      {/* Added dark:text-white */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-4">
        {" "}
        {/* Added dark:bg-purple-900/20 */}
        <p className="text-purple-800 dark:text-purple-200">
          {" "}
          {/* Added dark:text-purple-200 */}
          Your personalized fitness insights based on your activity patterns
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(fitnessData).map(([key, value]) => (
          <div key={key} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            {" "}
            {/* Added dark:bg-gray-700 */}
            <h4 className="font-medium text-gray-800 dark:text-gray-200 capitalize">
              {" "}
              {/* Added dark:text-gray-200 */}
              {key.replace(/([A-Z])/g, " $1")}
            </h4>
            <p
              className={`mt-2 text-lg font-semibold ${
                value === "Excellent"
                  ? "text-green-600 dark:text-green-400" // Added dark:text-green-400
                  : value === "Good"
                  ? "text-blue-600 dark:text-blue-400" // Added dark:text-blue-400
                  : value === "Average"
                  ? "text-yellow-600 dark:text-yellow-400" // Added dark:text-yellow-400
                  : "text-red-600 dark:text-red-400" // Added dark:text-red-400
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        {" "}
        {/* Added dark:bg-blue-900/20 */}
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Recommendations
        </h4>{" "}
        {/* Added dark:text-blue-200 */}
        <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
          {" "}
          {/* Added dark:text-blue-300 */}
          <li>Increase water intake to at least 8 glasses daily</li>
          <li>Maintain your excellent workout consistency</li>
          <li>Consider adding stretching to improve recovery</li>
          <li>Try to go to bed at the same time each night</li>
        </ul>
      </div>
    </div>
  );
};

export default FitnessDNAReport;
