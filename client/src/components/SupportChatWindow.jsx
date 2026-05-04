import { useEffect, useMemo, useRef } from "react";
import avatarImage from "../assets/support-avatar.svg";
import FormattedMessage from "./FormattedMessage.jsx";
import { ExpandIcon, SendIcon, SupportIcon } from "./icons.jsx";

const quickPrompts = ["Track my events", "How to join a club?", "Suggest events for coding"];

function SupportChatWindow({
  messages,
  loading,
  error,
  input,
  onInputChange,
  onSend,
  onClearHistory,
  onOpenFull,
  onClose,
  compact = false,
  fullPage = false,
}) {
  const bottomRef = useRef(null);

  const effectiveMessages = useMemo(
    () =>
      messages.length
        ? messages
        : [
            {
              role: "bot",
              content: "Hello! I can help with clubs, events, and registrations.",
              suggestions: quickPrompts,
            },
          ],
    [messages],
  );

  const latestBotIndex = useMemo(() => {
    for (let index = effectiveMessages.length - 1; index >= 0; index -= 1) {
      if (effectiveMessages[index].role === "bot") return index;
    }
    return -1;
  }, [effectiveMessages]);

  const showStarterSuggestions = useMemo(
    () => !messages.some((entry) => entry.role === "user"),
    [messages],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [effectiveMessages.length, loading]);

  // For fullPage, fill the container; otherwise use fixed height
  const chatAreaStyle = fullPage
    ? { flex: 1, overflowY: "auto", background: "#f1f3f5", padding: "1rem 1.25rem" }
    : { overflowY: "auto", background: "#f1f3f5", padding: "0.75rem", height: compact ? "20rem" : "62vh", minHeight: "28rem" };

  const containerStyle = fullPage
    ? { display: "flex", flexDirection: "column", height: "100%", background: "#fff" }
    : { overflow: "hidden", borderRadius: "1rem", border: "1px solid #d6dde7", background: "#fff", boxShadow: "0 14px 34px rgba(15,23,42,0.17)", width: compact ? "22.2rem" : "100%" };

  return (
    <section style={containerStyle}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#2f78c8", padding: "0.75rem 1rem", color: "#fff", flexShrink: 0,
      }}>
        <p style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>
          <SupportIcon className="h-5 w-5" />
          Campus AI Assistant
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {compact ? (
            <button
              type="button"
              style={{ display: "inline-flex", height: "2rem", alignItems: "center", gap: "0.25rem", borderRadius: "0.375rem", background: "rgba(255,255,255,0.2)", padding: "0 0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}
              onClick={onOpenFull}
              title="Open full chat"
            >
              <ExpandIcon />
              Expand
            </button>
          ) : (
            <button
              type="button"
              style={{ borderRadius: "0.375rem", background: "rgba(255,255,255,0.2)", padding: "0.25rem 0.625rem", fontSize: "0.75rem", fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}
              onClick={onClearHistory}
            >
              Clear
            </button>
          )}
          {compact && (
            <button
              type="button"
              style={{ display: "grid", placeItems: "center", height: "2rem", width: "2rem", borderRadius: "0.375rem", background: "rgba(255,255,255,0.2)", fontSize: "0.75rem", fontWeight: 700, color: "#fff", border: "none", cursor: "pointer" }}
              onClick={onClose}
              aria-label="Close chatbot"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div style={chatAreaStyle}>
        {effectiveMessages.map((message, index) => {
          const isUser = message.role === "user";
          return (
            <div
              key={`${message.role}-${index}-${message.createdAt || "0"}`}
              style={{ marginBottom: "0.75rem", display: "flex", alignItems: "flex-end", gap: "0.5rem", justifyContent: isUser ? "flex-end" : "flex-start" }}
            >
              {!isUser && (
                <img src={avatarImage} alt="Support" style={{ height: "2rem", width: "2rem", borderRadius: "50%", objectFit: "cover", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }} />
              )}
              <div style={{
                maxWidth: "79%",
                borderRadius: "0.625rem",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                background: isUser ? "#2f78c8" : "#ebedef",
                color: isUser ? "#fff" : "#1e293b",
              }}>
                {isUser ? <p style={{ margin: 0 }}>{message.content}</p> : <FormattedMessage content={message.content} />}
              </div>
            </div>
          );
        })}

        {showStarterSuggestions && latestBotIndex >= 0 && (
          <div style={{ marginBottom: "0.75rem", marginLeft: "2.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", maxWidth: "82%" }}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                style={{
                  borderRadius: "9999px",
                  border: "1px solid #8fb4df",
                  background: "#f8fbff",
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#2f78c8",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#fff"}
                onMouseLeave={e => e.currentTarget.style.background = "#f8fbff"}
                onClick={() => onSend(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
            <img src={avatarImage} alt="Support" style={{ height: "2rem", width: "2rem", borderRadius: "50%", objectFit: "cover" }} />
            <p style={{ borderRadius: "0.625rem", background: "#ebedef", padding: "0.5rem 0.75rem", fontSize: "0.875rem", color: "#475569", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", margin: 0 }}>
              Typing…
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: "1px solid #d6dde7",
        background: "#fff",
        padding: "0.75rem",
        flexShrink: 0,
      }}>
        <form
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          onSubmit={(event) => { event.preventDefault(); onSend(); }}
        >
          <input
            style={{
              height: "2.5rem",
              width: "100%",
              borderRadius: "0.5rem",
              border: "1px solid #ccd4df",
              background: "#fff",
              padding: "0 0.75rem",
              fontSize: "0.875rem",
              color: "#1e293b",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "#7fa6d4"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(47,120,200,0.12)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#ccd4df"; e.currentTarget.style.boxShadow = "none"; }}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Type your question…"
            autoComplete="off"
          />
          <button
            type="submit"
            style={{
              display: "inline-flex",
              height: "2.5rem",
              minWidth: "2.5rem",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.5rem",
              background: loading || !input.trim() ? "#8fb4df" : "#2f78c8",
              padding: "0 0.75rem",
              color: "#fff",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              transition: "background 0.18s ease",
            }}
            disabled={loading || !input.trim()}
            title="Send message"
          >
            <SendIcon />
          </button>
        </form>
        {error && <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#dc2626" }}>{error}</p>}
      </div>
    </section>
  );
}

export default SupportChatWindow;
