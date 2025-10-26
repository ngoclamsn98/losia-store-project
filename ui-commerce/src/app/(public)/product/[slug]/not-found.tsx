import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Sản phẩm không tồn tại
        </h2>
        <p className="text-gray-600 mb-8">
          Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition"
          >
            Xem tất cả sản phẩm
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}

