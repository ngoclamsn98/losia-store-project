// Server Component - Fetches menus on server side
import { getMenuTree } from "@/lib/api/menus";
import HeaderClient from "./HeaderClient";

/**
 * LOSIA — Global Header (SSR)
 * Server-side rendered header with menus fetched from backend
 * Delegates interactive parts to HeaderClient component
 */

export default async function Header() {
  // Fetch menus on server side
  let menus: any[] = [];

  try {
    menus = await getMenuTree();
  } catch (error) {
    console.error("Failed to fetch menus for header:", error);
    // Return empty array on error - HeaderClient will handle gracefully
  }

  return <HeaderClient menus={menus} />;
}
