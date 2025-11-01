// Server Component wrapper for SeasonOutfitSection
import SeasonOutfitSection from './SeasonOutfitSection';

/**
 * Fetch season outfits từ Backend API
 * Server-side function cho SSR
 */
async function fetchSeasonOutfits(): Promise<any[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/products/season-outfits?limit=16`;

    const res = await fetch(url, {
      next: {
        revalidate: process.env.NODE_ENV === 'production' ? 300 : 0, // Cache 5 minutes in production
        tags: ['season-outfits', 'products'],
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch season outfits: ${res.status}`);
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
        price: Number(defaultVariant?.price) || 0,
        oldPrice: Number(defaultVariant?.compareAtPrice) || null,
        retailPrice: defaultVariant?.compareAtPrice || null,
        brandName: p.categories?.[0]?.name || null, 
        productTypeName: p.categories?.[0]?.name || null,
        sizeLabel: null,
        favoriteCount: 0,
        images: p.imageUrls || [],
        cover: p.thumbnailUrl || null,
        conditionValue: null,
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching season outfits:', error);
    return [];
  }
}

/**
 * Server Component - Fetches data and renders SeasonOutfitSection
 */
export default async function SeasonOutfitSectionWrapper() {
  const items = await fetchSeasonOutfits();

  // Pass items to client component
  return <SeasonOutfitSection items={items} />;
}

