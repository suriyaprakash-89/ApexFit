// frontend/src/pages/Goals.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Target, Calendar, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useActivityStore } from "../store/activityStore";
import { confirmDialog } from "../store/confirmStore";
import Page from "../components/UI/Page";
import Modal from "../components/UI/Modal";
import EmptyState from "../components/UI/EmptyState";
import { SkeletonCard } from "../components/UI/Skeleton";
import { GOAL_TYPES, percentOf } from "../utils/goals";
import { formatDate, localDate, parseLocalDate } from "../utils/date";

const emptyForm = { goal_type: "steps", target_value: "", current_value: "0", deadline: "" };

const GoalCard = ({ goal, onUpdate, onDelete }) => {
  const type = GOAL_TYPES[goal.goal_type] || { label: goal.goal_type, unit: "", icon: "🎯" };
  const current = Number(goal.current_value || 0);
  const target = Number(goal.target_value);
  const progress = percentOf(current, target);
  const isOverdue = goal.deadline && parseLocalDate(goal.deadline) < parseLocalDate(localDate());
  const [value, setValue] = useState(String(current));
  const inputId = `goal-progress-${goal.id}`;

  useEffect(() => setValue(String(current)), [current]);

  const commit = (e) => {
    e.preventDefault();
    const next = parseFloat(value);
    if (!Number.isFinite(next) || next < 0) {
      toast.error("Enter a valid number");
      return;
    }
    if (next !== current) onUpdate(goal, next);
  };

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            {type.icon}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white">{type.label}</h3>
        </div>
        {goal.achieved && (
          <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
            Achieved 🎉
          </span>
        )}
      </div>

      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted">Progress</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {current.toLocaleString()} / {target.toLocaleString()} {type.unit}
        </span>
      </div>
      <div
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${type.label} progress`}
      >
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${goal.achieved ? "bg-green-500" : "bg-primary-600"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-1.5">{progress}% complete</p>

      {goal.deadline && (
        <p
          className={`flex items-center text-sm mt-3 ${
            isOverdue && !goal.achieved ? "text-red-600 dark:text-red-400" : "text-muted"
          }`}
        >
          <Calendar className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Due {formatDate(goal.deadline)}
          {isOverdue && !goal.achieved && " (overdue)"}
        </p>
      )}

      <form onSubmit={commit} className="flex gap-2 mt-auto pt-4">
        <label htmlFor={inputId} className="sr-only">
          Update {type.label} progress
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input-field flex-1"
        />
        <button type="submit" className="btn-soft" disabled={parseFloat(value) === current}>
          Update
        </button>
        <button
          type="button"
          onClick={() => onDelete(goal)}
          className="icon-btn text-red-600 dark:text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20"
          aria-label={`Delete ${type.label} goal`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

const Goals = () => {
  const { user } = useAuthStore();
  const { fetchDashboardData } = useActivityStore();
  const [goals, setGoals] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      if (navigator.onLine) toast.error("Failed to load goals");
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const afterChange = () => {
    fetchGoals();
    fetchDashboardData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const target = parseFloat(formData.target_value);
    const current = parseFloat(formData.current_value) || 0;
    if (!Number.isFinite(target) || target <= 0) {
      toast.error("Enter a target greater than 0");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("goals").insert([
        {
          user_id: user.id,
          goal_type: formData.goal_type,
          target_value: target,
          current_value: current,
          deadline: formData.deadline || null,
          achieved: current >= target,
        },
      ]);
      if (error) throw error;
      toast.success("Goal created");
      setShowForm(false);
      setFormData(emptyForm);
      afterChange();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
    } finally {
      setSaving(false);
    }
  };

  const updateProgress = async (goal, newValue) => {
    try {
      const achieved = newValue >= Number(goal.target_value);
      const { error } = await supabase
        .from("goals")
        .update({ current_value: newValue, achieved, updated_at: new Date().toISOString() })
        .eq("id", goal.id);
      if (error) throw error;
      toast.success(achieved && !goal.achieved ? "Goal achieved! 🎉" : "Progress updated");
      afterChange();
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const deleteGoal = async (goal) => {
    const label = GOAL_TYPES[goal.goal_type]?.label || goal.goal_type;
    const ok = await confirmDialog({
      title: "Delete goal?",
      message: `Your "${label}" goal and its progress will be removed.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);
      if (error) throw error;
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
      fetchDashboardData();
      toast.success("Goal deleted");
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const selectedType = GOAL_TYPES[formData.goal_type];

  return (
    <Page
      title="Goals"
      icon={Target}
      subtitle="Set targets and track your progress"
      actions={
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-5 h-5" aria-hidden="true" />
          New goal
        </button>
      }
    >
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No goals set yet"
            description="Goals keep you motivated. Start with daily steps or water."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Create your first goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={updateProgress} onDelete={deleteGoal} />
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create a goal">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-type" className="label">
              Goal type
            </label>
            <select
              id="goal-type"
              value={formData.goal_type}
              onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
              className="input-field"
            >
              {Object.entries(GOAL_TYPES).map(([value, type]) => (
                <option key={value} value={value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-target" className="label">
                Target ({selectedType?.unit})
              </label>
              <input
                id="goal-target"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                required
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="goal-current" className="label">
                Current progress
              </label>
              <input
                id="goal-current"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label htmlFor="goal-deadline" className="label">
              Deadline <span className="font-normal text-muted">optional</span>
            </label>
            <input
              id="goal-deadline"
              type="date"
              min={localDate()}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Creating..." : "Create goal"}
            </button>
          </div>
        </form>
      </Modal>
    </Page>
  );
};

export default Goals;
