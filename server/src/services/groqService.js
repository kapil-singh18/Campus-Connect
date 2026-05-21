function timeout(ms) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
}

export async function generateWithGroq({ apiKey, apiUrl, model, prompt, timeoutMs = 8000 }) {
  if (!apiKey || !apiUrl) throw new Error("Missing GROQ configuration");

  const controller = new AbortController();
  const signal = controller.signal;
  const body = JSON.stringify({ model, input: prompt });

  try {
    const resPromise = fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      signal,
    });

    const res = await Promise.race([resPromise, timeout(timeoutMs)]);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = new Error(`GROQ request failed (${res.status}): ${String(txt).slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }

    const payload = await res.json().catch(() => null);
    if (!payload) throw new Error("Empty GROQ response");

    // Try to extract text from common fields
    // support: { output: [{ content: [{ type: 'output_text', text: '...' }] }] }
    if (Array.isArray(payload.output) && payload.output[0]) {
      try {
        const out = payload.output[0];
        if (Array.isArray(out.content) && out.content[0] && out.content[0].text) {
          return { provider: "groq", rawText: String(out.content[0].text).trim(), raw: payload };
        }
        if (out.text) return { provider: "groq", rawText: String(out.text).trim(), raw: payload };
      } catch (_e) {}
    }

    // fallback: choices[0].text or result
    if (Array.isArray(payload.choices) && payload.choices[0] && payload.choices[0].text) {
      return { provider: "groq", rawText: String(payload.choices[0].text).trim(), raw: payload };
    }

    if (payload.result && typeof payload.result === "string") {
      return { provider: "groq", rawText: payload.result.trim(), raw: payload };
    }

    // if payload has top-level text
    if (payload.text) return { provider: "groq", rawText: String(payload.text).trim(), raw: payload };

    throw new Error("Unable to parse GROQ response");
  } finally {
    // ensure abort if still pending
    try { controller.abort(); } catch (_) {}
  }
}
