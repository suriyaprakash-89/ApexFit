// backend/routes/challenges.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");

// Get all challenges
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("challenges")
      .select(
        `
        *,
        user_challenges!left(progress, completed),
        profiles!challenges_created_by_fkey(name)
      `
      )
      .gte("end_date", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join challenge
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("user_challenges")
      .insert([{ user_id: req.user.id, challenge_id: id }]);

    if (error) throw error;

    // Award points for joining
    await supabase.from("user_points").insert([
      {
        user_id: req.user.id,
        points: 10,
        source_type: "challenge",
        source_id: id,
        description: "Joined challenge",
      },
    ]);

    res.json({ message: "Challenge joined successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
