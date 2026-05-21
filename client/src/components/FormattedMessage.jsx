import { useMemo } from "react";

const isListLine = (line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);

function renderInline(text) {
  if (!text) return text;
  const parts = [];
  let rest = String(text);
  const boldRe = /\*\*(.+?)\*\*/;
  while (true) {
    const m = rest.match(boldRe);
    if (!m) {
      parts.push(rest);
      break;
    }
    const [match, inner] = m;
    const idx = m.index;
    if (idx > 0) parts.push(rest.slice(0, idx));
    parts.push(<strong key={Math.random().toString(36).slice(2,9)}>{inner}</strong>);
    rest = rest.slice(idx + match.length);
  }
  // handle simple *italic* inside plain strings
  return parts.flatMap((seg, i) => {
    if (typeof seg !== "string") return seg;
    const out = [];
    let r = seg;
    const itRe = /\*(.+?)\*/;
    while (true) {
      const mm = r.match(itRe);
      if (!mm) { out.push(r); break; }
      const [m2, inner2] = mm;
      const idx2 = mm.index;
      if (idx2 > 0) out.push(r.slice(0, idx2));
      out.push(<em key={Math.random().toString(36).slice(2,9)}>{inner2}</em>);
      r = r.slice(idx2 + m2.length);
    }
    return out;
  });
}

function FormattedMessage({ content }) {
  const chunks = useMemo(() => {
    const lines = String(content || "").replace(/\r/g, "").split(/\n/);
    const result = [];
    let paragraph = [];
    let list = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      result.push({ type: "paragraph", value: paragraph.join(" ") });
      paragraph = [];
    };

    const flushList = (ordered = false) => {
      if (!list.length) return;
      result.push({ type: ordered ? "olist" : "list", value: list });
      list = [];
    };

    const tryExtractCommaList = (text) => {
      // Detect patterns like "Available Clubs: GDG, GrowthSquare, Code4All"
      const lower = text.toLowerCase();
      if ((lower.includes("club") || lower.includes("event") || lower.includes("available")) && text.includes(",")) {
        // attempt to extract items after colon or after keyword
        const afterColon = text.split(":").slice(1).join(":").trim();
        const candidate = afterColon || text;
        const parts = candidate.split(/,| and | & /).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2 && parts.every(p => p.length <= 60)) return parts;
      }
      return null;
    };

    const trySplitSteps = (text) => {
      const lc = text.toLowerCase();
      if (lc.includes("step") || lc.includes("first,") || lc.includes("then,") || lc.includes("next,")) {
        const sentences = text.split(/(?<=[.?!])\s+/).map(s => s.replace(/^[0-9]+\.\s*/, "").trim()).filter(Boolean);
        if (sentences.length >= 2) return sentences;
      }
      return null;
    };

    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      // Heading-like lines (end with colon or start with #)
      if (/^#/.test(line) || /:$/.test(line)) {
        flushParagraph();
        flushList();
        result.push({ type: "heading", value: line.replace(/^#+\s*/, "") });
        return;
      }

      // explicit markdown lists or numbered lists
      if (isListLine(line)) {
        flushParagraph();
        const normalized = line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
        list.push(normalized);
        return;
      }

      // comma-separated items for clubs/events
      const commaList = tryExtractCommaList(line);
      if (commaList) {
        flushParagraph();
        flushList();
        // header part before colon
        const intro = line.includes(":") ? line.split(":")[0].trim() : "Available:";
        result.push({ type: "subheading", value: intro });
        result.push({ type: "list", value: commaList });
        return;
      }

      // multi-step sentences to numbered list
      const steps = trySplitSteps(line);
      if (steps) {
        flushParagraph();
        flushList();
        result.push({ type: "olist", value: steps });
        return;
      }

      // otherwise accumulate paragraph lines
      paragraph.push(line);
    });

    flushParagraph();
    flushList();
    return result;
  }, [content]);

  return (
    <div className="space-y-3 text-sm">
      {chunks.map((chunk, index) => {
        if (chunk.type === "heading") {
          return (
            <p key={index} className="font-semibold text-sm" style={{ margin: 0 }}>{renderInline(chunk.value)}</p>
          );
        }
        if (chunk.type === "subheading") {
          return (
            <p key={index} className="font-semibold text-sm text-[var(--muted)]" style={{ margin: 0 }}>{renderInline(chunk.value)}</p>
          );
        }
        if (chunk.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {chunk.value.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (chunk.type === "olist") {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {chunk.value.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">{renderInline(item)}</li>
              ))}
            </ol>
          );
        }
        // paragraph
        // split long paragraphs into sentences for readability
        const sentences = String(chunk.value).split(/(?<=[.?!])\s+/).filter(Boolean);
        if (sentences.length > 2 && chunk.value.length > 180) {
          return (
            <div key={index} className="space-y-1">
              {sentences.map((s, i) => (
                <p key={i} className="leading-relaxed" style={{ margin: 0 }}>{renderInline(s)}</p>
              ))}
            </div>
          );
        }
        return (
          <p key={index} className="leading-relaxed" style={{ margin: 0 }}>{renderInline(chunk.value)}</p>
        );
      })}
    </div>
  );
}

export default FormattedMessage;
