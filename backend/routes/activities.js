// backend/routes/activities.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");

// Get all activities for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", req.user.id)
      .order("date", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new activity
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { type, duration, calories, distance, notes, date } = req.body;

    const { data, error } = await supabase
      .from("activities")
      .insert([
        {
          user_id: req.user.id,
          type,
          duration,
          calories,
          distance,
          notes,
          date: date || new Date().toISOString().split("T")[0],
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an activity
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, duration, calories, distance, notes, date } = req.body;

    const { data, error } = await supabase
      .from("activities")
      .update({ type, duration, calories, distance, notes, date })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an activity
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
