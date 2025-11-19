/**
 * Favorites localStorage utilities
 * Lưu danh sách sản phẩm yêu thích vào localStorage
 */

const FAVORITES_STORAGE_KEY = 'losia_favorites';

export type FavoriteItem = {
  productId: string;
  addedAt: string; // ISO timestamp
};

export type LocalFavorites = {
  items: FavoriteItem[];
  updatedAt: string;
};

/**
 * Lấy danh sách favorites từ localStorage
 */
export function getLocalFavorites(): LocalFavorites {
  if (typeof window === 'undefined') {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    // Support old format (array of strings) and new format (object with items)
    const parsed = JSON.parse(stored);
    
    if (Array.isArray(parsed)) {
      // Old format: convert to new format
      const items = parsed.map(id => ({
        productId: String(id),
        addedAt: new Date().toISOString(),
      }));
      return { items, updatedAt: new Date().toISOString() };
    }

    return parsed as LocalFavorites;
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error);
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Lưu danh sách favorites vào localStorage
 */
export function saveLocalFavorites(favorites: LocalFavorites): void {
  if (typeof window === 'undefined') return;

  try {
    favorites.updatedAt = new Date().toISOString();
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    
    // Dispatch event for other components to update
    window.dispatchEvent(new CustomEvent('losia:favorites-changed'));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
}

/**
 * Kiểm tra xem product có được yêu thích không
 */
export function isFavorite(productId: string): boolean {
  const favorites = getLocalFavorites();
  return favorites.items.some(item => item.productId === productId);
}

/**
 * Thêm product vào favorites
 */
export function addToFavorites(productId: string): void {
  const favorites = getLocalFavorites();
  
  // Check if already exists
  if (favorites.items.some(item => item.productId === productId)) {
    return;
  }

  favorites.items.push({
    productId,
    addedAt: new Date().toISOString(),
  });

  saveLocalFavorites(favorites);
}

/**
 * Xóa product khỏi favorites
 */
export function removeFromFavorites(productId: string): void {
  const favorites = getLocalFavorites();
  favorites.items = favorites.items.filter(item => item.productId !== productId);
  saveLocalFavorites(favorites);
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(productId: string): boolean {
  const isCurrentlyFavorite = isFavorite(productId);
  
  if (isCurrentlyFavorite) {
    removeFromFavorites(productId);
    return false;
  } else {
    addToFavorites(productId);
    return true;
  }
}

/**
 * Lấy danh sách product IDs đã favorite
 */
export function getFavoriteProductIds(): string[] {
  const favorites = getLocalFavorites();
  return favorites.items.map(item => item.productId);
}

/**
 * Đếm số lượng favorites
 */
export function getFavoritesCount(): number {
  const favorites = getLocalFavorites();
  return favorites.items.length;
}

/**
 * Clear toàn bộ favorites
 */
export function clearFavorites(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAVORITES_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('losia:favorites-changed'));
}

