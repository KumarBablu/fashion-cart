import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import NavigationProgress from "@/components/providers/NavigationProgress";
import LuxuryClickEffects from "@/components/providers/LuxuryClickEffects";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  "https://fashion-cart-5p7k.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Fashion CART — The Premium Outlet & Fine Apparel",
    template: "%s | Fashion CART",
  },
  description: "Explore curated artisanal kurtis, pure mulberry silk sarees, bespoke French linen shirts, and everyday luxury essentials.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/fashion-cart-logo.png", type: "image/png" },
      { url: "/fashion-cart-logo-transparent.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "Fashion CART",
    title: "Fashion CART — The Premium Outlet & Fine Apparel",
    description: "Explore curated artisanal kurtis, pure mulberry silk sarees, bespoke French linen shirts, and everyday luxury essentials.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fashion Cart — Premium Outlet & Fine Apparel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fashion Cart — The Premium Outlet & Fine Apparel",
    description: "Explore curated artisanal kurtis, pure mulberry silk sarees, bespoke French linen shirts, and everyday luxury essentials.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased overflow-x-hidden ${fraunces.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300 overflow-x-hidden w-full max-w-full font-sans">
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            <LuxuryClickEffects />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
