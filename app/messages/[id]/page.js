"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function MessageRedirect() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (id) {
      window.location.replace(`/messages?chat=${id}`);
    } else {
      window.location.replace("/messages");
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100"/>
          <div className="absolute inset-0 rounded-full border-4 border-[#1e3a5f] border-t-transparent animate-spin"/>
        </div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">Redirecting to conversation...</p>
      </div>
    </div>
  );
}
