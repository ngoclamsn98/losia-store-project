import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsByCategorySlug, getNewArrivals, getDiscountedProducts } from "@/lib/api/products";
import CategoryProductsClient from "../[slug]/CategoryProductsClient";

type PageProps = {
  params: { slugs?: string[] };
  searchParams: { page?: string };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugs = params.slugs || [];
  const slug = slugs[slugs.length - 1] || "categories";

  const isNewArrivals = slug === 'h-ng-m-i-v' || slug === 'hang-moi-ve' || slug === 'new-arrivals';
  const isDiscounted = slug === 'gi-m-gi' || slug === 'giam-gia' || slug === 'discounted' || slug === 'sale';

  let categoryName: string;
  let description: string;

  if (isNewArrivals) {
    categoryName = "Hàng Mới Về";
    description = "Khám phá những sản phẩm mới nhất tại Losia Store. Hàng mới về trong 15 ngày qua.";
  } else if (isDiscounted) {
    categoryName = "Giảm Giá";
    description = "Khám phá các sản phẩm đang giảm giá tại Losia Store. Tiết kiệm ngay hôm nay!";
  } else {
    categoryName = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    description = `Khám phá bộ sưu tập ${categoryName} tại Losia Store. Thời trang bền vững, chất lượng cao.`;
  }

  return {
    title: `${categoryName} - Losia Store`,
    description,
  };
}

// Server Component - Fetch data on server
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = 12;

  const slugs = params.slugs || [];

  if (slugs.length === 0) {
    notFound();
  }

  // Use the deepest slug to fetch products
  const slug = slugs[slugs.length - 1];

  // Check special categories
  const isNewArrivals = slug === 'h-ng-m-i-v' || slug === 'hang-moi-ve' || slug === 'new-arrivals';
  const isDiscounted = slug === 'gi-m-gi' || slug === 'giam-gia' || slug === 'discounted' || slug === 'sale';

  let productsData;
  let categoryName: string;

  try {
    if (isNewArrivals) {
      // Call new-arrivals API
      productsData = await getNewArrivals({
        page,
        limit,
      });
      categoryName = "Hàng Mới Về";
    } else if (isDiscounted) {
      // Call discounted API
      productsData = await getDiscountedProducts({
        page,
        limit,
      });
      categoryName = "Giảm Giá";
    } else {
      // Call regular category API
      productsData = await getProductsByCategorySlug(slug, {
        page,
        limit,
        status: "ACTIVE",
      });
      categoryName = slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  } catch (error) {
    console.error("Failed to fetch products for category:", slug, error);
    notFound();
  }

  // Reconstruct the full path for pagination
  const fullPath = `/categories/${slugs.join("/")}`;

  return (
    <CategoryProductsClient
      slug={fullPath}
      categoryName={categoryName}
      initialData={productsData}
      currentPage={page}
    />
  );
}

