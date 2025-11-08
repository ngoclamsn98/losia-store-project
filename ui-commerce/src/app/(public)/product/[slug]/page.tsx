import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductAnalytics from '@/components/analytics/ProductAnalytics';
import ProductImageSection from '@/components/product/ProductImageGallery/ProductImageSection';
import ProductDetailClient from './ProductDetailClient';
import RelatedProducts from '@/components/product/RelatedProducts';
import { formatVND } from '@/lib/format';
import { htmlToText } from '@/lib/htmlToText';

// ===== Types từ Backend API =====
type ProductVariant = {
  id: string;
  name?: string | null;
  sku?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
  weight?: number | null;
  imageUrl?: string | null;
  attributes?: Record<string, string> | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type EcoImpact = {
  id: string;
  productGroup: string;
  glassesOfWater: number;
  hoursOfLighting: number;
  kmsOfDriving: number;
};

type ProductCondition = {
  id: string;
  label: string;
  value: string;
  description: string;
};

type ProductFromAPI = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  content?: string | null;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  status: string;
  isFeatured: boolean;
  views: number;
  variants: ProductVariant[];
  categories?: Category[];
  tags?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  ecoImpact?: EcoImpact | null;
  season?: string | null;
  productCondition?: ProductCondition | null;
  createdAt: string;
  updatedAt: string;
};

// Type cho UI component
type ProductDetail = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  content?: string | null | undefined;
  price: number;
  oldPrice?: number | null;
  retailPrice?: number | null;
  discountPercent?: number | null;
  inventory: number;
  condition?: string | null;
  conditionDescription?: string | null;
  brand?: string | null;
  category?: string | null;
  size?: string | null;
  sizeLabel?: string | null;
  sizeDisplay?: string | null;
  images?: string[];
  thumbnailUrl?: string | null;
  isFeatured?: boolean;
  isPopular?: boolean;
  isOnlyOneAvailable?: boolean;
  views?: number;
  sku?: string | null;
  productType?: {
    name?: string;
    parent?: { name?: string };
  };
  ecoImpactGroup?: string | null;
  productKindForEco?: string | null;
  measuredLength?: string | null;
  glassesOfWater?: number | null;
  hoursOfLighting?: number | null;
  kmsOfDriving?: number | null;
};

/**
 * Fetch product từ Backend API bằng slug
 * SSR cho SEO
 */
async function fetchProductBySlug(slug: string): Promise<ProductFromAPI | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/products/slug/${slug}`;
    
    const res = await fetch(url, {
      next: { 
        revalidate: process.env.NODE_ENV === 'production' ? 300 : 0,
        tags: ['product', `product-${slug}`]
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      console.error(`Failed to fetch product: ${res.status}`);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Map product từ Backend API format sang UI format
 */
function mapProductToDetail(p: ProductFromAPI): ProductDetail {
  // Lấy variant mặc định hoặc variant đầu tiên
  const defaultVariant = p.variants?.find(v => v.isDefault) || p.variants?.[0];

  // Tính discount percent
  let discountPercent: number | null = null;
  if (defaultVariant?.compareAtPrice && defaultVariant.compareAtPrice > defaultVariant.price) {
    discountPercent = Math.round(
      ((defaultVariant.compareAtPrice - defaultVariant.price) / defaultVariant.compareAtPrice) * 100
    );
  }

  // Lấy category đầu tiên
  const category = p.categories?.[0];

  // Map images
  const images = p.imageUrls || [];
  if (p.thumbnailUrl && !images.includes(p.thumbnailUrl)) {
    images.unshift(p.thumbnailUrl);
  }

  // Parse HTML description sang text
  const content = htmlToText(p.content);
  const description = htmlToText(p.description);
  return {
    id: p.id,
    title: p.name,
    slug: p.slug,
    description,
    content,
    price: defaultVariant?.price || 0,
    oldPrice: defaultVariant?.compareAtPrice || null,
    retailPrice: defaultVariant?.compareAtPrice || null,
    discountPercent,
    inventory: defaultVariant?.stock || 0,
    condition: p.productCondition?.value || null,
    conditionDescription: p.productCondition?.description || null,
    brand: category?.name || null, // Tạm dùng category làm brand
    category: category?.name || null,
    size: null,
    sizeLabel: defaultVariant?.name || null, // Variant name có thể là size
    sizeDisplay: defaultVariant?.name || null,
    images,
    thumbnailUrl: p.thumbnailUrl,
    isFeatured: p.isFeatured,
    isPopular: p.isFeatured, // Tạm map featured = popular
    isOnlyOneAvailable: (defaultVariant?.stock || 0) === 1,
    views: p.views,
    sku: defaultVariant?.sku || null,
    productType: {
      name: category?.name,
      parent: undefined,
    },
    // Map eco impact từ ecoImpact object
    ecoImpactGroup: p.ecoImpact?.productGroup || category?.name || null,
    productKindForEco: p.ecoImpact?.productGroup || category?.name || null,
    measuredLength: null,
    glassesOfWater: p.ecoImpact?.glassesOfWater || null,
    hoursOfLighting: p.ecoImpact?.hoursOfLighting || null,
    kmsOfDriving: p.ecoImpact?.kmsOfDriving || null,
  };
}

/**
 * Generate metadata cho SEO
 */
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const product = await fetchProductBySlug(params.slug);
  
  if (!product) {
    return { 
      title: 'Sản phẩm không tồn tại | LOSIA Store',
      description: 'Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.'
    };
  }

  const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://losia.vn').replace(/\/$/, '');
  const url = `${baseUrl}/product/${product.slug}`;
  
  const title = product.seoTitle || `${product.name} | LOSIA Store`;
  const description = product.seoDescription || 
    product.description || 
    `${product.name} - Giá: ${formatVND(defaultVariant?.price || 0)}`;
  
  const image = product.thumbnailUrl || product.imageUrls?.[0] || '/assets/images/main/product1.jpg';

  return {
    title,
    description,
    keywords: product.seoKeywords?.join(', '),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'LOSIA Store',
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Product Detail Page - Server Component (SSR)
 */
export default async function ProductDetailPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const productFromAPI = await fetchProductBySlug(params.slug);
  
  if (!productFromAPI) {
    notFound();
  }

  // Map sang UI format
  const product = mapProductToDetail(productFromAPI);
  
  // Chuẩn hóa images
  const gallery = product.images && product.images.length > 0 
    ? product.images 
    : ['/assets/images/main/product1.jpg'];

  // JSON-LD cho SEO
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://losia.vn').replace(/\/$/, '');
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: gallery,
    description: product.description?.slice(0, 300),
    brand: product.brand || 'LOSIA',
    sku: product.sku || product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: product.price,
      availability: product.inventory > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/product/${product.slug}`,
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: `${baseUrl}/products` },
      { '@type': 'ListItem', position: 3, name: product.title, item: `${baseUrl}/product/${product.slug}` },
    ],
  };

  return (
    <>
      <main className="container mx-auto py-6 grid grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-x-12">
        {/* Analytics */}
        <ProductAnalytics
          id={product.id}
          title={product.title}
          price={product.price}
          brand={product.brand || undefined}
          category={product.category || undefined}
        />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        {/* Cột trái: ảnh */}
        <div>
          <ProductImageSection
            title={product.title}
            productId={product.id}
            images={gallery}
          />
        </div>

        {/* Cột phải: Product Details */}
        <div className="md:pl-8 lg:pl-12">
          <ProductDetailClient
            product={product as any}
            variants={productFromAPI.variants}
          />
        </div>
      </main>

      {/* Related Products Section - SSR */}
      <RelatedProducts productId={product.id} limit={8} />
    </>
  );
}

