export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header Skeleton */}
      <div className="h-8 w-48 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse mb-6" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-[#E8E3D8] bg-white p-3 space-y-3 shadow-xs"
          >
            <div className="aspect-[3/4] w-full rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
            <div className="h-4 w-3/4 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 w-16 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
