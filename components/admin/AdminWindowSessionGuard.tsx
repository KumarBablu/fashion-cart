"use client";

import { useEffect } from "react";

export default function AdminWindowSessionGuard() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fc_window_session", "active");
    }
  }, []);

  return null;
}
