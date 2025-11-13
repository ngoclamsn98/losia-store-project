// src/app/(public)/components/cart/PromoCodeForm.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';

interface PromoCodeFormProps {
  onVoucherApplied?: (voucherCode: string, discountAmount: number) => void;
}

export default function PromoCodeForm({ onVoucherApplied }: PromoCodeFormProps) {
  const { total, count } = useCart();
  const [code, setCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Kiểm tra giỏ hàng có trống không
  const isCartEmpty = count === 0 || total === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    // Kiểm tra giỏ hàng trống
    if (isCartEmpty) {
      setError('Vui lòng thêm sản phẩm vào giỏ hàng trước khi áp dụng mã giảm giá');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          orderValue: total,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.message || 'Mã voucher không hợp lệ');
        setAppliedCode('');
        setDiscountAmount(0);
        onVoucherApplied?.('', 0);
        return;
      }

      setAppliedCode(code.trim());
      setDiscountAmount(data.discountAmount);
      setMessage(data.message || 'Áp dụng mã thành công!');
      onVoucherApplied?.(code.trim(), data.discountAmount);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      setAppliedCode('');
      setDiscountAmount(0);
      onVoucherApplied?.('', 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedCode('');
    setDiscountAmount(0);
    setError('');
    setMessage('');
    onVoucherApplied?.('', 0);
  };

  return (
    <form className="mt-3" onSubmit={handleSubmit}>
      <label htmlFor="promo" className="text-sm font-medium">
        Mã khuyến mãi
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="promo"
          name="promo"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={appliedCode || "Nhập mã khuyến mãi"}
          disabled={!!appliedCode || isLoading || isCartEmpty}
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {appliedCode ? (
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg border bg-red-50 border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            Xóa
          </button>
        ) : (
          <button
            type="submit"
            disabled={!code.trim() || isLoading || isCartEmpty}
            className="rounded-lg border bg-black text-white px-3 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isCartEmpty ? 'Vui lòng thêm sản phẩm vào giỏ hàng' : ''}
          >
            {isLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">❌ {error}</p>
      )}

      {message && !error && (
        <p className="mt-1 text-xs text-green-600">✅ {message}</p>
      )}

      {discountAmount > 0 && (
        <p className="mt-1 text-xs text-green-600">
          💰 Giảm giá: {discountAmount.toLocaleString('vi-VN')}₫
        </p>
      )}

      {!appliedCode && !error && !message && (
        <p className="mt-1 text-xs text-gray-500">
          {isCartEmpty
            ? '⚠️ Vui lòng thêm sản phẩm vào giỏ hàng để áp dụng mã giảm giá'
            : '* Giảm giá sẽ hiển thị khi mã hợp lệ.'}
        </p>
      )}
    </form>
  );
}
