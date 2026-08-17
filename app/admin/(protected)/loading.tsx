export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      <div className="h-8 w-56 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-line bg-surface p-4 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-line bg-surface p-6 animate-pulse" />
    </div>
  );
}
