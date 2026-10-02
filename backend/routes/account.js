// backend/routes/account.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");

/**
 * Deletes a user and (through ON DELETE CASCADE) all of their data.
 * Requires the service_role key, so it must run on the server.
 */
async function deleteUserCompletely(userId) {
  // Challenges the user created may be joined by others: keep them, drop the author link.
  const { error: unlinkError } = await supabase
    .from("challenges")
    .update({ created_by: null })
    .eq("created_by", userId);
  if (unlinkError) throw unlinkError;

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

// DELETE /api/account - the signed-in user deletes their own account
router.delete("/", authenticateToken, async (req, res) => {
  try {
    await deleteUserCompletely(req.user.id);
    res.status(204).end();
  } catch (error) {
    console.error("Account deletion failed:", error);
    res.status(500).json({ error: "Failed to delete account. Please try again." });
  }
});

module.exports = router;
module.exports.deleteUserCompletely = deleteUserCompletely;
