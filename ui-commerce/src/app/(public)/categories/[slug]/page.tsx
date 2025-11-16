import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsByCategorySlug, getNewArrivals, getDiscountedProducts, getProductsByLikes } from "@/lib/api/products";
import CategoryProductsClient from "./CategoryProductsClient";

type PageProps = {
  params: { slug: string };
  searchParams: { page?: string };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isNewArrivals = params.slug === 'h-ng-m-i-v' || params.slug === 'hang-moi-ve' || params.slug === 'new-arrivals';
  const isDiscounted = params.slug === 'gi-m-gi' || params.slug === 'giam-gia' || params.slug === 'discounted' || params.slug === 'sale';
  const isMostFavorite = params.slug === 'yeu-thich' || params.slug === 'yêu-thích' || params.slug === 'most-favorite' || params.slug === 'favorites';

  let categoryName: string;
  let description: string;

  if (isNewArrivals) {
    categoryName = "Hàng Mới Về";
    description = "Khám phá những sản phẩm mới nhất tại Losia Store. Hàng mới về trong 15 ngày qua.";
  } else if (isDiscounted) {
    categoryName = "Giảm Giá";
    description = "Khám phá các sản phẩm đang giảm giá tại Losia Store. Tiết kiệm ngay hôm nay!";
  } else if (isMostFavorite) {
    categoryName = "Sản Phẩm Yêu Thích Nhất";
    description = "Khám phá những sản phẩm được yêu thích nhất tại Losia Store. Được nhiều người lựa chọn.";
  } else {
    categoryName = params.slug
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

  // Check special categories
  const isNewArrivals = params.slug === 'h-ng-m-i-v' || params.slug === 'hang-moi-ve' || params.slug === 'new-arrivals';
  const isDiscounted = params.slug === 'gi-m-gi' || params.slug === 'giam-gia' || params.slug === 'discounted' || params.slug === 'sale';
  const isMostFavorite = params.slug === 'yeu-thich' || params.slug === 'yêu-thích' || params.slug === 'most-favorite' || params.slug === 'favorites';

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
    } else if (isMostFavorite) {
      // Call by-likes API (DESC: most liked first)
      productsData = await getProductsByLikes({
        page,
        limit,
        sort: 'DESC',
      });
      categoryName = "Sản Phẩm Yêu Thích Nhất";
    } else {
      // Call regular category API
      productsData = await getProductsByCategorySlug(params.slug, {
        page,
        limit,
        status: "ACTIVE",
      });
      categoryName = params.slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  } catch (error) {
    console.error("Failed to fetch products for category:", params.slug, error);
    notFound();
  }

  return (
    <CategoryProductsClient
      slug={params.slug}
      categoryName={categoryName}
      initialData={productsData}
      currentPage={page}
    />
  );
}

