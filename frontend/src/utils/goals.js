// frontend/src/utils/goals.js
// Single source of truth for goal defaults/labels (keep DEFAULT_GOALS in sync
// with backend/lib/fitnessContext.js).

export const DEFAULT_GOALS = { steps: 10000, calories: 500, sleep: 8, water: 8 };

export const GOAL_TYPES = {
  steps: { label: "Daily Steps", unit: "steps", icon: "👣", min: 1000, max: 50000, step: 100 },
  calories: { label: "Calories Burned", unit: "cal", icon: "🔥", min: 100, max: 5000, step: 10 },
  sleep: { label: "Sleep Hours", unit: "hours", icon: "😴", min: 4, max: 12, step: 0.5 },
  water: { label: "Water Intake", unit: "glasses", icon: "💧", min: 4, max: 20, step: 1 },
  weight: { label: "Weight Goal", unit: "kg", icon: "⚖️", min: 30, max: 300, step: 0.1 },
  workout: { label: "Workout Days", unit: "days", icon: "💪", min: 1, max: 7, step: 1 },
};

export const GLASS_TO_LITER = 0.25;

/** Target for a goal type from the user's goals list, falling back to defaults. */
export const getGoalTarget = (goals, type) => {
  const goal = (goals || []).find((g) => g.goal_type === type);
  return Number(goal?.target_value) || DEFAULT_GOALS[type];
};

export const percentOf = (value, target) =>
  target > 0 ? Math.min(Math.round((Number(value || 0) / target) * 100), 100) : 0;

export const ACTIVITY_TYPES = [
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "walking", label: "Walking", emoji: "🚶" },
  { value: "cycling", label: "Cycling", emoji: "🚴" },
  { value: "swimming", label: "Swimming", emoji: "🏊" },
  { value: "gym", label: "Gym", emoji: "💪" },
  { value: "yoga", label: "Yoga", emoji: "🧘" },
  { value: "other", label: "Other", emoji: "🏅" },
];

export const activityEmoji = (type) =>
  ACTIVITY_TYPES.find((t) => t.value === type)?.emoji || "🏅";
