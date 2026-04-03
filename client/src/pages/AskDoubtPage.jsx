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
    <section className="fade-in mx-auto max-w-4xl space-y-3">
      <div>
        <h1 className="text-2xl font-extrabold">Ask Doubt</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Same chat history is shared with the floating assistant while this tab is open.
        </p>
      </div>

      <SupportChatWindow
        messages={messages}
        loading={loading}
        error={error}
        input={question}
        onInputChange={setQuestion}
        onSend={askQuestion}
        onClearHistory={clearHistory}
      />
    </section>
  );
}

export default AskDoubtPage;
