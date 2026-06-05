"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import ProductCard from "../../../components/ProductCard";
import Breadcrumbs from "../../../components/Breadcrumbs";
import EmptyState from "../../../components/EmptyState";
import { ProductGridSkeleton } from "../../../components/Skeleton";
import { Package } from "lucide-react";
import { API_URL } from "../../../services/api";

export default function SellerPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, prodRes] = await Promise.all([
          fetch(`${API_URL}/users/${id}`).catch(() => ({ ok: false })),
          fetch(`${API_URL}/products/seller/${id}`).catch(() => ({ ok: false })),
        ]);

        let sellerData = null;
        if (userRes.ok) {
          const data = await userRes.json();
          sellerData = data.user || data;
        }

        let productsData = [];
        if (prodRes.ok) {
          const data = await prodRes.json();
          productsData = Array.isArray(data) ? data : data.products || [];
        }

        setSeller(sellerData);
        setProducts(productsData);
      } catch (e) {
        console.error("Seller fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-[1300px] mx-auto px-4 py-20 animate-pulse">
          <div className="h-8 bg-foreground/5 w-48 mb-8" />
          <div className="h-32 bg-foreground/5 mb-8" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: seller?.username || "Seller", href: `/sellers/${id}` },
        { label: "Listings" },
      ]} />

      <main className="max-w-[1300px] mx-auto px-4 py-8">
        {/* Seller Profile Card */}
        <div className="bg-surface border border-border p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 bg-background border border-border flex items-center justify-center text-2xl font-serif text-muted flex-shrink-0">
              {seller?.username?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-serif text-foreground tracking-wide mb-1">
                {seller?.username || "Seller"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted">
                {seller?.seller_badge && (
                  <span className="text-gold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Seller
                  </span>
                )}
                {seller?.created_at && (
                  <span>Member since {new Date(seller.created_at).toLocaleDateString()}</span>
                )}
                <span>{products.length} listing{products.length !== 1 ? 's' : ''}</span>
              </div>
              {seller?.bio && (
                <p className="text-sm text-muted mt-3 max-w-lg">{seller.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="mb-6 border-b border-border pb-4 flex items-center justify-between">
          <h2 className="section-title">Listings by {seller?.username || "Seller"}</h2>
          <span className="text-xs font-bold text-muted uppercase tracking-widest">{products.length} items</span>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="No Active Listings"
            description="This seller has no active listings right now. Check back later for new inventory."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
