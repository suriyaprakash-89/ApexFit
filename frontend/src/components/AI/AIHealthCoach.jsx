import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { Brain, Send, Sparkles } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const AIHealthCoach = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const { user, session } = useAuthStore();
  const { isDark } = useTheme();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customMessage) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim()) return;

    setInput("");
    setLoading(true);

    // Add user message to chat immediately
    const newUserMessage = {
      id: Date.now(), // Added id for consistency
      role: "user",
      content: messageToSend,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Prepare chat history for context
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call your Groq AI backend
      const response = await fetch("http://localhost:3001/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: messageToSend,
          userData: user || {},
          chatHistory: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponseContent = "";

      // Create a placeholder for the AI message with loading state
      const aiMessageId = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          isLoading: true,
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n\n")
          .filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix

            if (data.error) {
              console.error("AI Error:", data.error, data.details);
              aiResponseContent += ` ❌ Error: ${data.error}`;
            } else if (data.content) {
              aiResponseContent += data.content;
            }

            // Update the AI message with streaming content and remove loading
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: aiResponseContent, isLoading: false }
                  : msg
              )
            );
          } catch (e) {
            console.error("Error parsing stream chunk:", e, line);
          }
        }
      }
    } catch (error) {
      console.error("AI API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(), // ← CRITICAL FIX: Added id property
          role: "assistant",
          content:
            "❌ I'm having trouble connecting to the AI service. Please try again later.",
          timestamp: Date.now(),
          isLoading: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "Suggest a 20-minute workout",
    "How to improve sleep quality?",
    "What should I eat after workout?",
    "How many steps should I aim for?",
    "Tips for staying motivated",
  ];

  // Loading dots component
  const LoadingDots = () => (
    <div className="flex items-center space-x-1">
      <div
        className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
        style={{ animationDelay: "0ms" }}
      ></div>
      <div
        className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
        style={{ animationDelay: "150ms" }}
      ></div>
      <div
        className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
        style={{ animationDelay: "300ms" }}
      ></div>
    </div>
  );

  const formatMessageContent = (content) => {
    if (!content) return null;

    // Split by double newlines for paragraphs
    return content.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-3">
        {paragraph.split("\n").map((line, lineIndex, array) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < array.length - 1 && <br />}
          </span>
        ))}
      </p>
    ));
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col transition-colors duration-200"
      style={{ height: "70vh" }}
    >
      <div className="flex items-center mb-4 flex-shrink-0">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3 transition-colors duration-200">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-300" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white transition-colors duration-200">
            AI Health Coach
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
            Powered by Groq AI
          </p>
        </div>
      </div>

      {/* Chat messages container with theme-aware scrollbar */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 chat-container"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: isDark ? "#7c3aed #374151" : "#8b5cf6 #f3f4f6",
        }}
      >
        {/* Inline styles for Webkit browsers */}
        <style>
          {`
            .chat-container::-webkit-scrollbar {
              width: 8px;
            }
            .chat-container::-webkit-scrollbar-track {
              background: ${isDark ? "#374151" : "#f3f4f6"};
              border-radius: 4px;
            }
            .chat-container::-webkit-scrollbar-thumb {
              background: ${isDark ? "#7c3aed" : "#8b5cf6"};
              border-radius: 4px;
            }
            .chat-container::-webkit-scrollbar-thumb:hover {
              background: ${isDark ? "#6d28d9" : "#7c3aed"};
            }
          `}
        </style>

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center text-gray-500 dark:text-gray-400 transition-colors duration-200">
              <Sparkles className="w-8 h-8 mx-auto mb-2" />
              <p>Ask me anything about fitness, nutrition, or health goals!</p>
              <p className="text-xs mt-2">Powered by advanced AI</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-1">
            {messages.map((msg, index) => (
              <div
                key={`${msg.timestamp}-${index}`}
                className={`p-3 rounded-lg transition-colors duration-200 ${
                  msg.role === "user"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ml-8"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-8"
                }`}
              >
                {msg.isLoading ? (
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 transition-colors duration-200">
                    <LoadingDots />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {formatMessageContent(msg.content)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0">
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about fitness, nutrition, etc."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSend(question)}
              disabled={loading}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 truncate disabled:opacity-50 transition-colors duration-200"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIHealthCoach;
