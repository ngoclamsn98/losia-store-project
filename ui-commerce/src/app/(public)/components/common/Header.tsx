// Server Component - Fetches categories on server side
import { getMegaMenu } from "@/lib/api/categories";
import HeaderClient from "./HeaderClient";

/**
 * LOSIA — Global Header (SSR)
 * Server-side rendered header with categories fetched from backend
 * Delegates interactive parts to HeaderClient component
 */

export default async function Header() {
  // Fetch categories on server side
  let categories: any[] = [];

  try {
    categories = await getMegaMenu();
  } catch (error) {
    console.error("Failed to fetch categories for header:", error);
    // Return empty array on error - HeaderClient will handle gracefully
  }

  return <HeaderClient categories={categories} />;
}
