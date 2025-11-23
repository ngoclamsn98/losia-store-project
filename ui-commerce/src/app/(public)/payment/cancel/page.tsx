'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);

  const orderCode = searchParams.get('orderCode');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/checkout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {/* Cancel Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <XCircle className="w-20 h-20 text-red-500 mx-auto" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Thanh toán đã bị hủy
        </h1>
        <p className="text-neutral-600 mb-8">
          Bạn đã hủy giao dịch thanh toán
        </p>

        {/* Order Info */}
        {orderCode && (
          <div className="bg-neutral-50 rounded-xl p-4 mb-6">
            <div className="text-sm">
              <span className="text-neutral-600">Mã đơn hàng: </span>
              <span className="font-mono font-semibold">{orderCode}</span>
            </div>
          </div>
        )}

        {/* Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ Đơn hàng của bạn vẫn được lưu. Bạn có thể quay lại trang thanh toán
            để hoàn tất đơn hàng hoặc chọn phương thức thanh toán khác.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white py-3 font-semibold hover:bg-neutral-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại thanh toán
          </Link>
          
          <Link
            href="/cart"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-white text-neutral-900 py-3 font-semibold hover:bg-neutral-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay về giỏ hàng
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 text-neutral-600 py-2 text-sm hover:text-neutral-900 transition"
          >
            Về trang chủ
          </Link>
        </div>

        {/* Auto redirect */}
        <p className="mt-6 text-sm text-neutral-500">
          Tự động chuyển về trang thanh toán sau {countdown} giây...
        </p>
      </motion.div>
    </div>
  );
}

