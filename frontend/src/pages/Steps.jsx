// frontend/src/pages/Steps.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { Footprints, Plus, TrendingUp } from "lucide-react";

const Steps = () => {
  const { user } = useAuthStore();
  const [steps, setSteps] = useState([]);
  const [todaySteps, setTodaySteps] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchSteps();
  }, [user]);

  const fetchSteps = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data: stepsData, error } = await supabase
        .from("steps")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;

      const { data: todayData } = await supabase
        .from("steps")
        .select("steps")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      setSteps(stepsData || []);
      setTodaySteps(todayData?.steps || 0);
    } catch (error) {
      console.error("Error fetching steps:", error);
      toast.error("Failed to load steps data");
    }
  };

  const updateSteps = async (newSteps) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("steps").upsert(
        {
          steps: newSteps,
          date: today,
          user_id: user.id,
        },
        { onConflict: "user_id,date" }
      );

      if (error) throw error;

      setTodaySteps(newSteps);
      toast.success("Steps updated successfully!");
      fetchSteps();
    } catch (error) {
      toast.error("Failed to update steps");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Footprints className="w-8 h-8 text-blue-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Step Tracking
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {todaySteps.toLocaleString()}
          </div>
          <p className="text-gray-600 dark:text-gray-400">Today's Steps</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
            {Math.round((todaySteps / 10000) * 100)}%
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Daily Goal (10,000 steps)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {steps
              .reduce((total, day) => total + day.steps, 0)
              .toLocaleString()}
          </div>
          <p className="text-gray-600 dark:text-gray-400">Total This Month</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Update Today's Steps
        </h2>

        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={todaySteps}
            onChange={(e) => setTodaySteps(parseInt(e.target.value) || 0)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            min="0"
            max="50000"
          />
          <button
            onClick={() => updateSteps(todaySteps)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Steps"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {[1000, 2000, 3000, 4000, 5000].map((stepCount) => (
            <button
              key={stepCount}
              onClick={() => updateSteps(todaySteps + stepCount)}
              disabled={loading}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              +{stepCount}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Step History
        </h2>

        {steps.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No step data recorded yet.
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
                    Steps
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {steps.map((day) => (
                  <tr key={day.date}>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {day.steps.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (day.steps / 10000) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
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

export default Steps;
