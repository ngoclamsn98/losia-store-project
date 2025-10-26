'use client';

import React from 'react';
import Link from 'next/link';
import { useCartCount } from '@/lib/cart';

type Props = {
  className?: string;
  showCount?: boolean;
};

/**
 * Cart icon với badge hiển thị số lượng sản phẩm
 * Tự động update khi cart thay đổi
 */
export default function CartIcon({ className = '', showCount = true }: Props) {
  const count = useCartCount();

  return (
    <Link 
      href="/cart" 
      className={`relative inline-flex items-center ${className}`}
      aria-label={`Giỏ hàng (${count} sản phẩm)`}
    >
      {/* Shopping bag icon */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>

      {/* Badge count */}
      {showCount && count > 0 && (
        <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

