import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2" role="status" aria-live="polite" aria-label="Notifications" style={{ pointerEvents: toasts.length > 0 ? "auto" : "none" }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast: t, onDone }: { toast: Toast; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(t.id), 3000);
    return () => clearTimeout(timer);
  }, [t.id, onDone]);

  const colors = {
    success: "border-accent-gold text-accent-gold bg-accent-gold/5",
    error: "border-red-500 text-red-400 bg-red-500/5",
    info: "border-on-surface-variant text-on-surface-variant bg-surface-container",
  };

  return (
    <div
      className={`animate-in slide-in-from-bottom-2 rounded-xl border px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-sm ${colors[t.type]}`}
      style={{
        animation: "toast-in 0.3s ease-out",
        pointerEvents: "auto",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="flex-1">{t.message}</span>
        <button
          onClick={() => onDone(t.id)}
          className="shrink-0 rounded p-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          &#x2715;
        </button>
      </div>
    </div>
  );
}
