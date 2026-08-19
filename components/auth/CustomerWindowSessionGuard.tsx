"use client";

import { useEffect } from "react";

export default function CustomerWindowSessionGuard({ isLoggedIn }: { isLoggedIn: boolean }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = sessionStorage.getItem("fc_user_session") === "active";
      if (!active && isLoggedIn) {
        // Tab/website was closed and reopened: purge stale session cookies immediately!
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      }
    }
  }, [isLoggedIn]);

  return null;
}
