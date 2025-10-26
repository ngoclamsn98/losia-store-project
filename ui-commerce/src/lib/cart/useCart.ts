'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getLocalCart,
  addToLocalCart,
  updateLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
  getLocalCartCount,
  getLocalCartTotal,
  type CartItem,
  type LocalCart,
} from './localStorage';

/**
 * React hook để quản lý cart
 * Tự động sync với localStorage và listen events
 */
export function useCart() {
  const [cart, setCart] = useState<LocalCart>({ items: [], updatedAt: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Load cart từ localStorage khi mount
  useEffect(() => {
    const loadCart = () => {
      const localCart = getLocalCart();
      setCart(localCart);
      setIsLoading(false);
    };

    loadCart();
  }, []);

  // Listen cart-updated event
  useEffect(() => {
    const handleCartUpdate = () => {
      const localCart = getLocalCart();
      setCart(localCart);
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  // Add item to cart
  const addItem = useCallback((item: Omit<CartItem, 'addedAt'>) => {
    const updatedCart = addToLocalCart(item);
    setCart(updatedCart);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('cart-updated', { 
      detail: { count: getLocalCartCount() } 
    }));
    
    return updatedCart;
  }, []);

  // Update item quantity
  const updateItem = useCallback((variantId: string, quantity: number) => {
    const updatedCart = updateLocalCartItem(variantId, quantity);
    setCart(updatedCart);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('cart-updated', { 
      detail: { count: getLocalCartCount() } 
    }));
    
    return updatedCart;
  }, []);

  // Remove item from cart
  const removeItem = useCallback((variantId: string) => {
    const updatedCart = removeFromLocalCart(variantId);
    setCart(updatedCart);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('cart-updated', { 
      detail: { count: getLocalCartCount() } 
    }));
    
    return updatedCart;
  }, []);

  // Clear cart
  const clear = useCallback(() => {
    clearLocalCart();
    setCart({ items: [], updatedAt: new Date().toISOString() });
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('cart-updated', { 
      detail: { count: 0 } 
    }));
  }, []);

  // Get cart count
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Get cart total
  const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    cart,
    items: cart.items,
    count,
    total,
    isLoading,
    addItem,
    updateItem,
    removeItem,
    clear,
  };
}

/**
 * Hook đơn giản chỉ để lấy cart count (cho header/icon)
 */
export function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Load initial count
    const initialCount = getLocalCartCount();
    setCount(initialCount);

    // Listen for updates
    const handleCartUpdate = (event: any) => {
      const newCount = event.detail?.count ?? getLocalCartCount();
      setCount(newCount);
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  return count;
}

