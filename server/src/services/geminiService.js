import { GoogleGenAI } from "@google/genai";

export async function generateWithGemini({ apiKey, models = [], prompt, maxOutputTokens = 420, temperature = 0.8 }) {
  if (!apiKey) throw new Error("Missing Gemini API key");
  const ai = new GoogleGenAI({ apiKey });

  let lastError = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      });

      const rawText = String(response.text || "").trim();
      if (!rawText) continue;
      return { provider: "gemini", rawText };
    } catch (error) {
      lastError = error;
    }
  }

  const err = new Error("Gemini generation failed");
  err.cause = lastError;
  throw err;
}
