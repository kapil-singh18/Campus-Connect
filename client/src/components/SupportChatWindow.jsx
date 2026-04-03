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

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[#d6dde7] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.17)] ${
        compact ? "w-[22.2rem]" : "w-full"
      }`}
    >
      <header className="flex items-center justify-between bg-[#2f78c8] px-4 py-3 text-white">
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <SupportIcon className="h-5 w-5" />
          Get Support
        </p>
        <div className="flex items-center gap-2">
          {compact ? (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md bg-white/20 px-2 text-xs font-semibold transition hover:bg-white/30"
              onClick={onOpenFull}
              title="Open full chat"
            >
              <ExpandIcon />
              Expand
            </button>
          ) : (
            <button
              type="button"
              className="rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/30"
              onClick={onClearHistory}
            >
              Clear
            </button>
          )}
          {compact ? (
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md bg-white/20 text-xs font-bold transition hover:bg-white/30"
              onClick={onClose}
              aria-label="Close chatbot"
              title="Close"
            >
              X
            </button>
          ) : null}
        </div>
      </header>

      <div className={`overflow-y-auto bg-[#f1f3f5] px-3 py-4 ${compact ? "h-[20rem]" : "h-[62vh] min-h-[28rem]"}`}>
        {effectiveMessages.map((message, index) => {
          const isUser = message.role === "user";
          return (
            <div
              key={`${message.role}-${index}-${message.createdAt || "0"}`}
              className={`mb-3 flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser ? (
                <img src={avatarImage} alt="Support" className="h-8 w-8 rounded-full object-cover shadow-sm" />
              ) : null}

              <div
                className={`max-w-[79%] rounded-[10px] px-3 py-2 text-sm leading-relaxed shadow-sm ${
                  isUser ? "bg-[#2f78c8] text-white" : "bg-[#ebedef] text-slate-800"
                }`}
              >
                {isUser ? <p>{message.content}</p> : <FormattedMessage content={message.content} />}
              </div>
            </div>
          );
        })}

        {showStarterSuggestions && latestBotIndex >= 0 ? (
          <div className="mb-3 ml-10 flex max-w-[82%] flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-[#8fb4df] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-[#2f78c8] transition hover:bg-white"
                onClick={() => onSend(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="mb-3 flex items-end gap-2">
            <img src={avatarImage} alt="Support" className="h-8 w-8 rounded-full object-cover shadow-sm" />
            <p className="rounded-[10px] bg-[#ebedef] px-3 py-2 text-sm text-slate-700 shadow-sm">Typing...</p>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#d6dde7] bg-white px-3 py-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <input
            className="h-10 w-full rounded-lg border border-[#ccd4df] bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#7fa6d4] focus:ring-2 focus:ring-[#d7e7f9]"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
          />
          <button
            type="submit"
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-[#2f78c8] px-3 text-white transition hover:bg-[#266ab4] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading || !input.trim()}
            title="Send message"
          >
            <SendIcon />
          </button>
        </form>
        {error ? <p className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}

export default SupportChatWindow;
