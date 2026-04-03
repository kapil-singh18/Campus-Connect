import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ToastContext = createContext(null);

const TOAST_DURATION = 3200;

const typeClassMap = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-100",
  error: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-100",
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/12 dark:text-sky-100",
};

const makeToast = (input) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  type: input.type || "info",
  title: input.title || "",
  message: input.message || "",
  duration: Number.isFinite(input.duration) ? input.duration : TOAST_DURATION,
});

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[220] flex w-[min(94vw,22rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-md ${typeClassMap[toast.type] || typeClassMap.info}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              {toast.title ? <p className="text-sm font-extrabold">{toast.title}</p> : null}
              {toast.message ? <p className="mt-0.5 text-xs leading-relaxed">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              className="rounded-md px-1 text-[11px] font-bold opacity-75 transition hover:opacity-100"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((payload) => {
    const nextToast = makeToast(payload || {});
    setToasts((current) => [...current, nextToast]);
    return nextToast.id;
  }, []);

  useEffect(() => {
    if (!toasts.length) return undefined;

    const timeouts = toasts
      .filter((toast) => toast.duration > 0)
      .map((toast) =>
        window.setTimeout(() => {
          dismiss(toast.id);
        }, toast.duration),
      );

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [dismiss, toasts]);

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (message, title = "Success") => push({ type: "success", title, message }),
      error: (message, title = "Error") => push({ type: "error", title, message }),
      info: (message, title = "Info") => push({ type: "info", title, message }),
    }),
    [dismiss, push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
};
