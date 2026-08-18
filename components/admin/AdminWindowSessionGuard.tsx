"use client";

import { useEffect } from "react";

export default function AdminWindowSessionGuard() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isWindowSessionActive = sessionStorage.getItem("fc_window_session");
      if (!isWindowSessionActive) {
        // Window was closed and reopened, require fresh login
        fetch("/api/auth/logout", { method: "POST" })
          .then(() => {
            window.location.href = "/admin/login";
          })
          .catch(() => {
            window.location.href = "/admin/login";
          });
      }
    }
  }, []);

  return null;
}
