// frontend/src/components/Dashboard/GoalModal.jsx
import React, { useState, useEffect } from "react";
import { useActivityStore } from "../../store/activityStore";
import toast from "react-hot-toast";
import Modal from "../UI/Modal";
import { GOAL_TYPES, GLASS_TO_LITER, percentOf } from "../../utils/goals";

const GoalModal = ({ isOpen, onClose, goalType, currentGoal, currentValue = 0 }) => {
  const [newGoal, setNewGoal] = useState(currentGoal || 0);
  const [saving, setSaving] = useState(false);
  const { updateGoal } = useActivityStore();

  // Show the current target each time the modal opens for a goal
  useEffect(() => {
    if (isOpen) setNewGoal(currentGoal || 0);
  }, [isOpen, currentGoal]);

  const config = GOAL_TYPES[goalType] || { label: goalType, unit: "", icon: "🎯", min: 1, max: 1000, step: 1 };
  const toLiters = (glasses) => (Number(glasses || 0) * GLASS_TO_LITER).toFixed(1);
  const value = Number(newGoal);
  const invalid = !Number.isFinite(value) || value < config.min || value > config.max;

  const handleSave = async (e) => {
    e.preventDefault();
    if (invalid) {
      toast.error(`Goal must be between ${config.min} and ${config.max} ${config.unit}`);
      return;
    }
    setSaving(true);
    try {
      await updateGoal(goalType, value);
      toast.success(`${config.label} goal set to ${value.toLocaleString()} ${config.unit}`);
      onClose();
    } catch {
      toast.error("Failed to set goal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Set ${config.label} goal`}>
      <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <span className="text-3xl" aria-hidden="true">
          {config.icon}
        </span>
        <div className="text-sm">
          <p className="font-medium text-gray-900 dark:text-white">
            Today: {Number(currentValue).toLocaleString()} {config.unit}
            {goalType === "water" && <span className="text-muted"> (≈ {toLiters(currentValue)} L)</span>}
          </p>
          <p className="text-muted">{percentOf(currentValue, currentGoal)}% of your current goal</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="goal-value" className="label">
            New daily goal ({config.unit})
          </label>
          <input
            id="goal-value"
            type="number"
            inputMode="decimal"
            min={config.min}
            max={config.max}
            step={config.step}
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="input-field"
            aria-describedby="goal-hint"
            aria-invalid={invalid}
          />
          <p id="goal-hint" className={`text-xs mt-1.5 ${invalid ? "text-red-600 dark:text-red-400" : "text-muted"}`}>
            Between {config.min.toLocaleString()} and {config.max.toLocaleString()}
            {goalType === "water" && !invalid && ` · ≈ ${toLiters(value)} L`}
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving || invalid} className="btn-primary flex-1">
            {saving ? "Saving..." : "Save goal"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GoalModal;
