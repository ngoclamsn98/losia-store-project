// Server Component wrapper for MostFavoriteSection
import MostFavoriteSection from './MostFavoriteSection';

/**
 * Fetch most favorite products từ Backend API
 * Server-side function cho SSR
 */
async function fetchMostFavoriteProducts(): Promise<any[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Sort DESC to get products with most likes first
    const url = `${apiUrl}/products/by-likes?limit=16&sort=DESC`;

    const res = await fetch(url, {
      next: {
        revalidate: process.env.NODE_ENV === 'production' ? 300 : 0, // Cache 5 minutes in production
        tags: ['most-favorite', 'products'],
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch most favorite products: ${res.status}`);
      return [];
    }

    const data = await res.json();

    const products = data.data || [];
    const result = products.map((p: any) => {
      const defaultVariant = p.variants?.find((v: any) => v.isDefault) || p.variants?.[0];

      return {
        id: p.id,
        slug: p.slug,
        title: p.name,
        name: p.name,
        price: Number(defaultVariant?.price) || 0,
        oldPrice: Number(defaultVariant?.compareAtPrice) || null,
        retailPrice: defaultVariant?.compareAtPrice || null,
        brandName: p.brandName || null, 
        productTypeName: p.categories?.[0]?.name || null,
        sizeLabel: defaultVariant?.name || null,
        favoriteCount: p.likesCount || 0,
        images: p.imageUrls || [],
        cover: p.thumbnailUrl || null,
        conditionValue: null,
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching most favorite products:', error);
    return [];
  }
}

/**
 * Server Component - Fetches data and renders MostFavoriteSection
 */
export default async function MostFavoriteSectionWrapper() {
  const items = await fetchMostFavoriteProducts();

  // Pass items to client component
  return <MostFavoriteSection items={items} />;
}

