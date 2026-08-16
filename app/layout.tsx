import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  fallback: ["Georgia", "serif"],
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Fashion Cart — Haute Couture & Everyday Luxury",
  description: "Explore curated shirts, kurtis, dresses, and everyday essentials. Fast delivery, secure payments, and easy returns.",
  icons: {
    icon: [
      { url: "/fashion-cart-logo-transparent.svg", type: "image/svg+xml" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/fashion-cart-logo-transparent.svg",
    apple: "/fashion-cart-logo-transparent.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/fashion-cart-logo-transparent.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/fashion-cart-logo-transparent.svg" />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
