import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import MobileBottomNavWrapper from "../components/MobileBottomNavWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata = {
  title: "Aera | The Ultimate Pre-Owned Watch Marketplace",
  description: "Buy and sell pre-owned watches, rare collections, and authentic accessories at Aera.com — Authenticated, Verified, Trusted.",
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "WCH",
  },
};

import TermsGuard from "../components/TermsGuard";
import { ComparisonProvider } from "../context/ComparisonContext";

import { RecentlyViewedProvider } from "../context/RecentlyViewedContext";
import { ToastProvider } from "../context/ToastContext";
import ToastContainer from "../components/ToastContainer";
import ErrorBoundary from "../components/ErrorBoundary";
import NavigationLoader from "../components/NavigationLoader";
import ScrollToTop from "../components/ScrollToTop";
import PageTransition from "../components/PageTransition";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground antialiased transition-colors duration-500 pb-16 lg:pb-0`}
      >
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
        <RecentlyViewedProvider>
          <ComparisonProvider>
            <ToastProvider>

              <ToastContainer />
              <TermsGuard>
              <ErrorBoundary>
                <PageTransition>
                <div id="main-content">
                  {children}
                </div>
                </PageTransition>
              </ErrorBoundary>
              </TermsGuard>
              <ScrollToTop />
              <MobileBottomNavWrapper />
            </ToastProvider>
          </ComparisonProvider>
        </RecentlyViewedProvider>
      </body>
    </html>
  );
}
