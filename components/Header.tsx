import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import HeaderClient from "./HeaderClient";
import AnnouncementBar from "@/components/ui/AnnouncementBar";

// In-memory cache for active category navigation (revalidates every 60 seconds)
const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });
  },
  ["active-header-categories"],
  { revalidate: 60, tags: ["categories"] }
);

export default async function Header() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    getCachedCategories(),
  ]);

  return (
    <div className="sticky top-0 z-40">
      <AnnouncementBar />
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E8E3D8] shadow-xs transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            {/* Official Brand Logo */}
            <Link
              href="/"
              prefetch={true}
              className="shrink-0 flex items-center gap-2 group"
              aria-label="Fashion Cart Homepage"
            >
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 overflow-hidden transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="/fashion-cart-logo-transparent.svg"
                  alt="Fashion Cart Luxury Monogram Logo"
                  fill
                  sizes="44px"
                  priority
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-lg sm:text-xl tracking-tight text-[#141416] leading-none">
                  Fashion Cart
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#C59B27] leading-tight mt-0.5">
                  Luxury Atelier
                </span>
              </div>
            </Link>

            {/* Central Navigation, Category Mega Menu, Search & Actions */}
            <HeaderClient
              isLoggedIn={!!user}
              userName={user?.name}
              categories={categories as any}
            />
          </div>
        </div>
      </header>
    </div>
  );
}
