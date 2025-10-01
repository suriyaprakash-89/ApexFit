// backend/routes/goals.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");

// Get all goals for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new goal
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { goal_type, target_value, deadline } = req.body;

    const { data, error } = await supabase
      .from("goals")
      .insert([
        {
          user_id: req.user.id,
          goal_type,
          target_value,
          deadline,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a goal
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { target_value, current_value, deadline, achieved } = req.body;

    const { data, error } = await supabase
      .from("goals")
      .update({ target_value, current_value, deadline, achieved })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a goal
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
