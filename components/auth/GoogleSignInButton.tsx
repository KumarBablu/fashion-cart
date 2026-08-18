"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { useToast } from "@/components/providers/ToastProvider";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({
  text = "continue_with",
  next = "/account",
  label = "Continue with Google",
}: {
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  next?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "1049382910291-fashioncartdemo.apps.googleusercontent.com";

  async function handleCredentialResponse(response: { credential: string }) {
    if (!response.credential) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toastError("Google Sign-In Failed", data.error || "Could not authenticate with Google.");
        return;
      }

      success("Signed In with Google! 🎉", `Welcome back, ${data.user?.name || "Customer"}`);
      window.location.href = next;
    } catch {
      setLoading(false);
      toastError("Network Error", "Unable to complete Google sign-in. Please try again.");
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && window.google && buttonRef.current && scriptLoaded) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          cancel_on_tap_outside: true,
        });

        // Render official GIS button inside container
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          width: "100%",
          logo_alignment: "center",
        });
      } catch (err) {
        console.warn("Google Sign-In initialization:", err);
      }
    }
  }, [scriptLoaded, clientId, text]);

  function handleFallbackClick() {
    if (typeof window !== "undefined" && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.prompt();
      } catch {
        toastError("Google Sign-In", "Google Sign-In is initializing. Please click again.");
      }
    } else {
      toastError("Google Sign-In", "Loading Google Services... Please wait a moment.");
    }
  }

  return (
    <div className="w-full space-y-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Official GIS Button Container */}
      <div ref={buttonRef} className="w-full flex justify-center min-h-[42px]" />

      {/* Styled High-Fashion Google Button Fallback / Display */}
      {(!scriptLoaded || loading) && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-full border border-[#E7DFD5] bg-white hover:bg-[#F4EFEA] text-[#141416] font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-60"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-[#141416] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? "Authenticating with Google…" : label}</span>
        </button>
      )}
    </div>
  );
}
