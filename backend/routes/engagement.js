// backend/routes/engagement.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const { sendServerError } = require("../lib/http");
const { resolveToday } = require("../lib/fitnessContext");
const { parseTzOffset, getAchievements, runEngagementChecks } = require("../lib/engagement");
const { engagementLimiter } = require("../middleware/rateLimit");

// GET /api/achievements - every achievement with the user's live progress
router.get("/achievements", authenticateToken, async (req, res) => {
  try {
    res.json(
      await getAchievements(req.user.id, resolveToday(req.query.clientDate), parseTzOffset(req.query.tzOffset))
    );
  } catch (error) {
    sendServerError(res, error, "Failed to load achievements.");
  }
});

// POST /api/engagement/check - complete challenges, unlock achievements and create
// goal / weekly-summary notifications. Called on app open and after each log.
router.post("/engagement/check", authenticateToken, engagementLimiter, async (req, res) => {
  try {
    res.json(
      await runEngagementChecks(req.user.id, resolveToday(req.body?.clientDate), parseTzOffset(req.body?.tzOffset))
    );
  } catch (error) {
    sendServerError(res, error, "Failed to update your progress.");
  }
});

module.exports = router;
