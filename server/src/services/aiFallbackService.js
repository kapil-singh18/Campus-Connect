import { generateWithGemini } from "./geminiService.js";
import { generateWithGroq } from "./groqService.js";

export async function generateReplyWithFallback({
  prompt,
  geminiKey,
  geminiModels = [],
  groqKey,
  groqUrl,
  groqModel,
  maxOutputTokens = 420,
  temperature = 0.8,
  groqTimeoutMs = 8000,
}) {
  // Try Gemini first
  if (geminiKey && geminiModels.length) {
    try {
      const gemini = await generateWithGemini({
        apiKey: geminiKey,
        models: geminiModels,
        prompt,
        maxOutputTokens,
        temperature,
      });

      if (gemini && gemini.rawText) {
        return { success: true, provider: gemini.provider, rawText: gemini.rawText };
      }
    } catch (err) {
      // Log the fact Gemini failed and continue to GROQ
      console.warn(`[chatbot] Gemini failed, switching to GROQ. reason=${String(err.message).slice(0,200)}`);
    }
  }

  // Fallback to GROQ
  if (groqKey && groqUrl) {
    try {
      const groq = await generateWithGroq({ apiKey: groqKey, apiUrl: groqUrl, model: groqModel, prompt, timeoutMs: groqTimeoutMs });
      if (groq && groq.rawText) {
        return { success: true, provider: groq.provider, rawText: groq.rawText, raw: groq.raw };
      }
    } catch (err) {
      console.warn(`[chatbot] GROQ failed: ${String(err.message).slice(0,200)}`);
    }
  }

  return { success: false, error: "All AI providers failed" };
}
