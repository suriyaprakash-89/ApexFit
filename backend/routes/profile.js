// backend/routes/profile.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");
const { sendServerError, sendBadRequest, toNumber } = require("../lib/http");

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
    sendServerError(res, error, "Failed to load profile.");
  }
});

// Update user profile (role and points are deliberately not editable here)
router.put("/", authenticateToken, async (req, res) => {
  const { name, age, weight, height, avatar_url } = req.body || {};
  const updates = {};

  if (name !== undefined) {
    if (name !== null && typeof name !== "string") return sendBadRequest(res, "name must be text");
    updates.name = name ? name.trim().slice(0, 100) : null;
  }
  for (const [key, value, limits] of [
    ["age", age, { min: 1, max: 120, integer: true }],
    ["weight", weight, { min: 1, max: 500 }],
    ["height", height, { min: 30, max: 300 }],
  ]) {
    if (value === undefined) continue;
    const n = toNumber(value, limits);
    if (Number.isNaN(n)) return sendBadRequest(res, `${key} is out of range`);
    updates[key] = n;
  }
  if (avatar_url !== undefined) {
    if (avatar_url !== null && (typeof avatar_url !== "string" || !/^https:\/\//.test(avatar_url))) {
      return sendBadRequest(res, "avatar_url must be an https URL");
    }
    updates.avatar_url = avatar_url;
  }
  if (!Object.keys(updates).length) return sendBadRequest(res, "Nothing to update.");
  updates.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    sendServerError(res, error, "Failed to update profile.");
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
      return sendBadRequest(res, "Weight and height are required to calculate BMI");
    }

    // BMI = weight (kg) / height (m)²
    const heightInMeters = data.height / 100;
    const bmi = data.weight / (heightInMeters * heightInMeters);
    res.json({ bmi: bmi.toFixed(1) });
  } catch (error) {
    sendServerError(res, error, "Failed to calculate BMI.");
  }
});

module.exports = router;
