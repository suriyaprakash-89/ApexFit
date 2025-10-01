// backend/routes/analytics.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase"); // Import Supabase here

router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const [steps, activities, sleep, water] = await Promise.all([
      supabase
        .from("steps")
        .select("steps, date")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate),
      // ... other queries
    ]);

    res.json({
      steps: steps.data,
      activities: activities.data,
      sleep: sleep.data,
      water: water.data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
