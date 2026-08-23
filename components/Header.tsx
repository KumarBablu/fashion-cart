import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import HeaderClient from "./HeaderClient";
import AnnouncementBar from "@/components/ui/AnnouncementBar";

export default async function Header() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
        OR: [
          { products: { some: { status: "ACTIVE" } } },
          { children: { some: { isActive: true, products: { some: { status: "ACTIVE" } } } } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: {
            isActive: true,
            products: { some: { status: "ACTIVE" } },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    }),
  ]);

  return (
    <div className="sticky top-0 z-40 w-full overflow-hidden">
      <AnnouncementBar />
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E8E3D8] shadow-xs transition-colors duration-200 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-16 sm:h-18 flex items-center justify-between" />}>
            <HeaderClient
              isLoggedIn={!!user}
              userName={user?.name}
              categories={categories as any}
            />
          </Suspense>
        </div>
      </header>
    </div>
  );
}
