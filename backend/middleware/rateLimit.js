// backend/middleware/rateLimit.js
// Per-user limits for the paid AI endpoints. Must run after authenticateToken.
const rateLimit = require("express-rate-limit");

const perUser = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { error: message },
  });

module.exports = {
  aiChatLimiter: perUser(60 * 1000, 10, "You're sending messages too quickly. Please wait a moment."),
  aiChatDailyLimiter: perUser(24 * 60 * 60 * 1000, 200, "Daily AI coach limit reached. Try again tomorrow."),
  aiChallengeLimiter: perUser(60 * 60 * 1000, 5, "You can generate up to 5 challenges per hour."),
  aiInsightsLimiter: perUser(60 * 60 * 1000, 10, "Too many insight refreshes. Try again later."),
  engagementLimiter: perUser(60 * 60 * 1000, 120, "Too many progress checks. Try again later."),
  publicLimiter: rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests." },
  }),
};
