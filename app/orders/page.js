"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function OrdersRedirect() {
  const router = useRouter();
  useEffect(() => { window.location.replace("/profile?tab=buying"); }, [router]);
  return null;
}
