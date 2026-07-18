// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const authenticateToken = require("../middleware/auth");
const supabase = require("../config/supabase");

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

router.post("/generate-challenge", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get user's recent activities and goals for context
    const [activitiesRes, goalsRes] = await Promise.all([
      supabase.from('activities').select('type, duration').eq('user_id', userId).limit(5),
      supabase.from('goals').select('goal_type, target_value').eq('user_id', userId).eq('achieved', false),
    ]);
    
    const recentActivities = activitiesRes.data || [];
    const activeGoals = goalsRes.data || [];

    // 2. Construct the detailed prompt for the AI
    const prompt = `
      You are a creative and encouraging fitness coach AI. Your task is to generate a new, personalized fitness challenge for a user.

      USER CONTEXT:
      - Recent Activities: ${JSON.stringify(recentActivities)}
      - Active Goals: ${JSON.stringify(activeGoals)}

      INSTRUCTIONS:
      1. Based on the user's context, invent a new, fun, and achievable challenge.
      2. The challenge should last between 3 to 7 days.
      3. The challenge 'type' MUST be one of the following: 'steps', 'sleep', 'workout', 'water'.
      4. The 'target_value' should be a single number representing the total to achieve (e.g., total steps, total minutes of workout).
      5. Give it a creative 'name' and a short, motivational 'description'.
      6. Assign 'points' between 50 and 300 based on difficulty.
      7. Your response MUST be a single, minified JSON object with no other text.

      EXAMPLE RESPONSE FORMAT:
      {"name":"Sunrise Runner","description":"Run for 20 minutes every morning for 5 days straight!","type":"workout","duration_days":5,"target_value":100,"points":150}
    `;

    // 3. Call the AI
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.8, // Be creative
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("AI did not return a response.");
    }
    
    // 4. Parse and validate the AI's JSON response
    let challengeData;
    try {
      challengeData = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse AI JSON response:", aiResponse);
      throw new Error("AI returned an invalid format.");
    }

    // 5. Save the new challenge to the database
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (challengeData.duration_days || 7));

    const { data: newChallenge, error: insertError } = await supabase
      .from('challenges')
      .insert({
        name: challengeData.name,
        description: challengeData.description,
        type: challengeData.type,
        target_value: challengeData.target_value,
        points: challengeData.points,
        end_date: endDate.toISOString().split('T')[0],
        is_public: true, // Make it public so others can see it too
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 6. Send the newly created challenge back to the frontend
    res.status(201).json(newChallenge);

  } catch (error) {
    console.error("Error generating AI challenge:", error);
    res.status(500).json({ error: "Failed to generate AI challenge." });
  }
});

module.exports = router;
