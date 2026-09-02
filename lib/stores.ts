import { getDb } from "./db";
import { getCachedStoresControl } from "./data/cache";

export type StoreControl = {
  id: "garments" | "jewellery";
  name: string;
  isActive: boolean;
  closedMessage: string;
};

export type AllStoresControl = {
  garments: StoreControl;
  jewellery: StoreControl;
};

export const DEFAULT_STORES_CONTROL: AllStoresControl = {
  garments: {
    id: "garments",
    name: "Atelier Haute Couture Garments",
    isActive: true,
    closedMessage: "Our Garments Boutique is temporarily undergoing catalog maintenance. We will reopen shortly!",
  },
  jewellery: {
    id: "jewellery",
    name: "Imperial Fine & Artificial Jewellery",
    isActive: true,
    closedMessage: "Our Imperial Jewellery Maison is temporarily closed for inventory curation. Please check back shortly!",
  },
};

export async function getStoresControl(): Promise<AllStoresControl> {
  return getCachedStoresControl();
}

export async function saveStoresControl(data: Partial<AllStoresControl>): Promise<AllStoresControl> {
  const current = await getStoresControl();
  const updated: AllStoresControl = {
    garments: { ...current.garments, ...(data.garments || {}) },
    jewellery: { ...current.jewellery, ...(data.jewellery || {}) },
  };

  const garmentsVal = updated.garments.isActive ? 1 : 0;
  const jewelleryVal = updated.jewellery.isActive ? 1 : 0;

  // Save to both databases for immediate global consistency using atomic Counter table records
  await Promise.all([
    (async () => {
      try {
        const db = getDb("garments");
        await Promise.all([
          db.counter.upsert({
            where: { id: "store-control-garments" },
            update: { value: garmentsVal },
            create: { id: "store-control-garments", value: garmentsVal },
          }),
          db.counter.upsert({
            where: { id: "store-control-jewellery" },
            update: { value: jewelleryVal },
            create: { id: "store-control-jewellery", value: jewelleryVal },
          }),
        ]);
      } catch (e) {
        console.warn("Failed saving garments store control in Counter", e);
      }
    })(),
    (async () => {
      try {
        const db = getDb("jewellery");
        await Promise.all([
          db.counter.upsert({
            where: { id: "store-control-garments" },
            update: { value: garmentsVal },
            create: { id: "store-control-garments", value: garmentsVal },
          }),
          db.counter.upsert({
            where: { id: "store-control-jewellery" },
            update: { value: jewelleryVal },
            create: { id: "store-control-jewellery", value: jewelleryVal },
          }),
        ]);
      } catch (e) {
        console.warn("Failed saving jewellery store control in Counter", e);
      }
    })(),
  ]);

  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");
  } catch {
    // ignore outside request context
  }

  return updated;
}

