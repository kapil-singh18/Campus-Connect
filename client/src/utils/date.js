export const formatDate = (value) =>
  (() => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  })();

export const formatDateTime = (value) =>
  (() => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

export const statusClass = (status) => {
  if (status === "upcoming") return "bg-emerald-100 text-emerald-800";
  if (status === "ongoing") return "bg-amber-100 text-amber-800";
  return "bg-slate-200 text-slate-700";
};
