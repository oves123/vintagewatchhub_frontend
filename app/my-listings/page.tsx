"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "../../components/Breadcrumbs";
export default function MyListingsRedirect() {
  const router = useRouter();
  useEffect(() => { window.location.replace("/profile?tab=selling"); }, [router]);
  return (
    <main>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Listings' }]} />
    </main>
  );
}
