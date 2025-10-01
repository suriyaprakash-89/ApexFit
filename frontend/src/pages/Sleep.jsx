// frontend/src/pages/Sleep.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { Moon, Star, Plus, Calendar } from "lucide-react";

const Sleep = () => {
  const { user } = useAuthStore();
  const [sleepData, setSleepData] = useState([]);
  const [todaySleep, setTodaySleep] = useState({ hours: "", quality: 3 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchSleepData();
  }, [user]);

  const fetchSleepData = async () => {
    try {
      const { data, error } = await supabase
        .from("sleep")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;

      // Check if today's data exists
      const today = new Date().toISOString().split("T")[0];
      const todayEntry = data?.find((entry) => entry.date === today);

      if (todayEntry) {
        setTodaySleep({ hours: todayEntry.hours, quality: todayEntry.quality });
      }

      setSleepData(data || []);
    } catch (error) {
      console.error("Error fetching sleep data:", error);
      toast.error("Failed to load sleep data");
    }
  };

  const logSleep = async () => {
    if (!todaySleep.hours || todaySleep.hours < 0 || todaySleep.hours > 24) {
      toast.error("Please enter valid sleep hours (0-24)");
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("sleep").upsert(
        {
          hours: parseFloat(todaySleep.hours),
          quality: todaySleep.quality,
          date: today,
          user_id: user.id,
        },
        { onConflict: "user_id,date" }
      );

      if (error) throw error;

      toast.success("Sleep logged successfully!");
      fetchSleepData();
    } catch (error) {
      console.error("Error logging sleep:", error);
      toast.error("Failed to log sleep");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = () => {
    if (sleepData.length === 0) return { avgHours: 0, avgQuality: 0 };

    const totalHours = sleepData.reduce(
      (sum, entry) => sum + parseFloat(entry.hours),
      0
    );
    const totalQuality = sleepData.reduce(
      (sum, entry) => sum + (entry.quality || 0),
      0
    );

    return {
      avgHours: (totalHours / sleepData.length).toFixed(1),
      avgQuality: (totalQuality / sleepData.length).toFixed(1),
    };
  };

  const averages = calculateAverages();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Moon className="w-8 h-8 text-purple-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Sleep Tracking
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {todaySleep.hours || "0"}h
          </div>
          <p className="text-gray-600 dark:text-gray-400">Last Night's Sleep</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {averages.avgHours}h
          </div>
          <p className="text-gray-600 dark:text-gray-400">Average Sleep</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
            {averages.avgQuality}/5
          </div>
          <p className="text-gray-600 dark:text-gray-400">Avg Quality</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Log Today's Sleep
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sleep Duration (hours)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="24"
              value={todaySleep.hours}
              onChange={(e) =>
                setTodaySleep({ ...todaySleep, hours: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="7.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sleep Quality (1-5)
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    setTodaySleep({ ...todaySleep, quality: rating })
                  }
                  className={`p-2 rounded-full ${
                    todaySleep.quality === rating
                      ? "bg-yellow-400 text-black"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {todaySleep.quality === 1 && "Very poor"}
              {todaySleep.quality === 2 && "Poor"}
              {todaySleep.quality === 3 && "Average"}
              {todaySleep.quality === 4 && "Good"}
              {todaySleep.quality === 5 && "Excellent"}
            </p>
          </div>
        </div>

        <button
          onClick={logSleep}
          disabled={loading || !todaySleep.hours}
          className="w-full mt-6 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging Sleep..." : "Log Sleep"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Sleep History
        </h2>

        {sleepData.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No sleep data recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Duration
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Quality
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sleepData.map((entry) => (
                  <tr key={entry.date}>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {entry.hours} hours
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < entry.quality
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          entry.hours >= 7
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {entry.hours >= 7 ? "Good" : "Needs improvement"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sleep;
