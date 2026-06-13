/**
 * Server Component — generates dynamic SEO metadata for product detail pages.
 * Next.js App Router: layout.js runs on the server, so generateMetadata works
 * even though the page.js itself is a client component ("use client").
 */

import { API_URL, API_BASE_URL } from "../../../services/api";

export async function generateMetadata({ params: paramsPromise }) {
  try {
    const params = await paramsPromise;
    const res = await fetch(`${API_URL}/products/${params.id}`, {
      next: { revalidate: 60 }, // Cache for 60s on the CDN edge
    });

    if (!res.ok) return { title: "Product | Aera" };

    const product = await res.json();

    // Resolve the first non-video image for OG share card
    const rawImg = Array.isArray(product.images)
      ? product.images.find(i => !i.match(/\.(mp4|mov|webm)$/i)) || product.images[0]
      : null;

    const imageUrl = rawImg
      ? rawImg.startsWith("http")
        ? rawImg
        : `${API_BASE_URL}/uploads/${rawImg}`
      : null;

    const title       = `${product.title} | Aera`;
    const description = (product.description || "Premium vintage watch available on Aera.").slice(0, 160);
    const brand       = product.item_specifics?.brand;
    const price       = product.allow_auction
      ? product.current_bid || product.starting_bid
      : product.price;

    return {
      title,
      description,
      keywords: [
        brand, product.category_name, "vintage watch", "luxury watch",
        "buy watch India", "watch auction"
      ].filter(Boolean).join(", "),
      openGraph: {
        title,
        description,
        type:   "website",
        url:    `${process.env.NEXT_PUBLIC_SITE_URL || ""}/products/${params.id}`,
        images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: product.title }] : [],
      },
      twitter: {
        card:        "summary_large_image",
        title,
        description,
        images:      imageUrl ? [imageUrl] : [],
      },
      other: {
        // Structured data hints for Google Shopping
        "product:price:amount":   price ? String(price) : undefined,
        "product:price:currency": "INR",
        "product:availability":   product.status === "sold" ? "out of stock" : "in stock",
      },
    };
  } catch {
    return { title: "Product | Aera" };
  }
}

export default function ProductLayout({ children }) {
  return children;
}
