// src/components/common/MiniCartDrawer.tsx
'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatVND } from '@/lib/format';
import { useCart } from '@/app/providers/CartProvider';
import { getLocalCart, removeFromLocalCart, updateLocalCartItem } from '@/lib/cart/localStorage';
import { internalDelete } from '@/lib/api/internal';

// Type cho localStorage cart item
type LocalCartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName?: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  addedAt: string;
};

export default function MiniCartDrawer({
  className = '',
  hideTrigger = false,
}: {
  className?: string;
  hideTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [localCartItems, setLocalCartItems] = useState<LocalCartItem[]>([]);
  const mounted = useRef(false);
  const router = useRouter();

  // 🔗 lấy từ CartProvider (API cart - cho user đã đăng nhập)
  const { items: apiItems, count: apiCount, subtotal: apiSubtotal, refresh } = useCart();

  // 🔗 Load localStorage cart
  useEffect(() => {
    const loadLocalCart = () => {
      const localCart = getLocalCart();
      setLocalCartItems(localCart.items);
    };

    loadLocalCart();

    // Listen cart-updated event
    const handleCartUpdate = () => {
      loadLocalCart();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('losia:cart-changed', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('losia:cart-changed', handleCartUpdate);
    };
  }, []);

  // Merge localStorage items với API items
  const mergedItems = useMemo(() => {
    // Nếu có API items (user đã đăng nhập), ưu tiên API
    if (apiItems && apiItems.length > 0) {
      return apiItems.map(item => ({
        id: item.product.id,
        variantId: item.productId, // Tạm map productId làm variantId
        title: item.product.title,
        price: item.product.price,
        quantity: item.qty,
        imageUrl: item.product.cover,
        variantName: null,
        inStock: item.product.inStock,
      }));
    }

    // Nếu không có API items, dùng localStorage
    return localCartItems.map(item => ({
      id: item.productId,
      variantId: item.variantId,
      title: item.productName,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      variantName: item.variantName,
      inStock: true, // Giả định còn hàng
    }));
  }, [apiItems, localCartItems]);

  // Tính count và subtotal
  const count = useMemo(() => {
    if (apiCount > 0) return apiCount;
    return localCartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [apiCount, localCartItems]);

  const subtotal = useMemo(() => {
    if (apiSubtotal > 0) return apiSubtotal;
    return localCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [apiSubtotal, localCartItems]);

  // Mount + listeners
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // mở nếu có cờ từ AddToCartTracked (chống miss event)
      try {
        if (localStorage.getItem('losia:open-minicart') === '1') {
          localStorage.removeItem('losia:open-minicart');
          setOpen(true);
        }
      } catch {}
    }

    // nghe sự kiện mở drawer
    const onOpen = () => setOpen(true);
    window.addEventListener('losia:minicart:open', onOpen);

    // khi tab quay lại foreground thì refresh cart
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('losia:minicart:open', onOpen);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  // Mỗi lần mở, đảm bảo data mới nhất
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  // ESC để đóng
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const hasItems = count > 0;
  const iconSrc = hasItems ? '/assets/icons/cart_hover.svg' : '/assets/icons/cart.svg';
  const badgeTone = hasItems ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-600';
  const displayCount = count > 99 ? '99+' : String(count);
  const sizeCls = count >= 10 ? 'w-6 h-6 text-[10px]' : 'w-5 h-5 text-[11px]';

  const goCart = useCallback(() => {
    setOpen(false);
    router.push(`/cart?ts=${Date.now()}`);
  }, [router]);

  const goCheckout = useCallback(() => {
    setOpen(false);
    router.push(`/checkout?ts=${Date.now()}`);
  }, [router]);

  const remove = useCallback(
    async (variantId: string, productId: string) => {
      if (removing) return;
      setRemoving(variantId);
      try {
        // 1. Xóa từ localStorage
        removeFromLocalCart(variantId);
        setLocalCartItems(getLocalCart().items);

        // 2. Nếu có API cart, xóa từ API
        try {
          await internalDelete(`/api/cart?productId=${encodeURIComponent(productId)}`);
          await refresh();
        } catch {
          // API fail nhưng localStorage đã xóa
        }

        // 3. Dispatch events
        window.dispatchEvent(new CustomEvent('losia:cart-changed'));
        window.dispatchEvent(new CustomEvent('cart-updated'));
      } catch {
        // noop
      } finally {
        setRemoving(null);
      }
    },
    [refresh, removing]
  );

  return (
    <>
      {/* Trigger (ẩn nếu hideTrigger = true) */}
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Giỏ hàng, ${count} sản phẩm`}
          className={`relative inline-flex items-center ${className}`}
        >
          <Image src={iconSrc} alt="" width={20} height={20} sizes="20px" aria-hidden />
          <span
            aria-live="polite"
            aria-atomic="true"
            className={`absolute -right-2 -top-2 rounded-full ${sizeCls} ${badgeTone}
                        inline-flex items-center justify-center font-semibold leading-none select-none
                        ring-2 ring-white transition-colors`}
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {displayCount}
          </span>
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        } transition-transform`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Giỏ hàng</div>
          <button onClick={() => setOpen(false)} className="rounded-md border px-2 py-1 text-xs">
            Đóng
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {mergedItems.length > 0 ? (
            <ul className="divide-y">
              {mergedItems.map((item) => (
                <li key={item.variantId} className="p-4 flex gap-3">
                  <Image
                    src={item.imageUrl || '/assets/images/main/product1.jpg'}
                    alt={item.title}
                    width={64}
                    height={80}
                    className="h-20 w-16 rounded object-cover bg-gray-100"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-medium line-clamp-1">{item.title}</div>
                    {item.variantName && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.variantName}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {item.inStock ? 'Còn hàng' : 'Hết hàng'} · Số lượng: {item.quantity}
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {formatVND(item.price * item.quantity)}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(item.variantId, item.id)}
                    disabled={removing === item.variantId}
                    className="self-start rounded-md border px-2 py-1 text-xs disabled:opacity-60"
                  >
                    {removing === item.variantId ? 'Đang xoá…' : 'Xoá'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-600">
              Giỏ hàng trống.<br />
              <Link href="/" className="text-sm font-semibold text-black underline underline-offset-2">
                Tiếp tục mua sắm
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span>Tạm tính</span>
            <span className="font-semibold">{formatVND(subtotal)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={goCart} className="flex-1 rounded-lg border px-4 py-2 text-sm">
              Xem giỏ hàng
            </button>
            <button
              onClick={goCheckout}
              className="flex-1 rounded-lg bg-black text-white px-4 py-2 text-sm"
            >
              Thanh toán
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
