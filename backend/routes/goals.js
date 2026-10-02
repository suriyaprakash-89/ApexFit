// backend/routes/goals.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");
const { sendServerError, sendBadRequest, isDate, toNumber } = require("../lib/http");

const GOAL_TYPES = ["steps", "calories", "sleep", "water", "weight", "workout"];

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
    sendServerError(res, error, "Failed to load goals.");
  }
});

// Add a new goal
router.post("/", authenticateToken, async (req, res) => {
  const { goal_type, target_value, deadline } = req.body || {};
  if (!GOAL_TYPES.includes(goal_type)) return sendBadRequest(res, `goal_type must be one of: ${GOAL_TYPES.join(", ")}`);
  const target = toNumber(target_value, { min: 0.01, max: 1000000 });
  if (target === null || Number.isNaN(target)) return sendBadRequest(res, "target_value must be a positive number");
  if (deadline != null && deadline !== "" && !isDate(deadline)) return sendBadRequest(res, "deadline must be YYYY-MM-DD");

  try {
    const { data, error } = await supabase
      .from("goals")
      .insert([{ user_id: req.user.id, goal_type, target_value: target, deadline: deadline || null }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    sendServerError(res, error, "Failed to create goal.");
  }
});

// Update a goal
router.put("/:id", authenticateToken, async (req, res) => {
  const { target_value, current_value, deadline, achieved } = req.body || {};
  const updates = {};

  if (target_value !== undefined) {
    const t = toNumber(target_value, { min: 0.01, max: 1000000 });
    if (t === null || Number.isNaN(t)) return sendBadRequest(res, "target_value must be a positive number");
    updates.target_value = t;
  }
  if (current_value !== undefined) {
    const c = toNumber(current_value, { min: 0, max: 1000000 });
    if (c === null || Number.isNaN(c)) return sendBadRequest(res, "current_value must be 0 or more");
    updates.current_value = c;
  }
  if (deadline !== undefined) {
    if (deadline !== null && deadline !== "" && !isDate(deadline)) return sendBadRequest(res, "deadline must be YYYY-MM-DD");
    updates.deadline = deadline || null;
  }
  if (achieved !== undefined) {
    if (typeof achieved !== "boolean") return sendBadRequest(res, "achieved must be true or false");
    updates.achieved = achieved;
  }
  if (!Object.keys(updates).length) return sendBadRequest(res, "Nothing to update.");
  updates.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select();

    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: "Goal not found" });
    res.json(data[0]);
  } catch (error) {
    sendServerError(res, error, "Failed to update goal.");
  }
});

// Delete a goal
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    sendServerError(res, error, "Failed to delete goal.");
  }
});

module.exports = router;
