import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import MobileBottomNavWrapper from "../components/MobileBottomNavWrapper";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "AeraVintage | The Ultimate Pre-Owned Watch Marketplace",
  description: "Buy and sell pre-owned watches, rare collections, and authentic accessories at AeraVintage.com — Authenticated, Verified, Trusted.",
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "WCH",
  },
};

import TermsGuard from "../components/TermsGuard";
import { ComparisonProvider } from "../context/ComparisonContext";
import { AuthProvider } from "../context/AuthContext";
import { RecentlyViewedProvider } from "../context/RecentlyViewedContext";
import { ToastProvider } from "../context/ToastContext";
import { CartProvider } from "../context/CartContext";
import ToastContainer from "../components/ToastContainer";
import ErrorBoundary from "../components/ErrorBoundary";
import NavigationLoader from "../components/NavigationLoader";
import ScrollToTop from "../components/ScrollToTop";
import PageTransition from "../components/PageTransition";
import GoogleAnalytics from "../components/GoogleAnalytics";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body
        className={`font-sans bg-background text-foreground antialiased transition-colors duration-500 pb-16 lg:pb-0`}
      >
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <NavigationLoader />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-foreground focus:text-background focus:rounded-xl focus:font-bold focus:text-sm focus:uppercase focus:tracking-widest">
          Skip to main content
        </a>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(reg => {
                    console.log('SW registered:', reg.scope);
                  }).catch(err => {
                    console.log('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
        <AuthProvider>
        <RecentlyViewedProvider>
          <ComparisonProvider>
            <ToastProvider>

              <ToastContainer />
              <CartProvider>
              <TermsGuard>
              <ErrorBoundary>
                <PageTransition>
                <div id="main-content">
                  {children}
                </div>
                </PageTransition>
              </ErrorBoundary>
              </TermsGuard>
              </CartProvider>
              <ScrollToTop />
              <MobileBottomNavWrapper />
            </ToastProvider>
          </ComparisonProvider>
        </RecentlyViewedProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
