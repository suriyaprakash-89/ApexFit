// backend/middleware/admin.js
const supabase = require("../config/supabase");

const requireAdmin = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Authorization failed" });
  }
};

module.exports = requireAdmin;
