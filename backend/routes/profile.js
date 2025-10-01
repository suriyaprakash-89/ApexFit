// backend/routes/profile.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");

// Get user profile
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put("/", authenticateToken, async (req, res) => {
  try {
    const { name, age, weight, height, avatar_url } = req.body;

    const { data, error } = await supabase
      .from("profiles")
      .update({ name, age, weight, height, avatar_url })
      .eq("id", req.user.id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate BMI
router.get("/bmi", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("weight, height")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    if (!data.weight || !data.height) {
      return res
        .status(400)
        .json({ error: "Weight and height are required to calculate BMI" });
    }

    // Calculate BMI: weight (kg) / (height (m) * height (m))
    const heightInMeters = data.height / 100;
    const bmi = data.weight / (heightInMeters * heightInMeters);

    res.json({ bmi: bmi.toFixed(1) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;