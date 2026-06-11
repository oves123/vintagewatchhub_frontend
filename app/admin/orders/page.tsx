"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AdminOrdersRedirect() {
  const router = useRouter();
  useEffect(() => { window.location.replace("/admin?tab=orders"); }, [router]);
  return null;
}
