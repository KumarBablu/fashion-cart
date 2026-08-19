"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminWindowSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasActiveAdminSession = sessionStorage.getItem("fc_admin_session") === "active";
      if (!hasActiveAdminSession) {
        // Tab or browser closed and reopened: force immediate clean re-login for security
        fetch("/api/auth/logout", { method: "POST" })
          .then(() => {
            sessionStorage.removeItem("fc_admin_session");
            sessionStorage.removeItem("fc_window_session");
            router.replace("/admin/login");
          })
          .catch(() => {
            router.replace("/admin/login");
          });
      }
    }
  }, [router]);

  return null;
}
