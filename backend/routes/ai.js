// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const authenticateToken = require("../middleware/auth");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use a currently supported Groq model
const GROQ_MODEL = "llama-3.1-8b-instant"; // Updated to valid model

/**
 * POST /api/ai/ask - Now with Streaming!
 */
router.post("/ask", authenticateToken, async (req, res) => {
  // Handle client disconnection immediately
  req.on("close", () => {
    console.log("Client disconnected from AI stream");
    res.end();
  });

  try {
    const { message, userData, chatHistory = [] } = req.body;

    const systemPrompt = `You are an incredibly helpful, friendly, and highly motivational AI health coach.
        Your responses should be engaging, easy to understand, and always provide clear, actionable advice.
        Maintain a positive and encouraging tone throughout the conversation.

        CRITICAL FORMATTING RULES:
        1. NEVER use any markdown formatting symbols like **, *, #, -, etc.
        2. Use emojis frequently to make responses engaging and visual 🌟
        3. Use proper paragraph breaks with clear spacing
        4. Use simple text formatting with line breaks only
        5. Write in plain text format only - no bold, italics, or other formatting
        6. Use colons or numbers instead of markdown for lists
        7. ALWAYS end with a motivational statement or question to keep the user engaged
        8. ALWAYS tailor your advice based on the user's data and goals

        Here is some context about the user to help you personalize your responses:
        User data: ${JSON.stringify(userData)}`;

    const messages = [{ role: "system", content: systemPrompt }];

    chatHistory.forEach((item) => {
      messages.push({ role: item.role, content: item.content });
    });

    messages.push({ role: "user", content: message });

    // Set proper headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: GROQ_MODEL, // Use the updated model constant
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    // Stream with proper error handling
    for await (const chunk of chatCompletion) {
      if (res.headersSent) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({ completed: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("AI /ask error:", error);
    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          error: "Failed to generate AI response",
          details: error.message,
        })}\n\n`
      );
      res.end();
    } else {
      res.status(500).json({
        error: "AI service unavailable",
        details: error.message,
      });
    }
  }
});

module.exports = router;
