// backend/routes/activities.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");
const { sendServerError, sendBadRequest, isDate, toNumber } = require("../lib/http");
const { resolveToday } = require("../lib/fitnessContext");

const ACTIVITY_TYPES = ["running", "walking", "cycling", "swimming", "gym", "yoga", "other"];

/** Validate an activity body; `partial` allows omitted fields (for updates). */
function parseActivity(body, { partial = false } = {}) {
  const out = {};
  const { type, duration, calories, distance, notes, date } = body || {};

  if (type !== undefined || !partial) {
    if (!ACTIVITY_TYPES.includes(type)) return { error: `type must be one of: ${ACTIVITY_TYPES.join(", ")}` };
    out.type = type;
  }
  if (duration !== undefined || !partial) {
    const d = toNumber(duration, { min: 1, max: 1440, integer: true });
    if (d === null || Number.isNaN(d)) return { error: "duration must be 1–1440 minutes" };
    out.duration = d;
  }
  if (calories !== undefined || !partial) {
    const c = toNumber(calories, { min: 0, max: 10000, integer: true });
    if (c === null || Number.isNaN(c)) return { error: "calories must be 0–10000" };
    out.calories = c;
  }
  if (distance !== undefined) {
    const km = toNumber(distance, { min: 0, max: 1000 });
    if (Number.isNaN(km)) return { error: "distance must be 0–1000 km" };
    out.distance = km;
  }
  if (notes !== undefined) {
    if (notes !== null && typeof notes !== "string") return { error: "notes must be text" };
    out.notes = notes ? notes.slice(0, 500) : null;
  }
  if (date !== undefined) {
    if (!isDate(date)) return { error: "date must be YYYY-MM-DD" };
    out.date = date;
  }
  return { value: out };
}

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
    sendServerError(res, error, "Failed to load activities.");
  }
});

// Add a new activity
router.post("/", authenticateToken, async (req, res) => {
  const { value, error: invalid } = parseActivity(req.body);
  if (invalid) return sendBadRequest(res, invalid);

  try {
    const { data, error } = await supabase
      .from("activities")
      .insert([
        {
          ...value,
          user_id: req.user.id,
          // The client's local date, not the server's UTC date
          date: value.date || resolveToday(req.body.clientDate),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    sendServerError(res, error, "Failed to save activity.");
  }
});

// Update an activity
router.put("/:id", authenticateToken, async (req, res) => {
  const { value, error: invalid } = parseActivity(req.body, { partial: true });
  if (invalid) return sendBadRequest(res, invalid);
  if (!Object.keys(value).length) return sendBadRequest(res, "Nothing to update.");

  try {
    const { data, error } = await supabase
      .from("activities")
      .update(value)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select();

    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: "Activity not found" });
    res.json(data[0]);
  } catch (error) {
    sendServerError(res, error, "Failed to update activity.");
  }
});

// Delete an activity
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    sendServerError(res, error, "Failed to delete activity.");
  }
});

module.exports = router;
