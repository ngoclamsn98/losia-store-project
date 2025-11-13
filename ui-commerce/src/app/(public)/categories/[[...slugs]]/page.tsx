import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsByNestedCategorySlugs } from "@/lib/api/products";
import CategoryProductsClient from "../[slug]/CategoryProductsClient";

type PageProps = {
  params: { slugs?: string[] };
  searchParams: { page?: string };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugs = params.slugs || [];
  const slug = slugs[slugs.length - 1] || "categories";
  
  const categoryName = slug
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

  const slugs = params.slugs || [];

  // Validate slug count (1-3 levels supported)
  if (slugs.length === 0 || slugs.length > 3) {
    notFound();
  }

  let productsData;

  try {
    // Use the new nested category API that properly validates the hierarchy
    productsData = await getProductsByNestedCategorySlugs(slugs, {
      page,
      limit,
      status: "ACTIVE",
    });
  } catch (error) {
    console.error("Failed to fetch products for category:", slugs.join("/"), error);
    notFound();
  }

  // Use the deepest slug for display name
  const slug = slugs[slugs.length - 1];
  const categoryName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Reconstruct the full path for pagination
  const fullPath = slugs.join("/");

  return (
    <CategoryProductsClient
      slug={fullPath}
      categoryName={categoryName}
      initialData={productsData}
      currentPage={page}
    />
  );
}

