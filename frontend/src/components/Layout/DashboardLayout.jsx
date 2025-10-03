// frontend/src/pages/DashboardLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Activity, Brain, Trophy, BarChart3, Box, Plus } from "lucide-react";

const DashboardLayout = () => {
  const { user } = useAuthStore();

  const tabConfig = [
    { to: "/dashboard/overview", icon: Activity, label: "Overview" },
    { to: "/dashboard/ai-coach", icon: Brain, label: "AI Coach" },
    { to: "/dashboard/challenges", icon: Trophy, label: "Challenges" },
    { to: "/dashboard/insights", icon: BarChart3, label: "Insights" },
    { to: "/dashboard/ar-fitness", icon: Box, label: "AR Fitness" },
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Good morning,{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {user?.user_metadata?.name || "there"}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button className="mt-4 md:mt-0 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition-colors shadow-md">
            <Plus className="w-5 h-5" />
            <span>Log Activity</span>
          </button>
        </div>

        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {tabConfig.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `py-3 px-1 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* This is where the content for each sub-page will be rendered */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
