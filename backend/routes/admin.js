// backend/routes/admin.js
// All admin data goes through here: the profiles RLS policy only lets users read and
// update their OWN row, so admin listing/role changes can't be done from the browser.
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const supabase = require("../config/supabase");
const { deleteUserCompletely } = require("./account");
const { sendServerError, sendBadRequest } = require("../lib/http");

const ROLES = ["user", "admin"];

router.use(authenticateToken, requireAdmin);

// Get all users
router.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, role, points, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    sendServerError(res, error, "Failed to load users.");
  }
});

// Platform totals
router.get("/stats", async (req, res) => {
  try {
    const count = (table) => supabase.from(table).select("*", { count: "exact", head: true });
    const [users, activities, goals] = await Promise.all([count("profiles"), count("activities"), count("goals")]);
    const failed = [users, activities, goals].find((r) => r.error);
    if (failed) throw failed.error;
    res.json({ users: users.count ?? 0, activities: activities.count ?? 0, goals: goals.count ?? 0 });
  } catch (error) {
    sendServerError(res, error, "Failed to load stats.");
  }
});

// Get user activity stats
router.get("/users/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const forUser = (table) => supabase.from(table).select("*").eq("user_id", id);
    const [activities, steps, sleep, water] = await Promise.all([
      forUser("activities"),
      forUser("steps"),
      forUser("sleep"),
      forUser("water"),
    ]);
    const failed = [activities, steps, sleep, water].find((r) => r.error);
    if (failed) throw failed.error;

    res.json({ activities: activities.data, steps: steps.data, sleep: sleep.data, water: water.data });
  } catch (error) {
    sendServerError(res, error, "Failed to load user stats.");
  }
});

// Change a user's role
router.put("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  if (!ROLES.includes(role)) return sendBadRequest(res, `role must be one of: ${ROLES.join(", ")}`);
  if (id === req.user.id) return sendBadRequest(res, "You can't change your own role.");

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, role")
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "User not found" });

    // Mirror into app_metadata (only the service role can write it) so the
    // app can show/hide admin UI from the session without trusting user_metadata.
    const { error: metaError } = await supabase.auth.admin.updateUserById(id, { app_metadata: { role } });
    if (metaError) console.error("Failed to sync app_metadata role:", metaError);

    res.json(data);
  } catch (error) {
    sendServerError(res, error, "Failed to update role.");
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return sendBadRequest(res, "Use Settings to delete your own account.");
    }

    await deleteUserCompletely(id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    sendServerError(res, error, "Failed to delete user.");
  }
});

module.exports = router;
