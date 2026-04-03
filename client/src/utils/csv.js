const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export const downloadCsv = ({ filename, headers, rows }) => {
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  const lines = [
    safeHeaders.map(escapeCell).join(","),
    ...safeRows.map((row) => (Array.isArray(row) ? row : []).map(escapeCell).join(",")),
  ];

  const csvContent = `\uFEFF${lines.join("\r\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "export.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
