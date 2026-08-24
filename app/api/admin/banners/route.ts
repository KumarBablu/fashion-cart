import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const DEFAULT_OCCASIONS = [
  {
    title: "Festive & Gala Edit",
    subtitle: "Zari Velvet & Anarkalis",
    badge: "Artisanal Craft",
    linkUrl: "/shop?category=women-kurtis",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    buttonText: "Explore Outfits",
    position: "OCCASION",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "Wedding & Silk Soirée",
    subtitle: "Mulberry Silk & Gowns",
    badge: "Pure Silk",
    linkUrl: "/shop?category=women-dresses",
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    buttonText: "Explore Outfits",
    position: "OCCASION",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "Sartorial Menswear",
    subtitle: "French Linen & Mandarin Shirts",
    badge: "Tailored Linen",
    linkUrl: "/shop?category=men-shirts",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    buttonText: "Explore Outfits",
    position: "OCCASION",
    sortOrder: 3,
    isActive: true,
  },
  {
    title: "Earth & Sand Co-ords",
    subtitle: "Chanderi Silks & Sets",
    badge: "Curated Look",
    linkUrl: "/shop?onSale=true",
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
    buttonText: "Explore Outfits",
    position: "OCCASION",
    sortOrder: 4,
    isActive: true,
  },
];

const DEFAULT_HERO = {
  title: "Timeless Elegance. Effortless Style.",
  subtitle: "Discover masterfully tailored garments crafted from certified pure Mulberry silks, breathable French linens, and rich hand-embroidered velvets.",
  badge: "The 2026 Signature Luxury Edit · Live Drops",
  linkUrl: "/shop",
  imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=85",
  buttonText: "Explore New Season →",
  position: "HERO",
  sortOrder: 0,
  isActive: true,
};

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const db = getDb(store === "jewellery" ? "jewellery" : "garments");

  try {
    let banners = await db.banner.findMany({
      orderBy: [{ position: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    // If no banners exist yet, seed initial default hero & occasions so admin has immediate visual editing controls
    if (banners.length === 0) {
      await db.banner.create({ data: DEFAULT_HERO });
      for (const occ of DEFAULT_OCCASIONS) {
        await db.banner.create({ data: occ });
      }

      banners = await db.banner.findMany({
        orderBy: [{ position: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      });
    }

    return NextResponse.json({ banners });
  } catch (error: any) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ error: error.message || "Failed to load banners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const db = getDb(store === "jewellery" ? "jewellery" : "garments");

  try {
    const body = await req.json();
    const { title, subtitle, badge, linkUrl, imageUrl, buttonText, position, isActive, sortOrder } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const created = await db.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        badge: badge?.trim() || null,
        linkUrl: linkUrl?.trim() || "/shop",
        imageUrl: imageUrl?.trim() || null,
        buttonText: buttonText?.trim() || "Shop Now",
        position: position?.trim() || "OCCASION",
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/", "layout");
    } catch {}

    return NextResponse.json({
      success: true,
      banner: created,
      message: `Created banner "${created.title}".`,
    });
  } catch (error: any) {
    console.error("Error creating banner:", error);
    return NextResponse.json({ error: error.message || "Failed to create banner" }, { status: 500 });
  }
}
