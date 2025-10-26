/**
 * Cart utilities - localStorage based cart system
 * Không cần đăng nhập, tự động sync với Backend khi có token
 */

export {
  getLocalCart,
  saveLocalCart,
  addToLocalCart,
  updateLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
  getLocalCartCount,
  getLocalCartTotal,
  migrateLocalCartToBackend,
  type CartItem,
  type LocalCart,
} from './localStorage';

export {
  useCart,
  useCartCount,
} from './useCart';

