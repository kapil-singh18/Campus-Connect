import { useMemo } from "react";

const isListLine = (line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);

function FormattedMessage({ content }) {
  const chunks = useMemo(() => {
    const lines = String(content || "").split("\n");
    const result = [];
    let paragraph = [];
    let list = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      result.push({ type: "paragraph", value: paragraph.join(" ") });
      paragraph = [];
    };

    const flushList = () => {
      if (!list.length) return;
      result.push({ type: "list", value: list });
      list = [];
    };

    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      if (isListLine(line)) {
        flushParagraph();
        const normalized = line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
        list.push(normalized);
        return;
      }

      flushList();
      paragraph.push(line);
    });

    flushParagraph();
    flushList();
    return result;
  }, [content]);

  return (
    <div className="space-y-2">
      {chunks.map((chunk, index) => {
        if (chunk.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
              {chunk.value.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-sm leading-relaxed">
            {chunk.value}
          </p>
        );
      })}
    </div>
  );
}

export default FormattedMessage;
