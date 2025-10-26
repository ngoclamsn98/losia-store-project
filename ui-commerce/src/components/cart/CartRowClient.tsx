'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatVND } from '@/lib/format';
import { updateLocalCartItem, removeFromLocalCart } from '@/lib/cart/localStorage';
import { internalDelete, internalPatch } from '@/lib/api/internal';

type DetailedItem = {
  productId: string;
  variantId: string;
  qty: number;
  product: {
    id: string;
    title: string;
    price: number;
    oldPrice: number | null;
    brand?: string;
    category?: string;
    cover: string | null;
    inStock: boolean;
    variantName?: string | null;
  };
};

export default function CartRowClient({ row }: { row: DetailedItem }) {
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);

    try {
      // Remove from localStorage
      removeFromLocalCart(row.variantId);

      // Dispatch events
      window.dispatchEvent(new CustomEvent('losia:cart-changed'));
      window.dispatchEvent(new CustomEvent('cart-updated'));

      // Try to remove from API if available
      try {
        await internalDelete(`/api/cart?productId=${encodeURIComponent(row.productId)}`);
      } catch {
        // API fail but localStorage already removed
      }
    } catch (error) {
      console.error('Remove cart item error:', error);
    } finally {
      setRemoving(false);
    }
  };

  const handleUpdateQty = async (newQty: number) => {
    if (updating || newQty < 1) return;
    setUpdating(true);

    try {
      // Update localStorage
      updateLocalCartItem(row.variantId, newQty);

      // Dispatch events
      window.dispatchEvent(new CustomEvent('losia:cart-changed'));
      window.dispatchEvent(new CustomEvent('cart-updated'));

      // Try to update API if available
      try {
        await internalPatch('/api/cart', { productId: row.productId, qty: newQty });
      } catch {
        // API fail but localStorage already updated
      }
    } catch (error) {
      console.error('Update cart item error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const { product, qty } = row;
  const saving =
    typeof product.oldPrice === 'number' && product.oldPrice > product.price
      ? (product.oldPrice - product.price) * qty
      : 0;

  return (
    <li className="p-4 flex gap-4">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="flex-shrink-0">
        <Image
          src={product.cover || '/assets/images/main/product1.jpg'}
          alt={product.title}
          width={96}
          height={120}
          className="h-30 w-24 rounded object-cover bg-gray-100"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-medium text-sm line-clamp-2 hover:underline">
            {product.title}
          </h3>
        </Link>

        {product.variantName && (
          <p className="text-xs text-gray-500 mt-1">{product.variantName}</p>
        )}

        {product.brand && (
          <p className="text-xs text-gray-500 mt-1">Brand: {product.brand}</p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold text-sm">{formatVND(product.price)}</span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatVND(product.oldPrice)}
            </span>
          )}
        </div>

        {saving > 0 && (
          <p className="text-xs text-emerald-700 mt-1">
            Tiết kiệm {formatVND(saving)}
          </p>
        )}

        {!product.inStock && (
          <p className="text-xs text-red-600 mt-1">Hết hàng</p>
        )}

        {/* Quantity controls */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => handleUpdateQty(qty - 1)}
              disabled={updating || qty <= 1}
              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="px-4 py-1 text-sm font-medium border-x">{qty}</span>
            <button
              onClick={() => handleUpdateQty(qty + 1)}
              disabled={updating}
              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
            >
              +
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {removing ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="flex-shrink-0 text-right">
        <p className="font-semibold">{formatVND(product.price * qty)}</p>
      </div>
    </li>
  );
}

