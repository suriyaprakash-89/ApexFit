// backend/routes/public.js
// Unauthenticated, aggregate-only data for the landing page. Never returns
// anything about an individual user.
const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { sendServerError } = require("../lib/http");

const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, data: null };

router.get("/stats", async (req, res) => {
  try {
    if (!cache.data || Date.now() - cache.at > CACHE_MS) {
      const count = (table, filter) => {
        let q = supabase.from(table).select("*", { count: "exact", head: true });
        if (filter) q = filter(q);
        return q;
      };
      const [users, activities, completed] = await Promise.all([
        count("profiles"),
        count("activities"),
        count("user_challenges", (q) => q.eq("completed", true)),
      ]);
      const failed = [users, activities, completed].find((r) => r.error);
      if (failed) throw failed.error;
      cache = {
        at: Date.now(),
        data: {
          athletes: users.count || 0,
          activitiesLogged: activities.count || 0,
          challengesCompleted: completed.count || 0,
        },
      };
    }
    res.set("Cache-Control", "public, max-age=600");
    res.json(cache.data);
  } catch (error) {
    sendServerError(res, error, "Stats are unavailable right now.");
  }
});

module.exports = router;
