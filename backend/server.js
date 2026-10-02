// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
// Render (and most hosts) sit one proxy in front of the app; needed so
// express-rate-limit reads the real client IP instead of logging a validation error.
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : [];

// ✅ Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

// ✅ Routes
app.use("/api/activities", require("./routes/activities"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/account", require("./routes/account"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/ai", require("./routes/ai")); // Groq-powered AI coach, challenges and insights
app.use("/api/challenges", require("./routes/challenges"));
app.use("/api", require("./routes/engagement")); // /api/achievements, /api/engagement/check
app.use("/api/public", require("./middleware/rateLimit").publicLimiter, require("./routes/public"));

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ✅ Analytics endpoint
app.use("/api/analytics", require("./routes/analytics"));

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request is too large." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON." });
  }
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, HOST, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
