import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "WatchCollectorHub | The Ultimate Pre-Owned Watch Marketplace",
  description: "Buy and sell pre-owned watches, rare collections, and authentic accessories at WatchCollectorHub.com",
};

import TermsGuard from "../components/TermsGuard";
import { ComparisonProvider } from "../context/ComparisonContext";
import ComparisonDrawer from "../components/ComparisonDrawer";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ComparisonProvider>
          <ComparisonDrawer />
          <TermsGuard>
            {children}
          </TermsGuard>
        </ComparisonProvider>
      </body>
    </html>
  );
}
