import { prisma } from "../lib/db";
import { normalizeImageUrl } from "../lib/utils/imageUrl";

async function main() {
  const images = await prisma.productImage.findMany();
  console.log(`Found ${images.length} product images in database.`);

  let updated = 0;
  for (const img of images) {
    const cleanUrl = normalizeImageUrl(img.imageUrl);
    if (cleanUrl !== img.imageUrl) {
      await prisma.productImage.update({
        where: { id: img.id },
        data: { imageUrl: cleanUrl },
      });
      updated++;
    }
  }

  console.log(`Successfully migrated and cleaned ${updated} product image URLs!`);

  // Verify
  const sample = await prisma.productImage.findMany({ take: 5, orderBy: { createdAt: "desc" } });
  console.log("Sample clean images now in DB:");
  for (const s of sample) {
    console.log(`- ${s.imageUrl}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
