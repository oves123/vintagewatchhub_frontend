"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [animating, setAnimating] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={`transition-all duration-300 ease-out ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
      {children}
    </div>
  );
}
