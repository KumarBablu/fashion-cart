export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DFD5] pb-4">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-[#E7DFD5]/60 rounded-full animate-pulse" />
          <div className="h-7 w-64 bg-[#E7DFD5]/80 rounded-xl animate-pulse" />
        </div>
        <div className="h-4 w-28 bg-[#E7DFD5]/50 rounded-full animate-pulse" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-[#E7DFD5] bg-white p-3 space-y-3 shadow-sm"
          >
            <div className="aspect-[3/4] w-full rounded-2xl bg-[#F4EFEA] relative overflow-hidden animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-20 bg-[#E7DFD5]/60 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-[#141416]/10 rounded animate-pulse" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#E7DFD5]/50">
              <div className="h-5 w-20 bg-[#141416]/15 rounded animate-pulse" />
              <div className="h-4 w-12 bg-[#C59B27]/20 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
