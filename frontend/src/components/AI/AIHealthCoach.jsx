// frontend/src/components/AI/AIHealthCoach.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Brain, Send, Square, Sparkles, RotateCcw } from "lucide-react";
import toast from "@/lib/toast";
import { apiFetch, apiJson, withClientDate } from "../../lib/api";
import { confirmDialog } from "../../store/confirmStore";
import { localDate } from "../../utils/date";

const MAX_CHARS = 2000;
const HISTORY_FOR_FALLBACK = 12;

const FALLBACK_SUGGESTIONS = [
  "Suggest a 20-minute workout",
  "How can I sleep better?",
  "What should I eat after a workout?",
  "Tips for staying motivated",
];

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const markdownComponents = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

const TypingDots = () => (
  <div className="flex items-center gap-1 py-1" aria-label="Coach is typing">
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="h-2 w-2 animate-bounce rounded-full bg-pulse-400"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

const CoachAvatar = () => (
  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pulse-500/15 ring-1 ring-pulse-500/30">
    <Brain className="h-4 w-4 text-pulse-400" aria-hidden="true" />
  </div>
);

const AIHealthCoach = () => {
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);
  const [persisted, setPersisted] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);
  const stickToBottom = useRef(true);
  const [params, setParams] = useSearchParams();

  // Load the saved conversation + personalised starter prompts
  useEffect(() => {
    let cancelled = false;
    apiJson(`/api/ai/history?${withClientDate()}`)
      .then((data) => {
        if (cancelled) return;
        setMessages((data.messages || []).map((m) => ({ id: m.id, role: m.role, content: m.content })));
        if (data.suggestions?.length) setSuggestions(data.suggestions);
        setPersisted(data.persisted !== false);
      })
      .catch((err) => console.warn("Could not load coach history:", err.message))
      .finally(() => !cancelled && setHistoryLoading(false));
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  // A suggestion from the dashboard (?prompt=...) pre-fills the box; the user decides whether to send it
  useEffect(() => {
    const prompt = params.get("prompt");
    if (prompt) {
      setInput(prompt.slice(0, MAX_CHARS));
      setParams({}, { replace: true });
      textareaRef.current?.focus();
    }
  }, [params, setParams]);

  // Follow new content only if the user hasn't scrolled up to read
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  // Auto-grow the textarea up to ~6 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const updateMessage = (id, patch) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const handleSend = useCallback(
    async (customMessage) => {
      const text = (customMessage ?? input).trim();
      if (!text || streaming) return;
      if (text.length > MAX_CHARS) {
        toast.error(`Please keep messages under ${MAX_CHARS} characters.`);
        return;
      }

      const history = messages
        .filter((m) => !m.error && m.content)
        .slice(-HISTORY_FOR_FALLBACK)
        .map(({ role, content }) => ({ role, content }));
      const assistantId = newId();
      setInput("");
      stickToBottom.current = true;
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", content: text },
        { id: assistantId, role: "assistant", content: "", pending: true },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let content = "";

      try {
        const response = await apiFetch("/api/ai/ask", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            clientDate: localDate(),
            // Only used by the server if it can't read saved history
            history: persisted ? undefined : history,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "The coach is unavailable right now. Please try again.");
        }
        if (!response.body) throw new Error("No response from the coach.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // SSE events are separated by a blank line; a network chunk can end
        // mid-event, so keep the incomplete tail in `buffer` for the next read.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop();

          for (const event of events) {
            const line = event.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            let data;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (data.error) throw new Error(data.error);
            if (data.content) {
              content += data.content;
              updateMessage(assistantId, { content, pending: false });
            }
          }
        }

        if (!content) throw new Error("The coach didn't reply. Please try again.");
        updateMessage(assistantId, { pending: false });
      } catch (error) {
        if (error.name === "AbortError") {
          updateMessage(assistantId, {
            pending: false,
            content: content || "_Stopped._",
            stopped: true,
          });
        } else {
          updateMessage(assistantId, {
            pending: false,
            error: true,
            content: content ? `${content}\n\n_${error.message}_` : error.message,
          });
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
        textareaRef.current?.focus();
      }
    },
    [input, streaming, messages, persisted]
  );

  const handleStop = () => abortRef.current?.abort();

  const handleNewChat = async () => {
    const ok = await confirmDialog({
      title: "Start a new chat?",
      message: "Your current conversation with the coach will be cleared.",
      confirmText: "Clear chat",
    });
    if (!ok) return;
    try {
      if (persisted) await apiJson("/api/ai/history", { method: "DELETE" });
      setMessages([]);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line (ignore Enter while composing IME text)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const nearLimit = input.length > MAX_CHARS * 0.8;

  return (
    <section
      className="coach-height flex flex-col overflow-hidden bg-card sm:rounded-2xl sm:border sm:border-border sm:shadow-card"
      aria-label="AI health coach chat"
    >
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pulse-500/15 ring-1 ring-pulse-500/30">
            <Brain className="h-5 w-5 text-pulse-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold text-foreground">Apex · AI Coach</h1>
            <p className="text-xs text-muted truncate">Personalised with your last 7 days of data</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleNewChat}
            disabled={streaming}
            className="btn-soft min-h-[40px] px-3"
            aria-label="Start a new chat"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        )}
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        role="log"
        aria-live="polite"
        aria-busy={streaming}
      >
        {historyLoading ? (
          <div className="space-y-4" aria-hidden="true">
            <div className="skeleton h-16 w-3/4" />
            <div className="skeleton h-10 w-1/2 ml-auto" />
            <div className="skeleton h-20 w-2/3" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pulse-500/15 ring-1 ring-pulse-500/30">
              <Sparkles className="h-7 w-7 text-pulse-400" aria-hidden="true" />
            </div>
            <p className="font-display text-lg font-bold text-foreground">Hi, I&apos;m Apex, your coach.</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              I can see your recent steps, sleep, water, workouts and goals, so my answers are about you. Pick a question below or ask your own.
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="What the coach can see">
              {["Steps", "Sleep", "Water", "Workouts", "Goals"].map((t) => (
                <li key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <li key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap break-words">
                    <span className="sr-only">You: </span>
                    {msg.content}
                  </div>
                </li>
              ) : (
                <li key={msg.id} className="flex items-start gap-2.5">
                  <CoachAvatar />
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tl-md px-4 py-2.5 ${
                      msg.error
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <span className="sr-only">Coach: </span>
                    {msg.pending ? (
                      <TypingDots />
                    ) : (
                      <div className="prose-chat">
                        <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    {msg.error && (
                      <button
                        onClick={() => {
                          const lastUser = [...messages].reverse().find((m) => m.role === "user");
                          if (lastUser) handleSend(lastUser.content);
                        }}
                        disabled={streaming}
                        className="mt-2 text-sm font-semibold underline"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border px-3 pb-3 pt-3 sm:px-4">
        {!streaming && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1" aria-label="Suggested questions">
            {suggestions.map((question) => (
              <button
                key={question}
                onClick={() => handleSend(question)}
                className="shrink-0 min-h-[40px] whitespace-nowrap rounded-full border border-border bg-background/50 px-3.5 text-sm text-foreground/90 transition-colors hover:border-primary/40 hover:bg-primary/10"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <label htmlFor="coach-input" className="sr-only">
            Message the coach
          </label>
          <textarea
            id="coach-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MAX_CHARS}
            placeholder="Ask about workouts, food, sleep…"
            className="input-field resize-none leading-6 py-2.5"
            enterKeyHint="send"
          />
          {streaming ? (
            <button type="button" onClick={handleStop} className="btn-secondary shrink-0 w-11 !px-0" aria-label="Stop generating">
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="btn-primary shrink-0 w-11 !px-0"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
        <div className="mt-2 flex justify-between gap-2 text-[11px] text-muted-foreground">
          <span>General guidance, not medical advice.</span>
          {nearLimit && (
            <span className={input.length >= MAX_CHARS ? "text-destructive" : ""}>
              {input.length}/{MAX_CHARS}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default AIHealthCoach;
