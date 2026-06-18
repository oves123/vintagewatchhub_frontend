import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URLs
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Static routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  try {
    // Fetch dynamic products
    // We only want active listings for the sitemap
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?status=active`, { 
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!res.ok) {
      throw new Error('Failed to fetch products for sitemap')
    }
    
    const data = await res.json()
    const products = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : [])
    
    const productRoutes = products.map((product: any) => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: new Date(product.updated_at || product.created_at || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [...staticRoutes, ...productRoutes]
  } catch (error) {
    console.error("Sitemap generation error:", error)
    // Return static routes at minimum if DB fetch fails
    return staticRoutes
  }
}
