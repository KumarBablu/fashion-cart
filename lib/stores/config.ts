export type StoreId = "garments" | "jewellery";

export interface StoreConfig {
  id: StoreId;
  name: string;
  subName: string;
  tagline: string;
  slug: string;
  themeClass: string;
  badge: string;
  accentColor: string;
  bannerImage: string;
  features: {
    sizeType: "clothing" | "jewellery";
    hasFabricFilter: boolean;
    hasPlatingFilter: boolean;
  };
}

export const STORES_CONFIG: Record<StoreId, StoreConfig> = {
  garments: {
    id: "garments",
    name: "Atelier Couture",
    subName: "Apparel & Ethnic Wear",
    tagline: "Handcrafted Sarees, Velvet Anarkalis & Sartorial Menswear",
    slug: "garments",
    themeClass: "theme-garments",
    badge: "Haute Couture",
    accentColor: "#C59B27", // Champagne Gold
    bannerImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=85",
    features: {
      sizeType: "clothing",
      hasFabricFilter: true,
      hasPlatingFilter: false,
    },
  },
  jewellery: {
    id: "jewellery",
    name: "Imperial Jewels",
    subName: "Fine & Artificial Jewellery",
    tagline: "24K Micro-Plated Kundan, Polki, Jhumkas, Bangles & Bridal Sets",
    slug: "jewellery",
    themeClass: "theme-jewellery",
    badge: "24K Micron Gold Plated",
    accentColor: "#D4AF37", // Royal Gold
    bannerImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=85",
    features: {
      sizeType: "jewellery",
      hasFabricFilter: false,
      hasPlatingFilter: true,
    },
  },
};

export function getStoreConfig(storeId: string = "garments"): StoreConfig {
  const normalized = storeId.toLowerCase().trim() as StoreId;
  return STORES_CONFIG[normalized] || STORES_CONFIG.garments;
}
