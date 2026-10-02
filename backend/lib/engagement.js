// backend/lib/engagement.js
// Live progress for goals, challenges and achievements, computed from the user's
// real logs (steps/sleep/water/activities) with the service key.
const supabase = require("../config/supabase");
const { addDays, DEFAULT_GOALS } = require("./fitnessContext");

const DAILY_GOAL_TYPES = ["steps", "calories", "sleep", "water"];

/** Clamp a client-supplied timezone offset (minutes east of UTC). */
const parseTzOffset = (value) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 0;
};

/** Local calendar date / hour of a UTC timestamp for a user at `tzOffset`. */
const localDateOf = (timestamp, tzOffset) =>
  new Date(Date.parse(timestamp) + tzOffset * 60000).toISOString().slice(0, 10);
const localHourOf = (timestamp, tzOffset) =>
  new Date(Date.parse(timestamp) + tzOffset * 60000).getUTCHours();

const sumBy = (rows, key) => rows.reduce((s, r) => s + Number(r[key] || 0), 0);
const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data || [];
};

async function createNotification(userId, type, message) {
  const { error } = await supabase.from("notifications").insert({ user_id: userId, type, message });
  if (error) console.error("Failed to create notification:", error.message);
  return !error;
}

/** Was a notification of this type created today (in the user's timezone)? */
async function notifiedSince(userId, type, sinceIso) {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", sinceIso);
  return (count || 0) > 0;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

/**
 * Goals with live progress:
 *  - steps / calories / sleep / water: today's logged total (daily goals)
 *  - workout: days with at least one activity in the last 7 days (days per week)
 *  - weight: the weight on the user's profile
 */
async function getGoalProgress(userId, today) {
  const weekStart = addDays(today, -6);
  const [goals, steps, sleep, water, activities, profile] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).then(unwrap),
    supabase.from("steps").select("steps").eq("user_id", userId).eq("date", today).then(unwrap),
    supabase.from("sleep").select("hours").eq("user_id", userId).eq("date", today).then(unwrap),
    supabase.from("water").select("amount").eq("user_id", userId).eq("date", today).then(unwrap),
    supabase.from("activities").select("date, calories").eq("user_id", userId).gte("date", weekStart).lte("date", today).then(unwrap),
    supabase.from("profiles").select("weight").eq("id", userId).maybeSingle().then(({ data }) => data),
  ]);

  const current = {
    steps: sumBy(steps, "steps"),
    sleep: sumBy(sleep, "hours"),
    water: sumBy(water, "amount"),
    calories: sumBy(activities.filter((a) => a.date === today), "calories"),
    workout: new Set(activities.map((a) => a.date)).size,
    weight: profile?.weight != null ? Number(profile.weight) : null,
  };

  return goals.map((goal) => {
    const target = Number(goal.target_value);
    const value = current[goal.goal_type] ?? Number(goal.current_value || 0);
    let percent = 0;
    let done = false;
    if (goal.goal_type === "weight") {
      done = value != null && Math.abs(value - target) <= 0.5;
      percent = done ? 100 : 0;
    } else {
      percent = target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0;
      done = value >= target;
    }
    return {
      ...goal,
      current_value: value,
      percent,
      done,
      period: DAILY_GOAL_TYPES.includes(goal.goal_type) ? "today" : goal.goal_type === "workout" ? "last 7 days" : "now",
    };
  });
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

const CHALLENGE_SOURCES = {
  steps: { table: "steps", column: "steps", unit: "steps" },
  workout: { table: "activities", column: "duration", unit: "minutes" },
  water: { table: "water", column: "amount", unit: "glasses" },
  sleep: { table: "sleep", column: "hours", unit: "hours" },
};

/** Joined challenges (active, or completed in the last 7 days) with live progress. */
async function getChallengeProgress(userId, today) {
  const joined = await supabase
    .from("user_challenges")
    .select("*, challenges(*)")
    .eq("user_id", userId)
    .then(unwrap);

  const relevant = joined.filter(
    (uc) =>
      uc.challenges &&
      (uc.challenges.end_date >= today ||
        (uc.completed && uc.completed_at && uc.completed_at.slice(0, 10) >= addDays(today, -7)))
  );

  return Promise.all(
    relevant.map(async (uc) => {
      const c = uc.challenges;
      const source = CHALLENGE_SOURCES[c.type];
      const joinedOn = uc.created_at.slice(0, 10);
      const from = c.start_date > joinedOn ? c.start_date : joinedOn;
      const to = c.end_date < today ? c.end_date : today;
      let progress = Number(uc.progress || 0);
      if (source && from <= to) {
        const rows = await supabase
          .from(source.table)
          .select(source.column)
          .eq("user_id", userId)
          .gte("date", from)
          .lte("date", to)
          .then(unwrap);
        progress = sumBy(rows, source.column);
      }
      const target = Number(c.target_value);
      return {
        id: uc.id,
        challenge_id: c.id,
        challenge: c,
        progress,
        target,
        unit: source?.unit || "",
        percent: target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0,
        completed: uc.completed,
        completed_at: uc.completed_at,
        tracked: Boolean(source),
      };
    })
  );
}

/** Mark reached challenges complete and award their points (idempotent). */
async function completeReachedChallenges(userId, today) {
  const items = await getChallengeProgress(userId, today);
  const completed = [];
  for (const item of items) {
    if (item.completed || !item.tracked || item.progress < item.target) continue;
    // Only the request that flips completed=false -> true awards points
    const { data } = await supabase
      .from("user_challenges")
      .update({ completed: true, completed_at: new Date().toISOString(), progress: item.progress })
      .eq("id", item.id)
      .eq("completed", false)
      .select("id");
    if (!data?.length) continue;
    await supabase.from("user_points").insert({
      user_id: userId,
      points: item.challenge.points,
      source_type: "challenge",
      source_id: item.challenge_id,
      description: `Completed: ${item.challenge.name}`,
    });
    await createNotification(
      userId,
      "challenge",
      `🏆 Challenge complete: "${item.challenge.name}"! You earned ${item.challenge.points} points.`
    );
    completed.push(item.challenge.name);
  }
  // Keep the stored progress roughly current for unfinished ones
  await Promise.all(
    items
      .filter((i) => !i.completed && i.tracked && i.progress !== undefined)
      .map((i) => supabase.from("user_challenges").update({ progress: i.progress }).eq("id", i.id).eq("completed", false))
  );
  return completed;
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

/** Longest run of consecutive dates in a set that ends today or yesterday. */
function currentStreak(dateSet, today) {
  let day = dateSet.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (dateSet.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

/** Progress value for each achievement condition_type. */
async function achievementMetrics(userId, today, tzOffset) {
  const since90 = addDays(today, -90);
  const [activities, water, sleep, steps, goals, joined] = await Promise.all([
    supabase.from("activities").select("date, created_at").eq("user_id", userId).then(unwrap),
    supabase.from("water").select("date, amount").eq("user_id", userId).gte("date", since90).then(unwrap),
    supabase.from("sleep").select("date, hours").eq("user_id", userId).gte("date", addDays(today, -6)).then(unwrap),
    supabase.from("steps").select("date, steps").eq("user_id", userId).gte("date", since90).then(unwrap),
    supabase.from("goals").select("goal_type, target_value, achieved").eq("user_id", userId).then(unwrap),
    supabase.from("user_challenges").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const goalTarget = (type) =>
    Number(goals.find((g) => g.goal_type === type)?.target_value) || DEFAULT_GOALS[type];

  const activityDates = new Set(activities.map((a) => a.date));
  const hydratedDates = new Set(water.filter((w) => w.amount >= 8).map((w) => w.date));

  // Weekends where both Saturday and Sunday had an activity
  let fullWeekends = 0;
  activityDates.forEach((d) => {
    if (new Date(`${d}T00:00:00Z`).getUTCDay() === 6 && activityDates.has(addDays(d, 1))) fullWeekends += 1;
  });

  const sleepAvg = sleep.length >= 5 ? sumBy(sleep, "hours") / sleep.length : 0;
  const dailyGoalHit =
    steps.some((s) => s.steps >= goalTarget("steps")) || water.some((w) => w.amount >= goalTarget("water"));

  return {
    activities_count: activities.length,
    morning_activities: activities.filter((a) => localHourOf(a.created_at, tzOffset) < 9).length,
    water_streak: currentStreak(hydratedDates, today),
    // "Average 7+ hours for a week": 7 when met, otherwise how many nights were logged
    sleep_quality: sleepAvg >= 7 ? 7 : Math.min(sleep.length, 6),
    goals_completed: goals.filter((g) => g.achieved).length + (dailyGoalHit ? 1 : 0),
    challenges_joined: joined.count || 0,
    weekend_activities: fullWeekends > 0 ? 2 : activityDates.size ? 1 : 0,
    activity_streak: currentStreak(activityDates, today),
  };
}

async function getAchievements(userId, today, tzOffset) {
  const [all, earned, metrics] = await Promise.all([
    supabase.from("achievements").select("*").order("points", { ascending: true }).then(unwrap),
    supabase.from("user_achievements").select("achievement_id, earned_at").eq("user_id", userId).then(unwrap),
    achievementMetrics(userId, today, tzOffset),
  ]);
  const earnedMap = new Map(earned.map((e) => [e.achievement_id, e.earned_at]));
  return all.map((a) => {
    const value = metrics[a.condition_type] ?? 0;
    const target = Number(a.condition_value);
    return {
      ...a,
      earned: earnedMap.has(a.id),
      earned_at: earnedMap.get(a.id) || null,
      progress: Math.min(value, target),
      target,
      percent: target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0,
    };
  });
}

async function awardNewAchievements(userId, today, tzOffset) {
  const list = await getAchievements(userId, today, tzOffset);
  const unlocked = [];
  for (const a of list) {
    if (a.earned || a.progress < a.target) continue;
    // The unique (user_id, achievement_id) constraint makes this safe to race
    const { error } = await supabase.from("user_achievements").insert({ user_id: userId, achievement_id: a.id });
    if (error) continue;
    await supabase.from("user_points").insert({
      user_id: userId,
      points: a.points,
      source_type: "achievement",
      source_id: a.id,
      description: `Achievement: ${a.name}`,
    });
    await createNotification(userId, "achievement", `${a.icon || "🏅"} Achievement unlocked: ${a.name} (+${a.points} pts)`);
    unlocked.push(a.name);
  }
  return unlocked;
}

// ---------------------------------------------------------------------------
// Daily goal + weekly summary notifications
// ---------------------------------------------------------------------------

const GOAL_MESSAGES = {
  steps: "👟 You hit your step goal today. Great work!",
  water: "💧 Hydration goal reached for today!",
  sleep: "😴 You got your target sleep last night.",
  calories: "🔥 Active calorie goal smashed today!",
};

async function notifyGoalsHit(userId, today, tzOffset) {
  const goals = await getGoalProgress(userId, today);
  // Start of the user's local day, as a UTC timestamp
  const startOfDay = new Date(Date.parse(`${today}T00:00:00Z`) - tzOffset * 60000).toISOString();
  let sent = 0;
  for (const goal of goals) {
    if (!goal.done || !GOAL_MESSAGES[goal.goal_type]) continue;
    const type = `goal_${goal.goal_type}`;
    if (await notifiedSince(userId, type, startOfDay)) continue;
    if (await createNotification(userId, type, GOAL_MESSAGES[goal.goal_type])) sent += 1;
  }
  return sent;
}

async function maybeWeeklySummary(userId, today) {
  const { data: settingsRow } = await supabase.from("user_settings").select("settings").eq("user_id", userId).maybeSingle();
  const settings = settingsRow?.settings || {};
  if (settings.weekly_report === false || settings.notifications === false) return false;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  if (await notifiedSince(userId, "weekly_summary", weekAgo)) return false;

  const from = addDays(today, -6);
  const [steps, sleep, activities] = await Promise.all([
    supabase.from("steps").select("steps").eq("user_id", userId).gte("date", from).lte("date", today).then(unwrap),
    supabase.from("sleep").select("hours").eq("user_id", userId).gte("date", from).lte("date", today).then(unwrap),
    supabase.from("activities").select("duration").eq("user_id", userId).gte("date", from).lte("date", today).then(unwrap),
  ]);
  if (!steps.length && !sleep.length && !activities.length) return false; // nothing to report yet

  const parts = [`${activities.length} workout${activities.length === 1 ? "" : "s"} (${sumBy(activities, "duration")} min)`];
  if (steps.length) parts.push(`${Math.round(sumBy(steps, "steps") / steps.length).toLocaleString("en-US")} avg steps`);
  if (sleep.length) parts.push(`${(sumBy(sleep, "hours") / sleep.length).toFixed(1)} h avg sleep`);
  return createNotification(userId, "weekly_summary", `📊 Your week: ${parts.join(" · ")}. Open Insights for your full report.`);
}

/** Run every check after the user logs something (or opens the app). */
async function runEngagementChecks(userId, today, tzOffset) {
  const [completedChallenges, unlocked, goalNotices, weekly] = await Promise.all([
    completeReachedChallenges(userId, today),
    awardNewAchievements(userId, today, tzOffset),
    notifyGoalsHit(userId, today, tzOffset),
    maybeWeeklySummary(userId, today),
  ]);
  return {
    completedChallenges,
    unlockedAchievements: unlocked,
    newNotifications: completedChallenges.length + unlocked.length + goalNotices + (weekly ? 1 : 0),
  };
}

module.exports = {
  parseTzOffset,
  localDateOf,
  getGoalProgress,
  getChallengeProgress,
  getAchievements,
  runEngagementChecks,
};
