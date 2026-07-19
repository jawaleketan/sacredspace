import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

export function ConfirmModal({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, variant = "default" }: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="rounded-xl bg-surface-container-lowest p-6 shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg font-semibold text-on-surface">{title}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-outline-variant px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              variant === "danger" ? "bg-error hover:bg-error/90" : "bg-accent-gold hover:bg-accent-saffron"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}