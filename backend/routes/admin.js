// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const supabase = require("../config/supabase");

// Get all users
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user activity stats
router.get(
  "/users/:id/stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get user activities
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", id);

      if (activitiesError) throw activitiesError;

      // Get user steps
      const { data: steps, error: stepsError } = await supabase
        .from("steps")
        .select("*")
        .eq("user_id", id);

      if (stepsError) throw stepsError;

      // Get user sleep
      const { data: sleep, error: sleepError } = await supabase
        .from("sleep")
        .select("*")
        .eq("user_id", id);

      if (sleepError) throw sleepError;

      // Get user water intake
      const { data: water, error: waterError } = await supabase
        .from("water")
        .select("*")
        .eq("user_id", id);

      if (waterError) throw waterError;

      res.json({
        activities,
        steps,
        sleep,
        water,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete user
router.delete(
  "/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase.auth.admin.deleteUser(id);

      if (error) throw error;

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
