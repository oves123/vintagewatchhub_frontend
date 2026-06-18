import { Metadata } from 'next';
import { API_URL, API_BASE_URL } from "../../../services/api";

type Props = {
  params: Promise<{ id: string }>
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return {
        title: "Asset Not Found | AeraVintage",
        description: "The requested luxury asset could not be found."
      };
    }
    
    const product = await res.json();
    
    if (!product || !product.title) {
       return {
          title: "Asset Not Found | AeraVintage",
          description: "The requested luxury asset could not be found."
       };
    }

    const imageUrl = product.images?.[0] 
       ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/uploads/${product.images[0]}`) 
       : (product.image ? (product.image.startsWith('http') ? product.image : `${API_BASE_URL}/uploads/${product.image}`) : 'https://www.aeravintage.com/placeholder.png');

    const cleanDescription = product.description ? product.description.replace(/<[^>]*>?/gm, '').substring(0, 160) : `Buy the exquisite ${product.title} on AeraVintage.`;

    return {
      title: `${product.title} | AeraVintage`,
      description: cleanDescription,
      openGraph: {
        title: `${product.title} | AeraVintage`,
        description: cleanDescription,
        images: [imageUrl],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.title} | AeraVintage`,
        description: cleanDescription,
        images: [imageUrl],
      },
    };
  } catch (err) {
     return {
        title: "AeraVintage",
     };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
