import { prisma } from "../lib/db";

// Let's test the exact bulk upload logic on 21 rows to see what took time or if any query threw an error
async function main() {
  console.log("Testing database latency and queries...");

  const startTime = Date.now();

  const categories = await prisma.category.findMany({ take: 5 });
  console.log(`Fetched categories in ${Date.now() - startTime}ms`);

  const t1 = Date.now();
  const testProduct = await prisma.product.create({
    data: {
      name: "Test Benchmark Garment " + Date.now(),
      slug: "test-benchmark-garment-" + Date.now(),
      categoryId: categories[0].id,
      status: "ACTIVE",
      variants: {
        create: {
          sku: "TEST-SKU-" + Date.now(),
          size: "XL",
          colour: "Red",
          price: 999,
          stockQuantity: 25,
        },
      },
      images: {
        createMany: {
          data: [
            { imageUrl: "https://example.com/1.jpg", sortOrder: 0 },
            { imageUrl: "https://example.com/2.jpg", sortOrder: 1 },
          ],
        },
      },
    },
  });

  console.log(`Created product with variant and images in ${Date.now() - t1}ms (ID: ${testProduct.id})`);

  // Clean up
  await prisma.productImage.deleteMany({ where: { productId: testProduct.id } });
  await prisma.productVariant.deleteMany({ where: { productId: testProduct.id } });
  await prisma.product.delete({ where: { id: testProduct.id } });

  console.log(`Cleaned up in ${Date.now() - startTime}ms total.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
