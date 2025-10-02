// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];

// ✅ Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// ✅ Routes
app.use("/api/activities", require("./routes/activities"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/ai", require("./routes/ai")); // <-- Gemini/OpenAI AI Coach route

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ✅ Analytics endpoint
app.use("/api/analytics", require("./routes/analytics"));

// ✅ AI health suggestions (mock fallback if AI service unavailable)
app.post(
  "/api/ai/suggestions",
  require("./middleware/auth"),
  async (req, res) => {
    const suggestions = [
      "Based on your activity, try adding 15 minutes of stretching to improve flexibility.",
      "Your water intake is lower than recommended. Aim for 8 glasses today.",
      "Consider varying your workout routine to target different muscle groups.",
    ];

    res.json({ suggestions });
  }
);

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, HOST, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
