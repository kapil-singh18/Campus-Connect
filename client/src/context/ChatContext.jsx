import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api/http.js";
import { useAuth } from "./AuthContext.jsx";

const ChatContext = createContext(null);
const CHAT_SESSION_KEY = "campus_connect_chat_session";

const readStoredHistory = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CHAT_SESSION_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => entry?.role && entry?.content)
      .map((entry) => ({
        role: entry.role,
        content: String(entry.content),
        createdAt: entry.createdAt || null,
        suggestions: Array.isArray(entry.suggestions)
          ? entry.suggestions.map((item) => String(item)).slice(0, 3)
          : [],
      }));
  } catch (_error) {
    return [];
  }
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => readStoredHistory());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const userRef = useRef(user?.id || null);

  useEffect(() => {
    sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const previousUserId = userRef.current;
    const nextUserId = user?.id || null;
    userRef.current = nextUserId;

    if (!nextUserId) {
      setMessages([]);
      sessionStorage.removeItem(CHAT_SESSION_KEY);
      return;
    }

    if (previousUserId && previousUserId !== nextUserId) {
      setMessages([]);
      sessionStorage.removeItem(CHAT_SESSION_KEY);
    }
  }, [user?.id]);

  const sendMessage = async (rawMessage) => {
    const message = String(rawMessage || "").trim();
    if (!message || loading) return;

    setError("");
    const newUserEntry = {
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    const historyForApi = [...messages, newUserEntry]
      .slice(-12)
      .map((entry) => ({ role: entry.role, content: entry.content }));

    setMessages((prev) => [...prev, newUserEntry]);
    setLoading(true);

    try {
      const response = await api.post("/chatbot/ask", {
        message,
        history: historyForApi,
      });

      const provider = String(response.data?.provider || "");
      const fallbackReason = String(response.data?.fallbackReason || "");
      const fallbackStatus = Number(response.data?.fallbackStatus || 0);
      const fallbackMessage = String(response.data?.fallbackMessage || "").trim();
      if (provider === "fallback") {
        const reasonMap = {
          missing_api_key: "Gemini API key is missing on backend. Chat is using backup mode.",
          quota_exceeded: "Gemini quota is exceeded. Chat is using backup mode.",
          invalid_api_key_or_permission: "Gemini key is invalid or permission is denied. Chat is using backup mode.",
          model_not_found: "Configured Gemini model is unavailable. Chat is using backup mode.",
          bad_request: "Gemini request configuration issue. Chat is using backup mode.",
          network_or_service_error: "Gemini service/network issue. Chat is using backup mode.",
          wit_quota_or_rate_limit: "Wit.ai quota/rate limit reached. Chat is using backup mode.",
          wit_invalid_token_or_permission: "Wit.ai token is invalid or permission denied. Chat is using backup mode.",
          wit_bad_request: "Wit.ai request configuration issue. Chat is using backup mode.",
          wit_network_or_service_error: "Wit.ai service/network issue. Chat is using backup mode.",
          wit_unavailable: "Wit.ai is currently unavailable. Chat is using backup mode.",
        };

        let reasonText =
          reasonMap[fallbackReason] ||
          "Gemini is unavailable right now (quota/network/model issue). Chat is using backup mode.";

        if (fallbackStatus) {
          reasonText = `${reasonText} [status ${fallbackStatus}]`;
        }
        if (fallbackMessage && fallbackReason !== "missing_api_key") {
          reasonText = `${reasonText} ${fallbackMessage}`;
        }

        setError(reasonText);
      } else {
        setError("");
      }

      const botEntry = {
        role: "bot",
        content: response.data.reply,
        createdAt: new Date().toISOString(),
        provider,
        fallbackReason,
        engineVersion: response.data?.engineVersion || "",
        suggestions: Array.isArray(response.data.suggestions)
          ? response.data.suggestions.map((item) => String(item)).slice(0, 3)
          : [],
      };

      setMessages((prev) => [...prev, botEntry]);
    } catch (sendError) {
      const fallbackEntry = {
        role: "bot",
        content: "I couldn't respond right now. Please try again in a moment.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackEntry]);
      setError(sendError?.response?.data?.message || "Unable to reach chatbot.");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    sessionStorage.removeItem(CHAT_SESSION_KEY);
  };

  const value = {
    messages,
    loading,
    error,
    sendMessage,
    clearHistory,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
};
