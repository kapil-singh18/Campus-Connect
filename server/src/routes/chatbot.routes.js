import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { authenticate } from "../middleware/auth.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { env } from "../config/env.js";
import { getEventStatus } from "../utils/date.js";
import { chatbotRateLimiter } from "../middleware/security.js";

const router = Router();
const CHATBOT_ENGINE_VERSION = "cc-chat-v4";

const ROLE_CAPABILITIES = {
  admin: [
    "Create clubs and assign managers.",
    "Create events for any club.",
    "View all events, clubs, and overall dashboards.",
    "Receive registration and membership notifications.",
  ],
  manager: [
    "Create clubs and events.",
    "Edit or delete only events from clubs they manage.",
    "Delete only clubs they manage.",
    "View participant and member lists for their clubs/events.",
    "Receive live notifications when students join/leave or register/unregister.",
  ],
  student: [
    "Browse clubs and events.",
    "Join or leave clubs.",
    "Register or unregister from events (with profile details).",
    "Track joined clubs and registered events on dashboard.",
  ],
};

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .map((entry) => ({
      role: entry?.role === "user" ? "user" : "assistant",
      content: String(entry?.content || "").trim(),
    }))
    .filter((entry) => entry.content)
    .slice(-14);
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAnyKeyword = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const rankEventsByContext = (events, contextText) => {
  const contextTokens = normalizeText(contextText)
    .split(" ")
    .filter((token) => token.length >= 3);

  return [...events]
    .map((event) => {
      const eventText = normalizeText(
        `${event.title} ${event.description} ${event.category} ${event.venue} ${event.club?.name || ""}`
      );

      let score = 0;
      if (contextText) {
        if (normalizeText(contextText).includes(normalizeText(event.title))) score += 9;
        if (normalizeText(contextText).includes(normalizeText(event.category))) score += 5;
        if (normalizeText(contextText).includes(normalizeText(event.club?.name || ""))) score += 4;
        for (const token of contextTokens) {
          if (eventText.includes(token)) score += 2;
        }
      }

      const status = getEventStatus(event.date);
      if (status === "ongoing") score += 5;
      if (status === "upcoming") score += 4;
      if (status === "completed") score += 1;

      return { event, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(left.event.date).getTime() - new Date(right.event.date).getTime();
    })
    .map((entry) => entry.event);
};

const rankClubsByContext = (clubs, contextText) => {
  const contextTokens = normalizeText(contextText)
    .split(" ")
    .filter((token) => token.length >= 3);

  return [...clubs]
    .map((club) => {
      const clubText = normalizeText(`${club.name} ${club.category}`);
      let score = 0;

      if (contextText) {
        if (normalizeText(contextText).includes(normalizeText(club.name))) score += 8;
        if (normalizeText(contextText).includes(normalizeText(club.category))) score += 5;
        for (const token of contextTokens) {
          if (clubText.includes(token)) score += 2;
        }
      }

      return { club, score };
    })
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.club);
};

const toShortEventLine = (event) =>
  `${event.title} (${getEventStatus(event.date)}) on ${new Date(event.date).toLocaleDateString("en-IN")} at ${event.venue}`;

const buildIntentSnapshot = (contextText) => {
  const intent = {
    role: hasAnyKeyword(contextText, ["role", "admin", "manager", "student", "permission", "access", "who can"]),
    event: hasAnyKeyword(contextText, [
      "event",
      "upcoming",
      "ongoing",
      "completed",
      "schedule",
      "date",
      "venue",
      "calendar",
    ]),
    club: hasAnyKeyword(contextText, ["club", "join", "member", "society", "community"]),
    registration: hasAnyKeyword(contextText, [
      "register",
      "unregister",
      "participant",
      "registration",
      "deadline",
      "capacity",
      "close registration",
    ]),
    dashboard: hasAnyKeyword(contextText, ["dashboard", "stats", "activity", "notification", "log"]),
    auth: hasAnyKeyword(contextText, ["login", "signup", "password", "jwt", "auth"]),
    export: hasAnyKeyword(contextText, ["csv", "export", "download list", "participants list", "members list"]),
  };

  return intent;
};

const sanitizeSuggestions = (rawSuggestions, fallbackSuggestions = []) => {
  const suggestions = [];

  const push = (value) => {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    if (clean.length < 6) return;
    if (suggestions.includes(clean)) return;
    suggestions.push(clean);
  };

  if (Array.isArray(rawSuggestions)) {
    rawSuggestions.forEach(push);
  }

  if (Array.isArray(fallbackSuggestions)) {
    fallbackSuggestions.forEach(push);
  }

  const genericBackups = [
    "Can you explain this step-by-step for my role?",
    "Which page should I open first for this task?",
    "What should I do next in Campus Connect?",
  ];
  genericBackups.forEach(push);

  return suggestions.slice(0, 3);
};

const buildFallbackSuggestions = ({ message, history, events, clubs, userRole }) => {
  const recentUserMessages = history
    .filter((entry) => entry.role === "user")
    .slice(-4)
    .map((entry) => entry.content);
  const contextText = normalizeText([...recentUserMessages, message].join(" "));
  const intent = buildIntentSnapshot(contextText);

  const rankedEvents = rankEventsByContext(events, contextText);
  const rankedClubs = rankClubsByContext(clubs, contextText);
  const topEvent = rankedEvents[0];
  const secondEvent = rankedEvents[1];
  const topClub = rankedClubs[0];

  const suggestions = [];
  const push = (value) => {
    const clean = String(value || "").trim();
    if (!clean || suggestions.includes(clean)) return;
    suggestions.push(clean);
  };

  if (intent.role) {
    push(`What can a manager do that ${userRole} cannot?`);
    push("Who can close registration and who can still register?");
    push("Which role should I use for club and event management?");
  }

  if (intent.event || intent.registration) {
    if (topEvent) {
      push(`Show full details of ${topEvent.title}.`);
      push(`Is registration open for ${topEvent.title}?`);
    }
    if (secondEvent) {
      push(`Compare ${topEvent.title} and ${secondEvent.title}.`);
    }
    push("Show upcoming events with available seats.");
  }

  if (intent.club) {
    if (topClub) {
      push(`Show me events from ${topClub.name}.`);
      push(`How do I join ${topClub.name}?`);
    }
    push("Which clubs match technology and coding interests?");
  }

  if (intent.dashboard) {
    push("Explain manager dashboard sections in simple flow.");
    push("How are notifications and activity logs different?");
    push("Where can I track member and participant counts?");
  }

  if (intent.export) {
    push("How do I export participants CSV from event details?");
    push("How do I export members CSV from club details?");
    push("Which role can export participant/member lists?");
  }

  if (intent.auth) {
    push("How do signup and login roles affect available actions?");
    push("What should I do if token/session expires?");
    push("Can students access manager controls?");
  }

  if (!suggestions.length) {
    const topTopic = message.trim();
    push(`Can you explain "${topTopic}" with exact page steps?`);
    push("What should I do next for this task?");
    push("Give me the quickest flow for this in Campus Connect.");
  }

  while (suggestions.length < 3) {
    push("What should I do next for this task?");
    push("Can you explain this with exact page steps?");
    push("Which page should I open first for this?");
  }

  return suggestions.slice(0, 3);
};

const buildDynamicFallbackReply = ({ message, history, events, clubs, userRole }) => {
  const recentUserMessages = history
    .filter((entry) => entry.role === "user")
    .slice(-4)
    .map((entry) => entry.content);
  const contextText = normalizeText([...recentUserMessages, message].join(" "));
  const intent = buildIntentSnapshot(contextText);

  const rankedEvents = rankEventsByContext(events, contextText);
  const rankedClubs = rankClubsByContext(clubs, contextText);
  const visibleEvents = rankedEvents.slice(0, 3);
  const visibleClubs = rankedClubs.slice(0, 3);
  const topEvent = visibleEvents[0];
  const topClub = visibleClubs[0];

  if (intent.role) {
    const roleLines = Object.entries(ROLE_CAPABILITIES)
      .map(([role, actions]) => `- ${role}: ${actions.join(" ")}`)
      .join("\n");

    return `Here is the role-based flow for Campus Connect.\n\n${roleLines}\n\nYour current role is ${userRole}. Ask for any role-specific walkthrough and I will map exact page steps.`;
  }

  if (intent.event || intent.registration) {
    if (!visibleEvents.length) {
      return `You asked about events/registration, but I don't see event records right now.\n\nIf you are admin/manager, create events first. If data exists, refresh Events page and ask again.`;
    }

    const lines = visibleEvents.map((event, index) => `${index + 1}. ${toShortEventLine(event)}`).join("\n");
    return `Based on your current chat context, these events are most relevant:\n${lines}\n\nI can also guide registration status, deadlines, and participant limits for each one.`;
  }

  if (intent.club) {
    if (!visibleClubs.length) {
      return "You asked about clubs, but no clubs are available in current dataset.\n\nCreate clubs first from Clubs page, then I can recommend by category.";
    }

    const clubLines = visibleClubs
      .map((club, index) => `${index + 1}. ${club.name} (${club.category})`)
      .join("\n");

    return `These clubs match your current query:\n${clubLines}\n\nStudents can join/leave clubs, and managers can view member lists and related event activity.`;
  }

  if (intent.dashboard) {
    return "Dashboard is role-based.\n\nAdmin: platform-level counts and event overview.\nManager: managed clubs/events, registrations, notifications, and activity log.\nStudent: joined clubs, registered events, and upcoming activities.";
  }

  if (intent.auth) {
    return "Authentication uses signup/login with JWT session.\n\nRole controls what actions are visible and allowed.\nIf session expires, login again to refresh token and permissions.";
  }

  const topic = String(message || "").trim();
  const eventHint = topEvent ? `A related event is ${toShortEventLine(topEvent)}.` : "";
  const clubHint = topClub ? `A related club is ${topClub.name} (${topClub.category}).` : "";

  return `I understood your question about "${topic}".\n\n${eventHint}\n${clubHint}\n\nAsk me for exact steps by role, and I will give a direct workflow for this task.`;
};

const extractJsonObjectFromText = (rawText) => {
  const text = String(rawText || "").trim();
  if (!text) return null;

  const withoutFence = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch (_error) {
    // continue
  }

  const first = withoutFence.indexOf("{");
  const last = withoutFence.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;

  const sliced = withoutFence.slice(first, last + 1);
  try {
    return JSON.parse(sliced);
  } catch (_error) {
    return null;
  }
};

const mapGeminiFailure = (error) => {
  const status =
    Number(error?.status || error?.code || error?.response?.status || error?.response?.statusCode || 0) || null;
  const rawMessage = String(
    error?.message || error?.error?.message || error?.response?.data?.error?.message || error?.response?.data?.message || ""
  )
    .replace(/\s+/g, " ")
    .trim();
  const message = rawMessage.toLowerCase();

  let reason = "gemini_unavailable";
  if (
    status === 429 ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted")
  ) {
    reason = "quota_exceeded";
  } else if (
    status === 401 ||
    status === 403 ||
    message.includes("api key not valid") ||
    message.includes("permission denied") ||
    message.includes("unauthorized")
  ) {
    reason = "invalid_api_key_or_permission";
  } else if (status === 404 || (message.includes("model") && message.includes("not found"))) {
    reason = "model_not_found";
  } else if (status === 400 || message.includes("bad request") || message.includes("invalid argument")) {
    reason = "bad_request";
  } else if (
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("econn") ||
    message.includes("dns")
  ) {
    reason = "network_or_service_error";
  }

  return {
    reason,
    status,
    message: rawMessage.slice(0, 220),
  };
};

const mapWitFailure = (error) => {
  const status =
    Number(error?.status || error?.code || error?.response?.status || error?.response?.statusCode || 0) || null;
  const rawMessage = String(
    error?.message || error?.error?.message || error?.response?.data?.error?.message || error?.response?.data?.message || ""
  )
    .replace(/\s+/g, " ")
    .trim();
  const message = rawMessage.toLowerCase();

  let reason = "wit_unavailable";
  if (
    status === 429 ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    reason = "wit_quota_or_rate_limit";
  } else if (
    status === 401 ||
    status === 403 ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    reason = "wit_invalid_token_or_permission";
  } else if (status === 400 || message.includes("bad request")) {
    reason = "wit_bad_request";
  } else if (
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("econn") ||
    message.includes("dns")
  ) {
    reason = "wit_network_or_service_error";
  }

  return {
    reason,
    status,
    message: rawMessage.slice(0, 220),
  };
};

const mapWitIntentHint = (intentName) => {
  const normalized = normalizeText(intentName);
  if (!normalized) return "";

  if (hasAnyKeyword(normalized, ["event", "schedule", "calendar"])) {
    return "event upcoming registration deadline venue";
  }

  if (hasAnyKeyword(normalized, ["club", "member", "join"])) {
    return "club join member category";
  }

  if (hasAnyKeyword(normalized, ["register", "registration", "participant"])) {
    return "registration participant deadline capacity close registration";
  }

  if (hasAnyKeyword(normalized, ["role", "permission", "access", "admin", "manager", "student"])) {
    return "role admin manager student permission access";
  }

  if (hasAnyKeyword(normalized, ["dashboard", "notification", "activity", "log"])) {
    return "dashboard notification activity log";
  }

  if (hasAnyKeyword(normalized, ["auth", "login", "signup", "password", "jwt"])) {
    return "login signup auth password jwt";
  }

  return "";
};

const classifyWithWit = async (message) => {
  const params = new URLSearchParams({
    v: env.witApiVersion,
    q: String(message || ""),
  });

  const response = await fetch(`https://api.wit.ai/message?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${env.witApiToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const error = new Error(
      `Wit.ai request failed (${response.status}): ${String(errorBody).slice(0, 180) || response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  const topIntent = Array.isArray(payload?.intents) ? payload.intents[0] : null;

  return {
    intentName: String(topIntent?.name || "").trim(),
    intentConfidence: Number(topIntent?.confidence || 0),
    raw: payload,
  };
};

router.post(
  "/ask",
  authenticate,
  chatbotRateLimiter,
  asyncHandler(async (req, res) => {
    const { message, history } = req.body;
    const trimmedMessage = String(message || "").trim();

    if (!trimmedMessage) {
      throw new HttpError(400, "message is required.");
    }

    const [events, clubs] = await Promise.all([
      Event.find().sort({ date: 1 }).limit(20).populate("club", "name category"),
      Club.find().sort({ createdAt: -1 }).limit(20).select("name category"),
    ]);

    const safeHistory = normalizeHistory(history);
    const fallbackSuggestions = buildFallbackSuggestions({
      message: trimmedMessage,
      history: safeHistory,
      events,
      clubs,
      userRole: req.user.role,
    });
    const fallbackReply = buildDynamicFallbackReply({
      message: trimmedMessage,
      history: safeHistory,
      events,
      clubs,
      userRole: req.user.role,
    });

    let witFailure = null;
    if (env.witApiToken) {
      try {
        const witResult = await classifyWithWit(trimmedMessage);
        const hint = mapWitIntentHint(witResult.intentName);
        const witDrivenMessage = hint ? `${hint} ${trimmedMessage}` : trimmedMessage;

        const witReply = buildDynamicFallbackReply({
          message: witDrivenMessage,
          history: safeHistory,
          events,
          clubs,
          userRole: req.user.role,
        });

        const witSuggestions = buildFallbackSuggestions({
          message: witDrivenMessage,
          history: safeHistory,
          events,
          clubs,
          userRole: req.user.role,
        });

        res.json({
          reply: witReply,
          suggestions: witSuggestions,
          provider: "wit",
          intent: witResult.intentName || null,
          intentConfidence: witResult.intentName ? witResult.intentConfidence : null,
          engineVersion: CHATBOT_ENGINE_VERSION,
        });
        return;
      } catch (error) {
        witFailure = mapWitFailure(error);
        console.warn(
          `[chatbot] Wit.ai unavailable. reason=${witFailure.reason} status=${witFailure.status || "n/a"} message=${witFailure.message || "none"}`
        );
      }
    }

    if (!env.geminiApiKey) {
      res.json({
        reply: fallbackReply,
        suggestions: fallbackSuggestions,
        provider: "fallback",
        fallbackReason: witFailure?.reason || "missing_api_key",
        fallbackStatus: witFailure?.status || null,
        fallbackMessage: witFailure?.message || "",
        engineVersion: CHATBOT_ENGINE_VERSION,
      });
      return;
    }

    const contextText =
      safeHistory.map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`).join("\n") ||
      "No previous conversation.";

    const rankedEvents = rankEventsByContext(events, normalizeText(`${trimmedMessage} ${contextText}`)).slice(0, 8);
    const rankedClubs = rankClubsByContext(clubs, normalizeText(`${trimmedMessage} ${contextText}`)).slice(0, 8);

    const eventsContext = rankedEvents
      .map(
        (event) =>
          `- ${event.title} | Club: ${event.club?.name || "Unknown Club"} | Category: ${event.category
          } | Date: ${new Date(event.date).toISOString()} | Venue: ${event.venue} | Status: ${getEventStatus(event.date)}`
      )
      .join("\n");

    const clubsContext = rankedClubs.map((club) => `- ${club.name} (${club.category})`).join("\n");
    const roleCapabilities = Object.entries(ROLE_CAPABILITIES)
      .map(([role, items]) => `- ${role}: ${items.join(" ")}`)
      .join("\n");

    const prompt = `
You are Campus Connect Assistant for a MERN college app.
Current authenticated role: ${req.user.role}
Current time: ${new Date().toISOString()}

Goal:
- Answer the latest user question accurately using only this app's capabilities/data.
- Keep answer practical and concise.
- Avoid repeating earlier answer text when user topic changes.

Formatting requirements:
- Return strict JSON only (no markdown, no code fences).
- Output schema:
{
  "reply": "string",
  "suggestions": ["string", "string", "string"]
}
- "suggestions" must be exactly 3 short follow-up questions.
- Suggestions must be tightly related to the latest user question + recent chat context.
- Do not use generic repeated suggestions unless absolutely necessary.

Platform role capabilities:
${roleCapabilities}

Recent conversation:
${contextText}

Relevant clubs:
${clubsContext || "No clubs available"}

Relevant events:
${eventsContext || "No events available"}

Latest user question:
${trimmedMessage}
`;

    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const modelsToTry = Array.from(new Set([env.geminiModel, "gemini-2.0-flash"])).filter(Boolean);
    let lastGeminiFailure = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.8,
            maxOutputTokens: 420,
            responseMimeType: "application/json",
          },
        });

        const rawText = String(response.text || "").trim();
        if (!rawText) continue;

        const parsed = extractJsonObjectFromText(rawText);
        if (parsed && typeof parsed.reply === "string" && parsed.reply.trim()) {
          res.json({
            reply: parsed.reply.trim(),
            suggestions: sanitizeSuggestions(parsed.suggestions, fallbackSuggestions),
            provider: "gemini",
            engineVersion: CHATBOT_ENGINE_VERSION,
          });
          return;
        }

        res.json({
          reply: rawText,
          suggestions: fallbackSuggestions,
          provider: "gemini",
          engineVersion: CHATBOT_ENGINE_VERSION,
        });
        return;
      } catch (error) {
        lastGeminiFailure = mapGeminiFailure(error);
      }
    }

    if (lastGeminiFailure) {
      console.warn(
        `[chatbot] Gemini unavailable. reason=${lastGeminiFailure.reason} status=${lastGeminiFailure.status || "n/a"} message=${lastGeminiFailure.message || "none"}`
      );
    }

    res.json({
      reply: fallbackReply,
      suggestions: fallbackSuggestions,
      provider: "fallback",
      fallbackReason: lastGeminiFailure?.reason || "gemini_unavailable_or_quota",
      fallbackStatus: lastGeminiFailure?.status || null,
      fallbackMessage: lastGeminiFailure?.message || "",
      engineVersion: CHATBOT_ENGINE_VERSION,
    });
  })
);

export default router;
