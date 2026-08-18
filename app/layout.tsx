import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import NavigationProgress from "@/components/providers/NavigationProgress";

export const metadata: Metadata = {
  title: "Fashion Cart — The Luxury Atelier & Fine Apparel",
  description: "Explore curated artisanal kurtis, pure mulberry silk sarees, bespoke French linen shirts, and everyday luxury essentials.",
  icons: {
    icon: [
      { url: "/fashion-cart-logo-transparent.svg", type: "image/svg+xml" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/fashion-cart-logo-transparent.svg",
    apple: "/fashion-cart-logo-transparent.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased overflow-x-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/fashion-cart-logo-transparent.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/fashion-cart-logo-transparent.svg" />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300 overflow-x-hidden w-full max-w-full">
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
