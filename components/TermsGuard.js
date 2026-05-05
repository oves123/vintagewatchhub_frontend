"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function TermsGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Only check if user is logged in and not already on the terms, login, or register page
    const whitelist = ["/terms", "/login", "/register", "/forgot-password", "/reset-password"];
    if (whitelist.includes(pathname)) {
      setChecking(false);
      return;
    }

    const checkTerms = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          // if (user && user.terms_accepted === false) {
          //   router.push("/terms");
          // } else {
            setChecking(false);
          // }
        } catch (e) {
          console.error("Failed to parse user from local storage:", e);
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    };

    checkTerms();
  }, [pathname, router]);

  // Optionally show a blank screen or loader while checking
  // If we show children immediately, there might be a flicker before redirect
  if (checking && !["/terms", "/login", "/register"].includes(pathname)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-blue-600 font-bold uppercase tracking-widest text-[10px]">Verifying Protocol...</div>
      </div>
    );
  }

  return children;
}
