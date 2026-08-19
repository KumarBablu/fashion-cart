"use client";

import { useEffect } from "react";

export default function AccountSessionGuard() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = sessionStorage.getItem("fc_user_session") === "active";
      if (!active) {
        fetch("/api/auth/logout", { method: "POST" }).finally(() => {
          window.location.href = "/login?next=/account";
        });
      }
    }
  }, []);

  return null;
}
