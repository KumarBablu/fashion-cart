"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerWindowSessionGuard({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && isLoggedIn) {
      const hasActiveWindow = sessionStorage.getItem("fc_user_session") === "active";
      if (!hasActiveWindow) {
        // Tab or browser was closed and reopened with restored cookies.
        // Invalidate stale session immediately so customer is prompted to log in!
        fetch("/api/auth/logout", { method: "POST" })
          .then(() => {
            sessionStorage.removeItem("fc_user_session");
            sessionStorage.removeItem("fc_window_session");
            router.refresh();
          })
          .catch(() => {});
      }
    }
  }, [isLoggedIn, router]);

  return null;
}
