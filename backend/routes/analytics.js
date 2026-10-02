// backend/routes/analytics.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");
const { sendServerError, sendBadRequest, isDate } = require("../lib/http");

const MAX_RANGE_DAYS = 366;

// GET /api/analytics/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/summary", authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!isDate(startDate) || !isDate(endDate)) {
    return sendBadRequest(res, "startDate and endDate are required (YYYY-MM-DD)");
  }
  const days = (Date.parse(endDate) - Date.parse(startDate)) / 86400000;
  if (days < 0) return sendBadRequest(res, "startDate must be on or before endDate");
  if (days > MAX_RANGE_DAYS) return sendBadRequest(res, `Range can be at most ${MAX_RANGE_DAYS} days`);

  try {
    const userId = req.user.id;
    const inRange = (table, columns) =>
      supabase
        .from(table)
        .select(columns)
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

    const [steps, activities, sleep, water] = await Promise.all([
      inRange("steps", "date, steps"),
      inRange("activities", "date, type, duration, calories, distance"),
      inRange("sleep", "date, hours, quality"),
      inRange("water", "date, amount"),
    ]);

    const failed = [steps, activities, sleep, water].find((r) => r.error);
    if (failed) throw failed.error;

    res.json({
      steps: steps.data,
      activities: activities.data,
      sleep: sleep.data,
      water: water.data,
    });
  } catch (error) {
    sendServerError(res, error, "Failed to load analytics.");
  }
});

module.exports = router;
