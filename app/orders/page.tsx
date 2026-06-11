"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "../../components/Breadcrumbs";
export default function OrdersRedirect() {
  const router = useRouter();
  useEffect(() => { window.location.replace("/profile?tab=buying"); }, [router]);
  return (
    <main>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Orders' }]} />
    </main>
  );
}
