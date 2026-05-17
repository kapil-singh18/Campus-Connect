import { useEffect, useRef, useState } from "react";
import { useChat } from "../context/ChatContext.jsx";

const QUICK_PROMPTS = [
  "How do I join a club?",
  "Show upcoming events",
  "How to register for an event?",
  "What clubs are available?",
  "Track my registrations",
];

// Inline bot avatar
function BotAvatar() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#2f78c8,#1a5fa0)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    </div>
  );
}

function AskDoubtPage() {
  const [question, setQuestion] = useState("");
  const { messages, loading, error, sendMessage, clearHistory } = useChat();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const hasUserMessage = messages.some(m => m.role === "user");

  const askQuestion = async (text = "") => {
    const trimmed = String(text || question).trim();
    if (!trimmed || loading) return;
    setQuestion("");
    await sendMessage(trimmed);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: "var(--topbar-h, 64px)",
      left: "var(--sidebar-w, 260px)",
      right: 0, bottom: 0,
      display: "flex", flexDirection: "column",
      background: "var(--bg)", zIndex: 1,
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.875rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg,#2f78c8,#1a5fa0)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.125rem", color: "var(--text)", margin: 0, lineHeight: 1 }}>
              Ask Doubt
            </h1>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.15rem" }}>
              AI-powered campus assistant
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.3rem 0.625rem", borderRadius: 999, background: "var(--success-soft)", border: "1px solid rgba(5,150,105,0.2)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--success)" }}>Online</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                padding: "0.35rem 0.75rem", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
                border: "1px solid var(--border)", background: "var(--panel-muted)",
                color: "var(--muted)", cursor: "pointer", transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "var(--danger)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              Clear chat
            </button>
          )}
        </div>
      </div>

      {/* ── Messages area ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* Welcome state */}
        {!hasUserMessage && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "2rem" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: "linear-gradient(135deg,#2f78c8,#1a5fa0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "1.25rem",
              boxShadow: "0 8px 24px rgba(47,120,200,0.25)",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.375rem", color: "var(--text)", margin: 0 }}>
              How can I help you today?
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.5rem", maxWidth: 380 }}>
              Ask about clubs, events, registrations, or anything campus-related.
            </p>

            {/* Quick prompts */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginTop: "1.5rem", maxWidth: 520 }}>
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => askQuestion(prompt)}
                  disabled={loading}
                  style={{
                    padding: "0.5rem 0.875rem", borderRadius: 999, fontSize: "0.8125rem", fontWeight: 600,
                    border: "1px solid var(--border)", background: "var(--panel)",
                    color: "var(--text)", cursor: "pointer", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--brand-soft)"; e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--brand)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--panel)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} style={{
              display: "flex", gap: "0.625rem",
              flexDirection: isUser ? "row-reverse" : "row",
              alignItems: "flex-end",
            }}>
              {!isUser && <BotAvatar />}
              {isUser && (
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: "var(--panel-muted)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: "var(--muted)",
                }}>
                  YOU
                </div>
              )}
              <div style={{
                maxWidth: "72%",
                padding: "0.625rem 0.875rem",
                borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                fontSize: "0.875rem", lineHeight: 1.65,
                background: isUser ? "linear-gradient(135deg,#2f78c8,#1a5fa0)" : "var(--panel)",
                color: isUser ? "#fff" : "var(--text)",
                border: isUser ? "none" : "1px solid var(--border)",
                boxShadow: isUser ? "0 4px 12px rgba(47,120,200,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-end" }}>
            <BotAvatar />
            <div style={{
              padding: "0.75rem 1rem", borderRadius: "14px 14px 14px 4px",
              background: "var(--panel)", border: "1px solid var(--border)",
              display: "flex", gap: "0.3rem", alignItems: "center",
            }}>
              {[0, 1, 2].map(j => (
                <span key={j} style={{
                  width: 7, height: 7, borderRadius: "50%", background: "var(--brand)",
                  display: "inline-block",
                  animation: `typingDot 1.4s ease-in-out ${j * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: "0.625rem 0.875rem", borderRadius: 10,
            background: "var(--danger-soft)", border: "1px solid rgba(220,38,38,0.2)",
            fontSize: "0.8125rem", color: "var(--danger)", fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--border)",
        background: "var(--panel)",
        padding: "1rem 1.5rem",
        flexShrink: 0,
      }}>
        {/* Quick prompts (after conversation started) */}
        {hasUserMessage && !loading && (
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", marginBottom: "0.75rem", paddingBottom: "0.125rem" }}>
            {QUICK_PROMPTS.slice(0, 3).map(prompt => (
              <button
                key={prompt}
                onClick={() => askQuestion(prompt)}
                style={{
                  whiteSpace: "nowrap", padding: "0.3rem 0.7rem", borderRadius: 999,
                  fontSize: "0.7rem", fontWeight: 600, border: "1px solid var(--border)",
                  background: "var(--panel-muted)", color: "var(--muted)", cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--brand)"; e.currentTarget.style.borderColor = "var(--glass-border)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={e => { e.preventDefault(); askQuestion(); }}
          style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about campus…"
            style={{
              flex: 1, padding: "0.7rem 1rem", borderRadius: 12,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: "var(--text)", fontSize: "0.875rem", resize: "none",
              outline: "none", fontFamily: "Inter,sans-serif", lineHeight: 1.5,
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = "var(--brand)"; e.target.style.boxShadow = "0 0 0 3px var(--brand-glow)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12, border: "none",
              background: loading || !question.trim() ? "var(--border)" : "linear-gradient(135deg,#2f78c8,#1a5fa0)",
              color: "#fff", cursor: loading || !question.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s ease", flexShrink: 0,
            }}
            onMouseEnter={e => { if (!loading && question.trim()) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
        <p style={{ fontSize: "0.7rem", color: "var(--muted)", textAlign: "center", marginTop: "0.5rem" }}>
          Press <kbd style={{ padding: "0.1rem 0.35rem", borderRadius: 4, border: "1px solid var(--border)", fontSize: "0.65rem", background: "var(--panel-muted)" }}>Enter</kbd> to send · <kbd style={{ padding: "0.1rem 0.35rem", borderRadius: 4, border: "1px solid var(--border)", fontSize: "0.65rem", background: "var(--panel-muted)" }}>Shift+Enter</kbd> for new line
        </p>
      </div>

      {/* Typing dot animation */}
      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default AskDoubtPage;
