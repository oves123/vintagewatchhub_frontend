"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] h-0.5 transition-opacity duration-200 ${loading ? 'opacity-100' : 'opacity-0'}`}>
      <div className="h-full w-full bg-gradient-to-r from-gold via-amber-400 to-gold animate-[loaderBar_1.5s_ease-in-out_infinite]" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
