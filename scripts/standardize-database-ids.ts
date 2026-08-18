import { prisma } from "../lib/db";

async function standardizeAllIds() {
  console.log("=== STANDARDIZING DATABASE PRIMARY & FOREIGN IDS ===");

  const userMapping = [
    { email: "bablusoni2825@gmail.com", newId: "FC-ADM-000001", name: "Bablu Soni", role: "ADMIN" },
    { email: "admin@fashioncart.shop", newId: "FC-ADM-000002", name: "System Administrator", role: "ADMIN" },
    { email: "kumarrohit.1954@gmail.com", newId: "FC-USR-000001", name: "Rohit Kumar", role: "CUSTOMER" },
    { email: "kumar.bablu9547.sv@gmail.com", newId: "FC-USR-000002", name: "Soni", role: "CUSTOMER" },
  ];

  for (const item of userMapping) {
    const existing = await prisma.user.findUnique({ where: { email: item.email } });
    if (!existing) continue;

    const oldId = existing.id;
    if (oldId === item.newId) {
      console.log(`User ${item.email} already has standard ID ${item.newId}`);
      continue;
    }

    console.log(`Migrating ${item.email}: ${oldId} -> ${item.newId}`);

    await prisma.$transaction(async (tx) => {
      // 1. Insert temporary user with temporary email and null phone to avoid unique collision
      await tx.$executeRawUnsafe(`
        INSERT INTO "User" ("id", "name", "email", "phone", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES (
          '${item.newId}',
          '${existing.name.replace(/'/g, "''")}',
          'temp_${Date.now()}_${item.email}',
          NULL,
          '${existing.passwordHash}',
          '${existing.role}',
          ${existing.isActive},
          '${existing.createdAt.toISOString()}',
          NOW()
        );
      `);

      // 2. Re-point child foreign keys
      await tx.$executeRawUnsafe(`UPDATE "Session" SET "userId" = '${item.newId}' WHERE "userId" = '${oldId}';`);
      await tx.$executeRawUnsafe(`UPDATE "Order" SET "userId" = '${item.newId}' WHERE "userId" = '${oldId}';`);
      await tx.$executeRawUnsafe(`UPDATE "Address" SET "userId" = '${item.newId}' WHERE "userId" = '${oldId}';`);
      await tx.$executeRawUnsafe(`UPDATE "Cart" SET "userId" = '${item.newId}' WHERE "userId" = '${oldId}';`);
      await tx.$executeRawUnsafe(`UPDATE "Wishlist" SET "userId" = '${item.newId}' WHERE "userId" = '${oldId}';`);
      await tx.$executeRawUnsafe(`UPDATE "Review" SET "userId" = '${item.newId}' WHERE "userId" = '${oldId}';`);
      await tx.$executeRawUnsafe(`UPDATE "Payment" SET "verifiedById" = '${item.newId}' WHERE "verifiedById" = '${oldId}';`);

      // 3. Delete old user row
      await tx.$executeRawUnsafe(`DELETE FROM "User" WHERE "id" = '${oldId}';`);

      // 4. Restore real email and phone on the new user record
      await tx.$executeRawUnsafe(`
        UPDATE "User" 
        SET "email" = '${item.email}',
            "phone" = ${existing.phone ? `'${existing.phone}'` : "NULL"}
        WHERE "id" = '${item.newId}';
      `);
    });

    console.log(`✅ Successfully updated ${item.email} to ${item.newId}`);
  }

  // Also standardize Category IDs if any cuid
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.id.startsWith("CAT-")) continue;
    const cleanSlug = cat.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    const newCatId = `CAT-${cleanSlug}`;
    console.log(`Standardizing Category ${cat.name}: ${cat.id} -> ${newCatId}`);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`
          INSERT INTO "Category" ("id", "name", "slug", "isActive", "sortOrder", "parentId", "createdAt", "updatedAt")
          VALUES (
            '${newCatId}',
            '${cat.name.replace(/'/g, "''")}',
            'temp_${Date.now()}_${cat.slug}',
            ${cat.isActive},
            ${cat.sortOrder},
            NULL,
            '${cat.createdAt.toISOString()}',
            NOW()
          );
        `);

        await tx.$executeRawUnsafe(`UPDATE "Product" SET "categoryId" = '${newCatId}' WHERE "categoryId" = '${cat.id}';`);
        await tx.$executeRawUnsafe(`UPDATE "Category" SET "parentId" = '${newCatId}' WHERE "parentId" = '${cat.id}';`);
        await tx.$executeRawUnsafe(`DELETE FROM "Category" WHERE "id" = '${cat.id}';`);
        await tx.$executeRawUnsafe(`UPDATE "Category" SET "slug" = '${cat.slug}' WHERE "id" = '${newCatId}';`);
      });
      console.log(`✅ Standardized Category ${cat.name} to ${newCatId}`);
    } catch (err) {
      console.warn(`Category ${cat.name} skipped:`, err);
    }
  }

  // List all users to verify
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, phone: true },
    orderBy: { id: "asc" },
  });

  console.log("\n--- VERIFIED STANDARDIZED USERS IN DATABASE ---");
  console.table(allUsers);
}

standardizeAllIds()
  .catch((e) => {
    console.error("Migration Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
