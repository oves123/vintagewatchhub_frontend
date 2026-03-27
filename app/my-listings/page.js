"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function MyListingsRedirect() {
  const router = useRouter();
  useEffect(() => { window.location.replace("/profile?tab=selling"); }, [router]);
  return null;
}
