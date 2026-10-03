// frontend/src/utils/training.js
// Pure helpers for strength training: exercise library, estimated 1RM, records, volume.

/** Common exercises grouped by muscle. Users can always type their own. */
export const EXERCISE_LIBRARY = [
  { group: "Chest", items: ["Bench Press", "Incline Dumbbell Press", "Push-up", "Chest Fly", "Dips"] },
  { group: "Back", items: ["Deadlift", "Barbell Row", "Pull-up", "Lat Pulldown", "Seated Cable Row"] },
  { group: "Legs", items: ["Back Squat", "Front Squat", "Leg Press", "Romanian Deadlift", "Lunge", "Calf Raise"] },
  { group: "Shoulders", items: ["Overhead Press", "Lateral Raise", "Face Pull", "Rear Delt Fly"] },
  { group: "Arms", items: ["Barbell Curl", "Hammer Curl", "Triceps Pushdown", "Skull Crusher"] },
  { group: "Core", items: ["Plank", "Hanging Leg Raise", "Cable Crunch", "Ab Wheel"] },
];

export const ALL_EXERCISES = EXERCISE_LIBRARY.flatMap((g) => g.items);

export const REST_PRESETS = [45, 60, 90, 120, 180];

/** Epley estimated one-rep max. Returns 0 for bodyweight-only sets (no load). */
export const estimate1RM = (weightKg, reps) => {
  const w = Number(weightKg);
  const r = Number(reps);
  if (!(w > 0) || !(r > 0)) return 0;
  return r === 1 ? w : w * (1 + r / 30);
};

export const setVolume = (set) => Number(set.weight_kg || 0) * Number(set.reps || 0);

export const totalVolume = (sets) => sets.reduce((sum, s) => sum + setVolume(s), 0);

const round1 = (n) => Math.round(n * 10) / 10;
export const formatKg = (n) => `${Number.isInteger(n) ? n : round1(n)} kg`;
export const formatVolume = (kg) =>
  kg >= 10000 ? `${round1(kg / 1000)} t` : `${Math.round(kg).toLocaleString()} kg`;

/**
 * Best marks per exercise from a flat list of sets joined with their workout date.
 * Returns Map(exercise -> { maxWeight, maxWeightReps, best1RM, bestDate, sessions })
 */
export const personalRecords = (sets) => {
  const records = new Map();
  for (const s of sets) {
    const e1rm = estimate1RM(s.weight_kg, s.reps);
    const rec = records.get(s.exercise) || { exercise: s.exercise, maxWeight: 0, maxWeightReps: 0, best1RM: 0, bestDate: null, dates: new Set() };
    rec.dates.add(s.date);
    if (Number(s.weight_kg) > rec.maxWeight || (Number(s.weight_kg) === rec.maxWeight && s.reps > rec.maxWeightReps)) {
      rec.maxWeight = Number(s.weight_kg);
      rec.maxWeightReps = s.reps;
    }
    if (e1rm > rec.best1RM) {
      rec.best1RM = e1rm;
      rec.bestDate = s.date;
    }
    records.set(s.exercise, rec);
  }
  return Array.from(records.values())
    .map((r) => ({ ...r, sessions: r.dates.size, dates: undefined }))
    .sort((a, b) => b.best1RM - a.best1RM);
};

/**
 * Which of the new sets beat the user's previous best estimated 1RM for that exercise?
 * `previous` is Map(exercise -> best1RM) computed BEFORE saving this workout.
 */
export const detectNewRecords = (newSets, previous) => {
  const best = new Map();
  for (const s of newSets) {
    const e = estimate1RM(s.weight_kg, s.reps);
    if (e > (best.get(s.exercise)?.e1rm || 0)) best.set(s.exercise, { exercise: s.exercise, e1rm: e, weight: Number(s.weight_kg), reps: s.reps });
  }
  return Array.from(best.values()).filter((b) => previous.has(b.exercise) && b.e1rm > previous.get(b.exercise) + 0.01);
};

/** Per-session best estimated 1RM for one exercise, oldest first (for the progress chart). */
export const exerciseTrend = (sets, exercise) => {
  const byDate = new Map();
  for (const s of sets) {
    if (s.exercise !== exercise) continue;
    const e = estimate1RM(s.weight_kg, s.reps);
    if (e > (byDate.get(s.date) || 0)) byDate.set(s.date, e);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, value]) => ({ date, value: round1(value) }));
};

/** Rough calorie estimate for a strength session (MET 5) so it counts toward calorie goals. */
export const estimateGymCalories = (durationMin, bodyWeightKg = 70) =>
  Math.max(1, Math.round(5 * (bodyWeightKg || 70) * (Math.max(1, durationMin) / 60)));

/** BMI with its general adult category. Returns null without valid inputs. */
export const bmi = (weightKg, heightCm) => {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!(w > 0) || !(h > 0.5)) return null;
  const value = w / (h * h);
  const label = value < 18.5 ? "Below range" : value < 25 ? "Healthy range" : value < 30 ? "Above range" : "High range";
  return { value: round1(value), label };
};
