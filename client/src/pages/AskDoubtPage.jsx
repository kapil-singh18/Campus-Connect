import { useState } from "react";
import { useChat } from "../context/ChatContext.jsx";
import SupportChatWindow from "../components/SupportChatWindow.jsx";

function AskDoubtPage() {
  const [question, setQuestion] = useState("");
  const { messages, loading, error, sendMessage, clearHistory } = useChat();

  const askQuestion = async (prefilledText = "") => {
    const trimmed = String(prefilledText || question).trim();
    if (!trimmed || loading) return;
    setQuestion("");
    await sendMessage(trimmed);
  };

  return (
    <div style={{
      position: "fixed",
      top: "var(--topbar-h, 64px)",
      left: "var(--sidebar-w, 260px)",
      right: 0,
      bottom: 0,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      zIndex: 1,
    }}>
      {/* Header strip */}
      <div style={{
        padding: "0.875rem 1.5rem 0.75rem",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
        flexShrink: 0,
      }}>
        <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "var(--text)", margin: 0 }}>
          Ask Doubt
        </h1>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
          AI-powered campus assistant — ask about clubs, events, registrations & more.
        </p>
      </div>

      {/* Chat window fills remaining space — MUST be flex:1 and overflow:hidden */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <SupportChatWindow
          messages={messages}
          loading={loading}
          error={error}
          input={question}
          onInputChange={setQuestion}
          onSend={askQuestion}
          onClearHistory={clearHistory}
          fullPage
        />
      </div>
    </div>
  );
}

export default AskDoubtPage;
