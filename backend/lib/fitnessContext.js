// backend/lib/fitnessContext.js
// Builds a compact, server-trusted summary of a user's fitness data for the AI features.
const supabase = require("../config/supabase");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

// Keep in sync with frontend/src/utils/goals.js
const DEFAULT_GOALS = { steps: 10000, calories: 500, sleep: 8, water: 8 };

const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10);
};

/**
 * The server can't know the user's timezone, so the client sends its local date.
 * Accept it only if it is within a day of the server's UTC date.
 */
const resolveToday = (clientDate) => {
  const serverToday = new Date().toISOString().slice(0, 10);
  if (typeof clientDate !== "string" || !DATE_RE.test(clientDate)) return serverToday;
  const diff = Math.abs(Date.parse(clientDate) - Date.parse(serverToday));
  return diff <= DAY_MS ? clientDate : serverToday;
};

const round = (n, digits = 1) =>
  Number.isFinite(n) ? Math.round(n * 10 ** digits) / 10 ** digits : null;
const avg = (values) =>
  values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;

async function buildFitnessContext(userId, today, days = 7) {
  const start = addDays(today, -(days - 1));

  const [profileRes, stepsRes, sleepRes, waterRes, activitiesRes, goalsRes] =
    await Promise.all([
      supabase.from("profiles").select("name, age, weight, height").eq("id", userId).maybeSingle(),
      supabase.from("steps").select("date, steps").eq("user_id", userId).gte("date", start).lte("date", today),
      supabase.from("sleep").select("date, hours, quality").eq("user_id", userId).gte("date", start).lte("date", today),
      supabase.from("water").select("date, amount").eq("user_id", userId).gte("date", start).lte("date", today),
      supabase
        .from("activities")
        .select("date, type, duration, calories, distance")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", today)
        .order("date", { ascending: false })
        .limit(100),
      supabase.from("goals").select("goal_type, target_value, current_value, deadline").eq("user_id", userId).eq("achieved", false),
    ]);

  const steps = stepsRes.data || [];
  const sleep = sleepRes.data || [];
  const water = waterRes.data || [];
  const activities = activitiesRes.data || [];
  const goalsList = goalsRes.data || [];
  const profile = profileRes.data || {};

  const goals = { ...DEFAULT_GOALS };
  goalsList.forEach((g) => {
    if (g.goal_type in goals) goals[g.goal_type] = Number(g.target_value);
  });

  const byDate = (rows, key) => rows.find((r) => r.date === today)?.[key] ?? 0;
  const activeDates = new Set(activities.map((a) => a.date));
  const loggedDates = new Set([
    ...steps.map((r) => r.date),
    ...sleep.map((r) => r.date),
    ...water.map((r) => r.date),
    ...activeDates,
  ]);

  const activityTypes = {};
  activities.forEach((a) => {
    activityTypes[a.type] = (activityTypes[a.type] || 0) + 1;
  });

  return {
    today,
    periodDays: days,
    profile: {
      firstName: profile.name ? String(profile.name).split(" ")[0] : null,
      age: profile.age ?? null,
      weightKg: profile.weight != null ? Number(profile.weight) : null,
      heightCm: profile.height != null ? Number(profile.height) : null,
    },
    goals,
    todayStats: {
      steps: byDate(steps, "steps"),
      sleepHours: Number(byDate(sleep, "hours")),
      waterGlasses: byDate(water, "amount"),
      activeCalories: activities
        .filter((a) => a.date === today)
        .reduce((s, a) => s + (a.calories || 0), 0),
      workouts: activities.filter((a) => a.date === today).length,
    },
    period: {
      avgSteps: round(avg(steps.map((r) => r.steps)), 0),
      daysWithSteps: steps.length,
      avgSleepHours: round(avg(sleep.map((r) => Number(r.hours)))),
      avgSleepQuality: round(avg(sleep.filter((r) => r.quality).map((r) => r.quality))),
      nightsLogged: sleep.length,
      avgWaterGlasses: round(avg(water.map((r) => r.amount))),
      daysWithWater: water.length,
      workouts: activities.length,
      activeDays: activeDates.size,
      totalActiveMinutes: activities.reduce((s, a) => s + (a.duration || 0), 0),
      totalActiveCalories: activities.reduce((s, a) => s + (a.calories || 0), 0),
      activityTypes,
      daysWithAnyLog: loggedDates.size,
    },
    activeGoals: goalsList.map((g) => ({
      type: g.goal_type,
      target: Number(g.target_value),
      current: Number(g.current_value || 0),
      deadline: g.deadline,
    })),
    recentActivities: activities.slice(0, 5).map((a) => ({
      date: a.date,
      type: a.type,
      minutes: a.duration,
      calories: a.calories,
    })),
  };
}

/** Personalised starter prompts for the coach, derived from today's data. */
function suggestPrompts(ctx) {
  const out = [];
  if (!ctx) {
    return [
      "Suggest a 20-minute workout",
      "How can I sleep better?",
      "What should I eat after a workout?",
      "Tips for staying motivated",
    ];
  }
  const { todayStats: t, goals: g, period: p } = ctx;
  if (t.waterGlasses < g.water / 2) out.push("How can I drink more water today?");
  if (p.nightsLogged && p.avgSleepHours < 7) out.push(`I'm averaging ${p.avgSleepHours}h of sleep. How do I improve it?`);
  if (t.steps < g.steps / 2) out.push(`Easy ways to reach ${g.steps.toLocaleString("en-US")} steps today`);
  if (p.workouts === 0) out.push("Give me a beginner 20-minute home workout");
  else out.push("Plan my workouts for the rest of the week");
  out.push("What should I eat after a workout?");
  out.push("How am I doing this week?");
  return [...new Set(out)].slice(0, 4);
}

module.exports = { buildFitnessContext, suggestPrompts, resolveToday, addDays, DEFAULT_GOALS };
