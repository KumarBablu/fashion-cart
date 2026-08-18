import { prisma } from "../lib/db";

async function inspectAndActivateCategories() {
  console.log("=== INSPECTING ALL CATEGORIES IN DATABASE ===");
  const allCats = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`Found ${allCats.length} total categories:`);
  for (const c of allCats) {
    console.log(`- ${c.name} (${c.slug}) -> isActive: ${c.isActive}, parentId: ${c.parentId}`);
  }

  // Reactivate all categories so user has all of them back active immediately
  const activated = await prisma.category.updateMany({
    data: { isActive: true },
  });
  console.log(`✅ Reactivated ${activated.count} categories to Active state.`);
}

inspectAndActivateCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
