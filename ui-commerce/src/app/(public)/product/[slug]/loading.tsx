export default function ProductDetailLoading() {
  return (
    <main className="container mx-auto py-6 grid grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-x-12">
      {/* Image skeleton */}
      <div className="space-y-4">
        <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Details skeleton */}
      <div className="md:pl-8 lg:pl-12 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
        </div>

        {/* CTA */}
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />

        {/* Details */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}

