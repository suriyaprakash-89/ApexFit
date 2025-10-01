// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../contexts/ThemeContext";
import toast from "react-hot-toast";
import {
  Save,
  Bell,
  Moon,
  Sun,
  Download,
  Trash2,
  Shield,
  Monitor,
} from "lucide-react";

const Settings = () => {
  const { user } = useAuthStore();
  const { theme, changeTheme } = useTheme();

  const [settings, setSettings] = useState({
    notifications: true,
    water_reminders: true,
    goal_reminders: true,
    theme: "system",
    weekly_report: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [user]);

  useEffect(() => {
    // Sync local settings with theme context
    setSettings((prev) => ({ ...prev, theme }));
  }, [theme]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings(data.settings);
        // Apply the theme from database
        if (data.settings.theme) {
          changeTheme(data.settings.theme);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          settings: settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) throw error;

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      // Fetch all user data
      const [activities, steps, sleep, water, goals] = await Promise.all([
        supabase.from("activities").select("*").eq("user_id", user.id),
        supabase.from("steps").select("*").eq("user_id", user.id),
        supabase.from("sleep").select("*").eq("user_id", user.id),
        supabase.from("water").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
      ]);

      // Combine all data
      const allData = {
        activities: activities.data,
        steps: steps.data,
        sleep: sleep.data,
        water: water.data,
        goals: goals.data,
        exported_at: new Date().toISOString(),
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(allData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
        dataStr
      )}`;

      const exportFileDefaultName = `fitness_data_${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone!"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) throw error;

      // This will trigger the cascade delete for all user data
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (authError) throw authError;

      toast.success("Account deleted successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
    setSettings({ ...settings, theme: newTheme });
  };

  const getThemeIcon = () => {
    switch (settings.theme) {
      case "dark":
        return <Moon className="w-5 h-5 mr-2" />;
      case "light":
        return <Sun className="w-5 h-5 mr-2" />;
      default:
        return <Monitor className="w-5 h-5 mr-2" />;
    }
  };

  const getThemeLabel = () => {
    switch (settings.theme) {
      case "dark":
        return "Dark";
      case "light":
        return "Light";
      default:
        return "System Default";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Settings
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-white">
                Enable notifications
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive app notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) =>
                  setSettings({ ...settings, notifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-white">Water reminders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remind me to drink water
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.water_reminders}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    water_reminders: e.target.checked,
                  })
                }
                className="sr-only peer"
                disabled={!settings.notifications}
              />
              <div
                className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${
                  settings.notifications
                    ? "peer-checked:bg-blue-600"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              ></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-white">Goal reminders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remind me about my goals
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.goal_reminders}
                onChange={(e) =>
                  setSettings({ ...settings, goal_reminders: e.target.checked })
                }
                className="sr-only peer"
                disabled={!settings.notifications}
              />
              <div
                className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${
                  settings.notifications
                    ? "peer-checked:bg-blue-600"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              ></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-white">Weekly reports</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send me weekly progress reports
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.weekly_report}
                onChange={(e) =>
                  setSettings({ ...settings, weekly_report: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
          {getThemeIcon()}
          Appearance - {getThemeLabel()}
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-800 dark:text-white">Theme</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose your preferred theme
            </p>
          </div>
        </div>

        {/* Three-way theme toggle */}
        <div className="mt-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
          <button
            onClick={() => handleThemeChange("light")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              settings.theme === "light"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Sun className="w-4 h-4 mx-auto mb-1" />
            Light
          </button>

          <button
            onClick={() => handleThemeChange("system")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors mx-1 ${
              settings.theme === "system"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Monitor className="w-4 h-4 mx-auto mb-1" />
            System
          </button>

          <button
            onClick={() => handleThemeChange("dark")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              settings.theme === "dark"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Moon className="w-4 h-4 mx-auto mb-1" />
            Dark
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Data Management
        </h2>

        <button
          onClick={exportData}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
        >
          Export All Data (JSON)
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Download a copy of all your fitness data for backup or analysis.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Account
        </h2>

        <button
          onClick={deleteAccount}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Delete Account
        </button>

        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
          Warning: This action cannot be undone. All your data will be
          permanently deleted.
        </p>
      </div>

      <button
        onClick={saveSettings}
        disabled={loading}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
      >
        <Save className="w-5 h-5 mr-2" />
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default Settings;
