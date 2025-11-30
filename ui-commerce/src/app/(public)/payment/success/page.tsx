'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const orderCode = searchParams.get('orderCode');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Thanh toán thành công!
        </h1>
        <p className="text-neutral-600 mb-8">
          Cảm ơn bạn đã mua hàng tại Circ
        </p>

        {/* Order Info */}
        {orderCode && (
          <div className="bg-neutral-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-neutral-600" />
              <span className="font-semibold">Thông tin đơn hàng</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Mã đơn hàng:</span>
                <span className="font-mono font-semibold">{orderCode}</span>
              </div>
              {amount && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Số tiền:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(Number(amount))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            📧 Chúng tôi đã gửi email xác nhận đơn hàng đến địa chỉ email của bạn.
            Vui lòng kiểm tra hộp thư để biết thêm chi tiết.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/orders"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white py-3 font-semibold hover:bg-neutral-800 transition"
          >
            Xem đơn hàng
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-white text-neutral-900 py-3 font-semibold hover:bg-neutral-50 transition"
          >
            Tiếp tục mua sắm
          </Link>
        </div>

        {/* Auto redirect */}
        <p className="mt-6 text-sm text-neutral-500">
          Tự động chuyển về trang chủ sau {countdown} giây...
        </p>
      </motion.div>
    </div>
  );
}

