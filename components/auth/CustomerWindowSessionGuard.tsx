"use client";

import { useEffect } from "react";

export default function CustomerWindowSessionGuard({ isLoggedIn }: { isLoggedIn: boolean }) {
  useEffect(() => {
    if (typeof window !== "undefined" && isLoggedIn) {
      sessionStorage.setItem("fc_user_session", "active");
      sessionStorage.setItem("fc_window_session", "active");
    }
  }, [isLoggedIn]);

  return null;
}
