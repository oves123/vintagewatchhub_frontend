"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AdminProductsRedirect() {
  const router = useRouter();
  useEffect(() => { window.location.replace("/admin?tab=products"); }, [router]);
  return null;
}
