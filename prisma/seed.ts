import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data for Fashion Cart...");

  // ---- Categories ----
  const men = await prisma.category.upsert({
    where: { slug: "men" },
    update: {},
    create: { name: "Men", slug: "men", sortOrder: 1 },
  });
  const women = await prisma.category.upsert({
    where: { slug: "women" },
    update: {},
    create: { name: "Women", slug: "women", sortOrder: 2 },
  });
  const kids = await prisma.category.upsert({
    where: { slug: "kids" },
    update: {},
    create: { name: "Kids", slug: "kids", sortOrder: 3 },
  });

  const menShirts = await prisma.category.upsert({
    where: { slug: "men-shirts" },
    update: {},
    create: { name: "Shirts", slug: "men-shirts", parentId: men.id },
  });
  const menJeans = await prisma.category.upsert({
    where: { slug: "men-jeans" },
    update: {},
    create: { name: "Jeans", slug: "men-jeans", parentId: men.id },
  });
  const womenKurtis = await prisma.category.upsert({
    where: { slug: "women-kurtis" },
    update: {},
    create: { name: "Kurtis", slug: "women-kurtis", parentId: women.id },
  });
  const womenDresses = await prisma.category.upsert({
    where: { slug: "women-dresses" },
    update: {},
    create: { name: "Dresses", slug: "women-dresses", parentId: women.id },
  });
  const kidsWear = await prisma.category.upsert({
    where: { slug: "kids-wear" },
    update: {},
    create: { name: "Kids Wear", slug: "kids-wear", parentId: kids.id },
  });

  // ---- Demo products ----
  type SeedProduct = {
    name: string;
    slug: string;
    categoryId: string;
    brand: string;
    fabric: string;
    description: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    averageRating?: number;
    totalReviews?: number;
    variants: { colour: string; size: string; price: number; compareAtPrice?: number; stock: number }[];
  };

  const products: SeedProduct[] = [
    {
      name: "Classic Cotton Formal Shirt",
      slug: "classic-cotton-formal-shirt",
      categoryId: menShirts.id,
      brand: "Fashion Cart Basics",
      fabric: "100% Cotton",
      description: "A crisp, breathable formal shirt tailored for everyday elegance and office wear. Features reinforced seam stitching, premium mother-of-pearl style buttons, and a structured collar.",
      isFeatured: true,
      isBestSeller: true,
      averageRating: 4.8,
      totalReviews: 24,
      variants: [
        { colour: "Blue", size: "S", price: 899, compareAtPrice: 1199, stock: 12 },
        { colour: "Blue", size: "M", price: 899, compareAtPrice: 1199, stock: 18 },
        { colour: "Blue", size: "L", price: 899, compareAtPrice: 1199, stock: 4 },
        { colour: "White", size: "M", price: 899, stock: 20 },
        { colour: "White", size: "L", price: 899, stock: 10 },
      ],
    },
    {
      name: "Slim Fit Casual Shirt",
      slug: "slim-fit-casual-shirt",
      categoryId: menShirts.id,
      brand: "Fashion Cart Basics",
      fabric: "Cotton Blend",
      description: "A relaxed slim-fit casual shirt tailored for weekends and evening outings. Soft pre-washed finish with dual chest pockets.",
      isNewArrival: true,
      averageRating: 4.6,
      totalReviews: 12,
      variants: [
        { colour: "Green", size: "M", price: 749, stock: 15 },
        { colour: "Green", size: "L", price: 749, stock: 3 },
        { colour: "Maroon", size: "M", price: 749, stock: 8 },
      ],
    },
    {
      name: "Straight Fit Denim Jeans",
      slug: "straight-fit-denim-jeans",
      categoryId: menJeans.id,
      brand: "Fashion Cart Denim",
      fabric: "Denim Stretch",
      description: "Everyday straight-fit authentic indigo denim jeans with a comfortable 2-way stretch. Classic 5-pocket styling and antique brass rivets.",
      isBestSeller: true,
      averageRating: 4.9,
      totalReviews: 45,
      variants: [
        { colour: "Dark Blue", size: "30", price: 1499, compareAtPrice: 1999, stock: 10 },
        { colour: "Dark Blue", size: "32", price: 1499, compareAtPrice: 1999, stock: 14 },
        { colour: "Dark Blue", size: "34", price: 1499, compareAtPrice: 1999, stock: 6 },
      ],
    },
    {
      name: "Printed Straight Rayon Kurti",
      slug: "printed-straight-kurti",
      categoryId: womenKurtis.id,
      brand: "Fashion Cart Ethnic",
      fabric: "100% Rayon",
      description: "A breezy printed straight kurti crafted with vibrant ethnic block patterns. Ultra-comfortable for all-day daily wear and festive gatherings.",
      isFeatured: true,
      isNewArrival: true,
      averageRating: 4.7,
      totalReviews: 31,
      variants: [
        { colour: "Yellow", size: "S", price: 699, compareAtPrice: 999, stock: 9 },
        { colour: "Yellow", size: "M", price: 699, compareAtPrice: 999, stock: 11 },
        { colour: "Pink", size: "M", price: 699, compareAtPrice: 999, stock: 3 },
        { colour: "Pink", size: "L", price: 699, compareAtPrice: 999, stock: 2 },
      ],
    },
    {
      name: "Floral A-Line Chiffon Dress",
      slug: "floral-a-line-dress",
      categoryId: womenDresses.id,
      brand: "Fashion Cart Studio",
      fabric: "Georgette & Chiffon",
      description: "An ethereal floral A-line dress featuring a gentle flare, sweetheart neckline, and a lightweight silhouette perfect for warm summer days.",
      isBestSeller: true,
      averageRating: 4.9,
      totalReviews: 52,
      variants: [
        { colour: "Multicolour", size: "S", price: 1299, compareAtPrice: 1799, stock: 7 },
        { colour: "Multicolour", size: "M", price: 1299, compareAtPrice: 1799, stock: 12 },
        { colour: "Multicolour", size: "L", price: 1299, compareAtPrice: 1799, stock: 5 },
      ],
    },
    {
      name: "Kids Organic Cotton T-Shirt",
      slug: "kids-cotton-tshirt",
      categoryId: kidsWear.id,
      brand: "Fashion Cart Kids",
      fabric: "100% Organic Cotton",
      description: "Hypoallergenic, ultra-soft combed cotton tee for energetic kids. Non-toxic organic dyes that withstand active play and repeat washes.",
      isNewArrival: true,
      averageRating: 4.8,
      totalReviews: 18,
      variants: [
        { colour: "Red", size: "3-4Y", price: 399, stock: 20 },
        { colour: "Red", size: "5-6Y", price: 399, stock: 15 },
        { colour: "Blue", size: "5-6Y", price: 399, stock: 4 },
      ],
    },
    {
      name: "Relaxed Fit Chino Trousers",
      slug: "relaxed-fit-trousers",
      categoryId: men.id,
      brand: "Fashion Cart Basics",
      fabric: "Poly-Cotton Twill",
      description: "Tailored casual chinos engineered with flex-waist technology and deep slant pockets for unmatched daily comfort.",
      averageRating: 4.5,
      totalReviews: 8,
      variants: [
        { colour: "Grey", size: "32", price: 999, compareAtPrice: 1399, stock: 10 },
        { colour: "Grey", size: "34", price: 999, compareAtPrice: 1399, stock: 8 },
        { colour: "Black", size: "32", price: 999, compareAtPrice: 1399, stock: 6 },
      ],
    },
    {
      name: "Embroidered Silk Anarkali Kurti",
      slug: "embroidered-anarkali-kurti",
      categoryId: womenKurtis.id,
      brand: "Fashion Cart Ethnic",
      fabric: "Chanderi Cotton Silk",
      description: "An opulent royal anarkali kurti decorated with intricate golden zari threadwork and delicate tassel details.",
      isFeatured: true,
      averageRating: 5.0,
      totalReviews: 19,
      variants: [
        { colour: "Maroon", size: "M", price: 1799, compareAtPrice: 2499, stock: 5 },
        { colour: "Maroon", size: "L", price: 1799, compareAtPrice: 2499, stock: 3 },
        { colour: "Navy", size: "M", price: 1799, compareAtPrice: 2499, stock: 2 },
      ],
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        averageRating: p.averageRating ?? 0,
        totalReviews: p.totalReviews ?? 0,
      },
      create: {
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        brand: p.brand,
        fabric: p.fabric,
        description: p.description,
        status: "ACTIVE",
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isBestSeller: p.isBestSeller ?? false,
        averageRating: p.averageRating ?? 0,
        totalReviews: p.totalReviews ?? 0,
      },
    });

    for (const v of p.variants) {
      const sku = `${p.slug}-${v.colour}-${v.size}`.toUpperCase().replace(/\s+/g, "-");
      await prisma.productVariant.upsert({
        where: { sku },
        update: { stockQuantity: v.stock },
        create: {
          productId: product.id,
          sku,
          colour: v.colour,
          size: v.size,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockQuantity: v.stock,
        },
      });
    }
  }

  // ---- Demo Coupons ----
  const coupons = [
    {
      code: "FIRST10",
      description: "10% off on your first fashion order",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 499,
      maxDiscountAmount: 300,
      isActive: true,
    },
    {
      code: "FASHION200",
      description: "Flat ₹200 off on shopping above ₹1299",
      discountType: "FIXED",
      discountValue: 200,
      minOrderAmount: 1299,
      isActive: true,
    },
    {
      code: "MEGA50",
      description: "Festive Special — Flat ₹50 instant discount",
      discountType: "FIXED",
      discountValue: 50,
      minOrderAmount: 299,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // ---- Default delivery settings ----
  const existingDelivery = await prisma.deliverySettings.findFirst();
  if (!existingDelivery) {
    await prisma.deliverySettings.create({
      data: { defaultCharge: 49, freeDeliveryAbove: 999 },
    });
  }

  // ---- Payment settings ----
  const existingPayment = await prisma.paymentSettings.findFirst();
  if (!existingPayment) {
    await prisma.paymentSettings.create({
      data: {
        isActive: true,
        codEnabled: true,
        codFee: 0,
        upiId: "fashioncart@okaxis",
        instructions: "Scan QR code or use UPI ID. Pay the exact amount and submit your screenshot with UTR number.",
      },
    });
  }

  // ---- Business settings ----
  const existingBusiness = await prisma.businessSettings.findFirst();
  if (!existingBusiness) {
    await prisma.businessSettings.create({
      data: {
        businessName: "Fashion Cart Boutique",
        businessAddress: "42 Silk Street, MG Road, Bengaluru, Karnataka - 560001",
        gstin: "29AABCU9603R1ZM",
        phone: "+91 98765 43210",
        email: "support@fashioncart.shop",
      },
    });
  }

  console.log("Seed complete: 3 top-level categories, 5 subcategories, 8 products, 3 coupons, business & payment presets.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
