// backend/routes/challenges.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");
const { sendServerError } = require("../lib/http");
const { resolveToday } = require("../lib/fitnessContext");
const { getChallengeProgress } = require("../lib/engagement");

// The signed-in user's joined challenges with live progress from their logs
router.get("/mine", authenticateToken, async (req, res) => {
  try {
    res.json(await getChallengeProgress(req.user.id, resolveToday(req.query.clientDate)));
  } catch (error) {
    sendServerError(res, error, "Failed to load your challenges.");
  }
});

/** "Suriya Prakash" -> "Suriya P." so the public leaderboard doesn't expose full names. */
const displayName = (name, id) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return `Athlete #${id.slice(0, 4)}`;
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

// Top athletes by points, plus the caller's own rank. Served by the backend because
// profiles RLS only lets each user read their own row.
router.get("/leaderboard", authenticateToken, async (req, res) => {
  try {
    const [top, me] = await Promise.all([
      supabase.from("profiles").select("id, name, points").order("points", { ascending: false }).limit(10),
      supabase.from("profiles").select("id, name, points").eq("id", req.user.id).maybeSingle(),
    ]);
    if (top.error) throw top.error;

    const myPoints = me.data?.points || 0;
    const { count: ahead } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("points", myPoints);

    res.json({
      top: (top.data || []).map((p, i) => ({
        rank: i + 1,
        name: displayName(p.name, p.id),
        points: p.points || 0,
        isMe: p.id === req.user.id,
      })),
      me: { rank: (ahead || 0) + 1, points: myPoints, name: displayName(me.data?.name, req.user.id) },
    });
  } catch (error) {
    sendServerError(res, error, "Failed to load the leaderboard.");
  }
});

module.exports = router;
