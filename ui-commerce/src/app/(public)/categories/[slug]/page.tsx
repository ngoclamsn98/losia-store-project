import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsByCategorySlug } from "@/lib/api/products";
import CategoryProductsClient from "./CategoryProductsClient";

type PageProps = {
  params: { slug: string };
  searchParams: { page?: string };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categoryName = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${categoryName} - Losia Store`,
    description: `Khám phá bộ sưu tập ${categoryName} tại Losia Store. Thời trang bền vững, chất lượng cao.`,
  };
}

// Server Component - Fetch data on server
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = 12;

  let productsData;
  
  try {
    productsData = await getProductsByCategorySlug(params.slug, {
      page,
      limit,
      status: "ACTIVE",
    });
  } catch (error) {
    console.error("Failed to fetch products for category:", params.slug, error);
    notFound();
  }

  const categoryName = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <CategoryProductsClient
      slug={params.slug}
      categoryName={categoryName}
      initialData={productsData}
      currentPage={page}
    />
  );
}

