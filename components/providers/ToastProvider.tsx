"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextType = {
  toast: (options: { title: string; message?: string; type?: ToastType; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "success", duration = 3500 }: { title: string; message?: string; type?: ToastType; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => showToast({ title, message, type: "success" }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ title, message, type: "error" }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ title, message, type: "info" }), [showToast]);

  return (
    <ToastContext.Provider value={{ toast: showToast, success, error, info }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-600/50 text-emerald-100"
                : t.type === "error"
                ? "bg-rose-950/90 border-rose-600/50 text-rose-100"
                : t.type === "warning"
                ? "bg-amber-950/90 border-amber-600/50 text-amber-100"
                : "bg-slate-900/90 border-slate-700 text-slate-100"
            }`}
          >
            <div className="flex gap-3">
              <span className="text-lg">
                {t.type === "success" && "✓"}
                {t.type === "error" && "✕"}
                {t.type === "warning" && "⚠️"}
                {t.type === "info" && "ℹ️"}
              </span>
              <div>
                <p className="text-sm font-semibold leading-none mt-0.5">{t.title}</p>
                {t.message && <p className="text-xs mt-1 opacity-80">{t.message}</p>}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
