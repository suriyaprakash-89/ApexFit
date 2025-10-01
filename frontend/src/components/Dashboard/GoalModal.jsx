// frontend/src/components/Dashboard/GoalModal.jsx
import React, { useState } from "react";
import { useActivityStore } from "../../store/activityStore";
import toast from "react-hot-toast";

const GoalModal = ({
  isOpen,
  onClose,
  goalType,
  currentGoal,
  currentValue,
  icon,
}) => {
  const [newGoal, setNewGoal] = useState(currentGoal);
  const { updateGoal } = useActivityStore();

  if (!isOpen) return null;

  const goalConfig = {
    steps: {
      label: "Daily Steps",
      unit: "steps",
      min: 1000,
      max: 50000,
      step: 100,
    },
    calories: {
      label: "Calories Burned",
      unit: "calories",
      min: 100,
      max: 5000,
      step: 10,
    },
    sleep: { label: "Sleep Hours", unit: "hours", min: 4, max: 16, step: 0.5 },
    water: { label: "Water Intake", unit: "glasses", min: 4, max: 20, step: 1 },
  };

  const config = goalConfig[goalType] || {
    label: goalType,
    unit: "",
    min: 1,
    max: 1000,
    step: 1,
  };

  // Convert glasses to liters for water (1 glass = 0.25L)
  const convertToLiters = (glasses) => (glasses * 0.25).toFixed(1);
  const convertToGlasses = (liters) => Math.round(liters / 0.25);

  const handleSave = async () => {
    if (newGoal < config.min || newGoal > config.max) {
      toast.error(
        `Goal must be between ${config.min} and ${config.max} ${config.unit}`
      );
      return;
    }

    try {
      await updateGoal(goalType, newGoal);
      toast.success(
        `${config.label} goal updated to ${newGoal} ${config.unit}!`
      );
      onClose();
    } catch (error) {
      toast.error("Failed to update goal");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Calculate current progress percentage
  const currentPercentage = Math.min(
    Math.round((currentValue / currentGoal) * 100),
    100
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit {config.label} Goal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center mb-6">
          <span className="text-3xl mr-3">{icon}</span>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Current: {currentValue} {config.unit}
            </p>
            {goalType === "water" && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ≈ {convertToLiters(currentValue)} liters
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Progress: {currentPercentage}%
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Goal ({config.unit})
            </label>
            <input
              type="number"
              min={config.min}
              max={config.max}
              step={config.step}
              value={newGoal}
              onChange={(e) => setNewGoal(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {goalType === "water" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ≈ {convertToLiters(newGoal)} liters
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Min: {config.min}, Max: {config.max}
            </p>
          </div>

          {/* Recommended ranges */}
          {goalType === "water" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                💧 Recommended Daily Intake:
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Sedentary: 8-12 glasses (2-3L)</li>
                <li>• Active: 12-16 glasses (3-4L)</li>
                <li>• Very Active: 16-20 glasses (4-5L)</li>
              </ul>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
