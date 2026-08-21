import { prisma } from "../lib/db";

async function main() {
  const images = await prisma.productImage.findMany();
  console.log(`Found ${images.length} product images`);

  let updatedCount = 0;
  for (const img of images) {
    if (img.imageUrl.includes("/api/proxy-image?url=")) {
      const actualUrl = decodeURIComponent(img.imageUrl.split("/api/proxy-image?url=")[1]);
      await prisma.productImage.update({
        where: { id: img.id },
        data: { imageUrl: actualUrl },
      });
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} image URLs to direct clean URLs`);

  // Also fix and enrich descriptions for all 9 products
  const products = await prisma.product.findMany({
    include: { variants: true, category: true },
  });

  for (const p of products) {
    let cleanDesc = p.description || "";
    cleanDesc = cleanDesc
      .replace(/Buy\s+.*?\s+For\s+Only\s+Rs\.\s*[0-9.]+\s+Online\s+in\s+India\.?/gi, "")
      .replace(/Shop\s+Online\s+For\s+Apparels\.?/gi, "")
      .replace(/Huge\s+Collection\s+of\s+Branded\s+Clothes\s+Only\s+at\s+Flipkart\.com\.?/gi, "")
      .replace(/\b(Flipkart|Amazon|Meesho|Myntra|Snapdeal|Ajio|Shopsy)\b(?:\.com)?/gi, "Fashion Cart")
      .replace(/\s*-\s*$/g, "")
      .trim();

    if (cleanDesc.length < 20 || cleanDesc.endsWith("-")) {
      cleanDesc = `${p.name} from ${p.brand || "Fashion Cart Atelier"} is mastercrafted with premium ${p.fabric || "fine fabrics"}, featuring exquisite embroidery and tailored finishing for festive and everyday luxury.`;
    }

    const fabric = p.fabric && p.fabric !== "Pure Fabric" ? p.fabric : "Premium Cotton Silk Blend";
    const material = p.material || fabric;
    const pattern = p.pattern || "Artisan Print / Zari";
    const fit = p.fit || "Comfort Regular Fit";
    const occasion = p.occasion || "Festive & Daily Luxury";

    await prisma.product.update({
      where: { id: p.id },
      data: {
        description: cleanDesc,
        fabric,
        material,
        pattern,
        fit,
        occasion,
      },
    });
  }

  console.log(`Cleaned and enriched ${products.length} product descriptions and fashion specifications`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
