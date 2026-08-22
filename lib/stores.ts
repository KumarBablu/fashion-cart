import { getDb } from "./db";

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
  try {
    const settings = await getDb("garments").businessSettings.findFirst();
    if (settings && settings.gstin && settings.gstin.startsWith("STORE_CTRL:")) {
      const rawJson = settings.gstin.replace("STORE_CTRL:", "");
      const parsed = JSON.parse(rawJson);
      return {
        garments: { ...DEFAULT_STORES_CONTROL.garments, ...parsed.garments },
        jewellery: { ...DEFAULT_STORES_CONTROL.jewellery, ...parsed.jewellery },
      };
    }
  } catch (err) {
    console.warn("[getStoresControl] fallback to default:", err);
  }
  return DEFAULT_STORES_CONTROL;
}

export async function saveStoresControl(data: Partial<AllStoresControl>): Promise<AllStoresControl> {
  const current = await getStoresControl();
  const updated: AllStoresControl = {
    garments: { ...current.garments, ...(data.garments || {}) },
    jewellery: { ...current.jewellery, ...(data.jewellery || {}) },
  };

  const payloadStr = `STORE_CTRL:${JSON.stringify(updated)}`;

  // Save to both databases for immediate global consistency
  await Promise.all([
    (async () => {
      try {
        const first = await getDb("garments").businessSettings.findFirst();
        if (first) {
          await getDb("garments").businessSettings.update({
            where: { id: first.id },
            data: { gstin: payloadStr },
          });
        } else {
          await getDb("garments").businessSettings.create({
            data: { gstin: payloadStr, businessName: "Fashion Cart" },
          });
        }
      } catch (e) {
        console.warn("Failed saving garments store control", e);
      }
    })(),
    (async () => {
      try {
        const first = await getDb("jewellery").businessSettings.findFirst();
        if (first) {
          await getDb("jewellery").businessSettings.update({
            where: { id: first.id },
            data: { gstin: payloadStr },
          });
        } else {
          await getDb("jewellery").businessSettings.create({
            data: { gstin: payloadStr, businessName: "Fashion Cart Jewellery" },
          });
        }
      } catch (e) {
        console.warn("Failed saving jewellery store control", e);
      }
    })(),
  ]);

  return updated;
}
