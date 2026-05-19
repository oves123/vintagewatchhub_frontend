import { Inter, Playfair_Display, Domine } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const domine = Domine({
  subsets: ["latin"],
  variable: "--font-domine",
});


export const metadata = {
  title: "WatchCollectorHub | The Ultimate Pre-Owned Watch Marketplace",
  description: "Buy and sell pre-owned watches, rare collections, and authentic accessories at WatchCollectorHub.com",
};

import TermsGuard from "../components/TermsGuard";
import { ComparisonProvider } from "../context/ComparisonContext";
import ComparisonDrawer from "../components/ComparisonDrawer";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} ${domine.variable} font-sans bg-background text-foreground antialiased transition-colors duration-500`}
      >
        <ThemeProvider>
          <ComparisonProvider>
            <ComparisonDrawer />
            <TermsGuard>
              {children}
            </TermsGuard>
          </ComparisonProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
