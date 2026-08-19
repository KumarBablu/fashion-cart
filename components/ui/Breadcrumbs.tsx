import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  isCurrent?: boolean;
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumbs({ items, className = "" }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb navigation trail"
      className={`w-full max-w-full overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth whitespace-nowrap text-[11px] sm:text-xs font-semibold tracking-wide text-[#787C87]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <div key={`${item.label}-${index}`} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Separator Chevron (except for first item) */}
              {!isFirst && (
                <span className="text-[#C59B27] font-serif text-xs select-none opacity-80" aria-hidden="true">
                  ›
                </span>
              )}

              {/* Breadcrumb Node */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E7DFD5] text-[#4B4E56] hover:text-[#141416] transition-all duration-200 flex items-center gap-1 shadow-2xs group"
                >
                  {isFirst && <span className="text-xs group-hover:scale-110 transition-transform">🏠</span>}
                  <span className="group-hover:text-[#C59B27] transition-colors">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${
                    isLast
                      ? "bg-[#141416] text-[#FAF8F5] border-[#141416] font-bold"
                      : "bg-[#FAF8F5] text-[#787C87] border-[#E7DFD5]"
                  }`}
                  aria-current={isLast ? "page" : undefined}
                >
                  <span className="text-[#C59B27] text-[10px]">✦</span>
                  <span className="truncate max-w-[180px] sm:max-w-[280px] md:max-w-[400px]">
                    {item.label}
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
