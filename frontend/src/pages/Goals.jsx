// frontend/src/pages/Goals.jsx
// Goal progress is live: computed on the server from the user's logs
// (today's steps/sleep/water/calories, workout days in the last 7 days, profile weight).
import React, { useState, useEffect } from "react";
import { Plus, Target, Calendar, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useActivityStore } from "../store/activityStore";
import { confirmDialog } from "../store/confirmStore";
import { scheduleEngagementCheck } from "../lib/engagement";
import Page from "../components/UI/Page";
import Modal from "../components/UI/Modal";
import EmptyState from "../components/UI/EmptyState";
import { SkeletonCard } from "../components/UI/Skeleton";
import { GOAL_TYPES } from "../utils/goals";
import { formatDate, localDate, parseLocalDate } from "../utils/date";

const PERIOD_HINT = {
  today: "Updates automatically from today's logs",
  "last 7 days": "Days with a logged workout in the last 7 days",
  now: "Uses the weight on your profile",
};

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });

const WeightUpdate = ({ goal, onSaved }) => {
  const { user } = useAuthStore();
  const [value, setValue] = useState(goal.current_value ?? "");
  const [saving, setSaving] = useState(false);
  const id = `weight-${goal.id}`;

  const save = async (e) => {
    e.preventDefault();
    const weight = parseFloat(value);
    if (!Number.isFinite(weight) || weight < 20 || weight > 400) {
      toast.error("Enter a weight between 20 and 400 kg");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ weight, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update weight");
      return;
    }
    toast.success("Weight updated");
    onSaved();
  };

  return (
    <form onSubmit={save} className="flex gap-2 mt-4">
      <label htmlFor={id} className="sr-only">
        Current weight in kg
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Current weight (kg)"
        className="input-field flex-1"
      />
      <button type="submit" disabled={saving} className="btn-soft">
        {saving ? "Saving…" : "Update"}
      </button>
    </form>
  );
};

const GoalCard = ({ goal, onDelete, onChanged }) => {
  const type = GOAL_TYPES[goal.goal_type] || { label: goal.goal_type, unit: "", icon: "🎯" };
  const isWeight = goal.goal_type === "weight";
  const isOverdue = goal.deadline && !goal.done && parseLocalDate(goal.deadline) < parseLocalDate(localDate());
  const remaining = isWeight && goal.current_value != null ? Math.abs(goal.current_value - goal.target_value) : null;

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            {type.icon}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white">{type.label}</h3>
        </div>
        <div className="flex items-center gap-1">
          {goal.done && (
            <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-medium rounded-full flex items-center gap-1">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              {goal.period === "today" ? "Done today" : "Reached"}
            </span>
          )}
          <button
            type="button"
            onClick={() => onDelete(goal)}
            className="icon-btn text-gray-500 hover:!text-red-600 dark:hover:!text-red-400"
            aria-label={`Delete ${type.label} goal`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isWeight ? (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {goal.current_value == null ? (
            "Add your current weight to track this goal."
          ) : (
            <>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(goal.current_value)} kg</span>
              <span className="text-muted"> → target {fmt(goal.target_value)} kg</span>
              {!goal.done && <span className="block text-muted mt-1">{fmt(remaining)} kg to go</span>}
            </>
          )}
        </p>
      ) : (
        <>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted capitalize">{goal.period}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {fmt(goal.current_value)} / {fmt(goal.target_value)} {type.unit}
            </span>
          </div>
          <div
            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
            role="progressbar"
            aria-valuenow={goal.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${type.label} progress`}
          >
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${goal.done ? "bg-green-500" : "bg-primary-600"}`}
              style={{ width: `${goal.percent}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-1.5">{goal.percent}% · {PERIOD_HINT[goal.period]}</p>
        </>
      )}

      {goal.deadline && (
        <p className={`flex items-center text-sm mt-3 ${isOverdue ? "text-red-600 dark:text-red-400" : "text-muted"}`}>
          <Calendar className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Due {formatDate(goal.deadline)}
          {isOverdue && " (overdue)"}
        </p>
      )}

      {isWeight && <WeightUpdate goal={goal} onSaved={onChanged} />}
    </div>
  );
};

const Goals = () => {
  const { user } = useAuthStore();
  const { goalProgress, goalProgressLoading, goalProgressError, fetchGoalProgress, fetchDashboardData } =
    useActivityStore();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ goal_type: "steps", target_value: "", deadline: "" });

  useEffect(() => {
    fetchGoalProgress();
  }, [fetchGoalProgress]);

  const afterChange = () => {
    fetchGoalProgress();
    fetchDashboardData();
    scheduleEngagementCheck();
  };

  const existingFor = (type) => goalProgress.find((g) => g.goal_type === type);

  const openForm = () => {
    const firstFree = Object.keys(GOAL_TYPES).find((t) => !existingFor(t)) || "steps";
    setFormData({ goal_type: firstFree, target_value: "", deadline: "" });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const target = parseFloat(formData.target_value);
    const config = GOAL_TYPES[formData.goal_type];
    if (!Number.isFinite(target) || target < config.min || target > config.max) {
      toast.error(`Target must be between ${config.min} and ${config.max} ${config.unit}`);
      return;
    }
    setSaving(true);
    try {
      // One goal per type: setting it again changes the target
      const existing = existingFor(formData.goal_type);
      const { error } = existing
        ? await supabase
            .from("goals")
            .update({ target_value: target, deadline: formData.deadline || null, achieved: false, updated_at: new Date().toISOString() })
            .eq("id", existing.id)
        : await supabase.from("goals").insert([
            {
              user_id: user.id,
              goal_type: formData.goal_type,
              target_value: target,
              current_value: 0,
              deadline: formData.deadline || null,
            },
          ]);
      if (error) throw error;
      toast.success(existing ? "Goal updated" : "Goal created");
      setShowForm(false);
      afterChange();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (goal) => {
    const label = GOAL_TYPES[goal.goal_type]?.label || goal.goal_type;
    const ok = await confirmDialog({
      title: "Delete goal?",
      message: `Your "${label}" goal will be removed. Your logged data stays.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);
    if (error) {
      toast.error("Failed to delete goal");
      return;
    }
    toast.success("Goal deleted");
    afterChange();
  };

  const selected = GOAL_TYPES[formData.goal_type];
  const replacing = existingFor(formData.goal_type);

  return (
    <Page
      title="Goals"
      icon={Target}
      subtitle="Progress updates automatically as you log"
      actions={
        <button onClick={openForm} className="btn-primary">
          <Plus className="w-5 h-5" aria-hidden="true" />
          Set a goal
        </button>
      }
    >
      {goalProgressLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : goalProgressError && goalProgress.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="Couldn't load your goals"
            description={goalProgressError}
            action={
              <button onClick={fetchGoalProgress} className="btn-primary">
                Try again
              </button>
            }
          />
        </div>
      ) : goalProgress.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No goals set yet"
            description="Pick a target. Progress fills in by itself from your steps, sleep, water and workouts."
            action={
              <button onClick={openForm} className="btn-primary">
                Set your first goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goalProgress.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal} onChanged={afterChange} />
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={replacing ? "Change goal" : "Set a goal"}>
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
                  {existingFor(value) ? " (set)" : ""}
                </option>
              ))}
            </select>
            {replacing && (
              <p className="text-xs text-muted mt-1.5">
                You already have this goal ({fmt(replacing.target_value)} {selected.unit}). Saving changes the target.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="goal-target" className="label">
              Target ({selected.unit}
              {formData.goal_type === "workout" ? " per week" : formData.goal_type === "weight" ? "" : " per day"})
            </label>
            <input
              id="goal-target"
              type="number"
              inputMode="decimal"
              step={selected.step}
              min={selected.min}
              max={selected.max}
              required
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
              className="input-field"
              placeholder={`${selected.min}–${selected.max}`}
            />
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
              {saving ? "Saving..." : replacing ? "Update goal" : "Create goal"}
            </button>
          </div>
        </form>
      </Modal>
    </Page>
  );
};

export default Goals;
