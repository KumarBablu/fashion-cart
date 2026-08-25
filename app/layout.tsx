import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import NavigationProgress from "@/components/providers/NavigationProgress";

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
  "https://fashioncartstore.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Fashion CART — The Premium Outlet & Fine Apparel",
    template: "%s | Fashion CART",
  },
  description: "Explore curated artisanal kurtis, pure mulberry silk sarees, bespoke French linen shirts, and imperial jewellery at Fashion CART.",
  keywords: [
    "Fashion CART",
    "FashionCart",
    "Fashion Cart store",
    "Fashion Cart online shopping",
    "Fashion Cart Siwan",
    "Fashion Cart garments",
    "Fashion Cart jewellery",
    "buy kurtis online",
    "sarees online India",
    "designer jewellery online",
    "luxury ethnic wear India",
  ],
  authors: [{ name: "Fashion CART", url: APP_URL }],
  creator: "Fashion CART",
  publisher: "Fashion CART",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    description: "Explore curated artisanal kurtis, pure mulberry silk sarees, bespoke French linen shirts, and imperial jewellery at Fashion CART.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fashion CART — Premium Outlet & Fine Apparel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fashion CART — The Premium Outlet & Fine Apparel",
    description: "Explore curated artisanal kurtis, pure mulberry silk sarees, bespoke French linen shirts, and imperial jewellery at Fashion CART.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${APP_URL}/#organization`,
                  "name": "Fashion CART",
                  "alternateName": ["Fashion Cart", "FashionCart", "FashionCart Store", "Fashion Cart Siwan"],
                  "url": APP_URL,
                  "logo": `${APP_URL}/fashion-cart-logo-transparent.svg`,
                  "sameAs": [
                    "https://wa.me/919771039201"
                  ],
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+91-9771039201",
                    "contactType": "customer service",
                    "areaServed": "IN",
                    "availableLanguage": ["en", "hi"]
                  },
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Sonar Toli",
                    "addressLocality": "Siwan",
                    "addressRegion": "Bihar",
                    "postalCode": "841226",
                    "addressCountry": "IN"
                  }
                },
                {
                  "@type": "WebSite",
                  "@id": `${APP_URL}/#website`,
                  "url": APP_URL,
                  "name": "Fashion CART",
                  "publisher": {
                    "@id": `${APP_URL}/#organization`
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${APP_URL}/shop?q={search_term_string}`,
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300 overflow-x-hidden w-full max-w-full font-sans">
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
