/**
 * Cart localStorage utilities
 * Lưu giỏ hàng vào localStorage cho user chưa đăng nhập
 */

const CART_STORAGE_KEY = 'losia_cart';

export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName?: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  addedAt: string; // ISO timestamp
};

export type LocalCart = {
  items: CartItem[];
  updatedAt: string;
};

/**
 * Lấy cart từ localStorage
 */
export function getLocalCart(): LocalCart {
  if (typeof window === 'undefined') {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    const cart = JSON.parse(stored) as LocalCart;
    return cart;
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Lưu cart vào localStorage
 */
export function saveLocalCart(cart: LocalCart): void {
  if (typeof window === 'undefined') return;

  try {
    cart.updatedAt = new Date().toISOString();
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

/**
 * Thêm item vào cart
 */
export function addToLocalCart(item: Omit<CartItem, 'addedAt'>): LocalCart {
  const cart = getLocalCart();
  const now = new Date().toISOString();

  // Tìm item đã tồn tại
  const existingIndex = cart.items.findIndex(i => i.variantId === item.variantId);

  if (existingIndex >= 0) {
    // Update quantity (cho phép tăng quantity)
    cart.items[existingIndex].quantity += item.quantity;
    cart.items[existingIndex].price = item.price; // Update giá mới nhất
  } else {
    // Thêm item mới
    cart.items.push({
      ...item,
      addedAt: now,
    });
  }

  saveLocalCart(cart);
  return cart;
}

/**
 * Update quantity của item
 */
export function updateLocalCartItem(variantId: string, quantity: number): LocalCart {
  const cart = getLocalCart();
  const itemIndex = cart.items.findIndex(i => i.variantId === variantId);

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Xóa item nếu quantity <= 0
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  }

  saveLocalCart(cart);
  return cart;
}

/**
 * Xóa item khỏi cart
 */
export function removeFromLocalCart(variantId: string): LocalCart {
  const cart = getLocalCart();
  cart.items = cart.items.filter(i => i.variantId !== variantId);
  saveLocalCart(cart);
  return cart;
}

/**
 * Clear toàn bộ cart
 */
export function clearLocalCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

/**
 * Đếm tổng số items trong cart
 */
export function getLocalCartCount(): number {
  const cart = getLocalCart();
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Tính tổng giá trị cart
 */
export function getLocalCartTotal(): number {
  const cart = getLocalCart();
  return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Migrate cart từ localStorage sang Backend (khi user đăng nhập)
 */
export async function migrateLocalCartToBackend(token: string): Promise<boolean> {
  const cart = getLocalCart();
  
  if (cart.items.length === 0) {
    return true; // Không có gì để migrate
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Thêm từng item vào backend cart
    for (const item of cart.items) {
      await fetch(`${apiUrl}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          variantId: item.variantId,
          quantity: item.quantity,
        }),
      });
    }

    // Clear localStorage sau khi migrate thành công
    clearLocalCart();
    return true;
  } catch (error) {
    console.error('Error migrating cart to backend:', error);
    return false;
  }
}

