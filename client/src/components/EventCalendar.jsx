import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../utils/date.js";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getMonthGridStart = (monthDate) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const diff = firstDay.getDay();
  firstDay.setDate(firstDay.getDate() - diff);
  return firstDay;
};

function EventCalendar({ events = [], selectedDate = "", onSelectDate }) {
  const [activeMonth, setActiveMonth] = useState(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      if (!Number.isNaN(date.getTime())) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const groupedEvents = useMemo(() => {
    return events.reduce((acc, event) => {
      const key = toDateKey(event.date);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [events]);

  const cells = useMemo(() => {
    const start = getMonthGridStart(activeMonth);
    return Array.from({ length: 42 }).map((_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = toDateKey(day);
      return {
        key,
        dayNumber: day.getDate(),
        inMonth: day.getMonth() === activeMonth.getMonth(),
        events: groupedEvents[key] || [],
      };
    });
  }, [activeMonth, groupedEvents]);

  const selectedEntries = selectedDate ? groupedEvents[selectedDate] || [] : [];

  return (
    <article className="card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Month Calendar</h2>
          <p className="text-sm text-[var(--muted)]">Click a date to quickly filter the events list.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-xs"
            onClick={() =>
              setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
          >
            Prev
          </button>
          <p className="min-w-32 text-center text-sm font-bold">
            {activeMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-xs"
            onClick={() =>
              setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
            }
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
        {dayLabels.map((label) => (
          <p key={label}>{label}</p>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5 md:gap-2">
        {cells.map((cell) => {
          const hasEvents = cell.events.length > 0;
          const isSelected = selectedDate === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              className={`min-h-16 rounded-lg border px-2 py-2 text-left transition ${
                cell.inMonth
                  ? "border-[var(--border)] bg-[var(--panel)]"
                  : "border-[var(--border)] bg-[var(--panel-muted)] opacity-75"
              } ${isSelected ? "border-[#4a92d8] ring-2 ring-[#a5ccf2]" : ""}`}
              onClick={() => onSelectDate(cell.key)}
            >
              <p className="text-xs font-bold">{cell.dayNumber}</p>
              {hasEvents ? (
                <p className="mt-1 inline-flex rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                  {cell.events.length} event{cell.events.length > 1 ? "s" : ""}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-[var(--muted)]">No events</p>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate ? (
        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-3">
          <p className="text-sm font-bold">Events on {new Date(selectedDate).toLocaleDateString("en-IN")}</p>
          <div className="mt-2 space-y-2">
            {selectedEntries.length ? (
              selectedEntries.map((entry) => (
                <article key={entry.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{entry.title}</p>
                      <p className="text-xs text-[var(--muted)]">{formatDateTime(entry.date)}</p>
                    </div>
                    <Link to={`/events/${entry.id}`} className="text-xs font-semibold text-[var(--accent)] underline">
                      Open
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-xs text-[var(--muted)]">No events mapped on this day.</p>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default EventCalendar;
