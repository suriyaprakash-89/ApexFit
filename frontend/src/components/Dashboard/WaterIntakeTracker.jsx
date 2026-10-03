// frontend/src/components/Dashboard/WaterIntakeTracker.jsx
import React, { useState } from "react";
import { Droplets, Minus, Plus } from "lucide-react";
import { useActivityStore } from "../../store/activityStore";
import toast from "@/lib/toast";
import { localDate } from "../../utils/date";
import { offlineSavedToast } from "../../store/syncStore";
import { getGoalTarget, percentOf, GLASS_TO_LITER } from "../../utils/goals";

const MAX_GLASSES = 20;

const getHydrationStatus = (percentage) => {
  if (percentage >= 100) return "Goal reached. Excellent hydration! 💪";
  if (percentage >= 75) return "Almost there, great job!";
  if (percentage >= 50) return "Good progress, keep going!";
  if (percentage >= 25) return "Getting started, stay hydrated!";
  return "Time to hydrate!";
};

const getTip = (percentage) => {
  if (percentage < 50) return "Drink a glass after each meal.";
  if (percentage < 80) return "Keep a water bottle within reach.";
  return "You're doing great. Keep it consistent!";
};

const WaterIntakeTracker = () => {
  const { water, setWaterIntake, goals } = useActivityStore();
  const [saving, setSaving] = useState(false);

  const todayWater = water.find((entry) => entry.date === localDate())?.amount || 0;
  const goal = getGoalTarget(goals, "water");
  const percentage = percentOf(todayWater, goal);
  const glasses = Array.from({ length: Math.min(Math.max(goal, todayWater), MAX_GLASSES) }, (_, i) => i + 1);

  const update = async (amount) => {
    const next = Math.max(0, Math.min(amount, MAX_GLASSES));
    if (amount > MAX_GLASSES) {
      toast.error(`Maximum is ${MAX_GLASSES} glasses per day`);
      return;
    }
    if (next === todayWater || saving) return;
    setSaving(true);
    try {
      const { queued } = await setWaterIntake(next);
      if (queued) offlineSavedToast();
    } catch {
      toast.error("Failed to update water intake");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title">Water intake</h2>
        <Droplets className="w-5 h-5 text-teal-500" aria-hidden="true" />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => update(todayWater - 1)}
          disabled={saving || todayWater === 0}
          className="icon-btn border border-border"
          aria-label="Remove one glass"
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="text-center" aria-live="polite">
          <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
            {Number((todayWater * GLASS_TO_LITER).toFixed(2))} L
          </p>
          <p className="text-sm text-muted">
            {todayWater} of {goal} glasses
          </p>
        </div>
        <button
          type="button"
          onClick={() => update(todayWater + 1)}
          disabled={saving || todayWater >= MAX_GLASSES}
          className="icon-btn bg-teal-500 hover:bg-teal-600 !text-white"
          aria-label="Add one glass"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Water goal progress"
      >
        <div
          className="bg-pulse-400 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-teal-700 dark:text-teal-300 mt-2 font-medium text-center">
        {getHydrationStatus(percentage)}
      </p>

      <fieldset className="mt-4">
        <legend className="text-xs text-muted mb-2">Tap a glass to set today's total</legend>
        <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {glasses.map((glass) => (
            <button
              key={glass}
              type="button"
              onClick={() => update(glass === todayWater ? glass - 1 : glass)}
              disabled={saving}
              aria-label={`${glass} glass${glass > 1 ? "es" : ""}`}
              aria-pressed={todayWater >= glass}
              className={`h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                todayWater >= glass
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30"
              }`}
            >
              {glass}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-auto pt-4">
        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-xl text-sm">
          <p className="font-medium text-teal-800 dark:text-teal-200">💡 Tip</p>
          <p className="text-teal-700 dark:text-teal-300">{getTip(percentage)}</p>
        </div>
      </div>
    </div>
  );
};

export default WaterIntakeTracker;
