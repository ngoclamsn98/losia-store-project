'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { formatVND } from '@/lib/format';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Cart drawer - Hiển thị giỏ hàng dạng sidebar
 */
export default function CartDrawer({ isOpen, onClose }: Props) {
  const { items, count, total, removeItem, updateItem } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Giỏ hàng ({count})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Đóng"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-500">Giỏ hàng trống</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 border-b pb-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {item.productName}
                    </h3>
                    {item.variantName && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-1">
                      {formatVND(item.price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateItem(item.variantId, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-sm w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.variantId, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="ml-auto text-xs text-red-600 hover:text-red-800"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Tổng cộng:</span>
              <span>{formatVND(total)}</span>
            </div>
            
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full bg-black text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Thanh toán
            </Link>
            
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full border border-gray-300 text-center py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Xem giỏ hàng
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

