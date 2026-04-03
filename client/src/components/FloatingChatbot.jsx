import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext.jsx";
import SupportChatWindow from "./SupportChatWindow.jsx";
import { SupportIcon } from "./icons.jsx";

function FloatingChatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, loading, error, sendMessage } = useChat();

  const onSend = async (prefilledText = "") => {
    const resolved = String(prefilledText || input).trim();
    if (!resolved || loading) return;
    setInput("");
    await sendMessage(resolved);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {open ? (
        <SupportChatWindow
          compact
          messages={messages}
          loading={loading}
          error={error}
          input={input}
          onInputChange={setInput}
          onSend={onSend}
          onOpenFull={() => {
            navigate("/ask-doubt");
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}

      {!open ? (
        <button
          type="button"
          className="grid h-[3.25rem] w-[3.25rem] place-items-center rounded-full border border-[#266ab4] bg-[#2f78c8] text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#266ab4]"
          onClick={() => setOpen(true)}
          aria-label="Open chatbot"
          title="Open chatbot"
        >
          <SupportIcon className="h-6 w-6" />
        </button>
      ) : null}
    </div>
  );
}

export default FloatingChatbot;
