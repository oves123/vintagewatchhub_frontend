"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
}) {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement;
    confirmBtnRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-background border border-border text-muted rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-background/80 transition-all"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={() => {
              try { onConfirm(); }
              finally { onClose(); }
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gold text-black hover:bg-gold/90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
