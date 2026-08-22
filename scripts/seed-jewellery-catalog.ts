import { getDb } from "../lib/db";

async function main() {
  const db = getDb("jewellery");
  console.log("💎 Seeding Imperial Artificial Jewellery catalog to Supabase (fashion-cart-jwellery)...");

  // 1. Root Categories
  const catNecklaces = await db.category.upsert({
    where: { slug: "necklaces-sets" },
    update: {},
    create: {
      name: "Necklaces & Bridal Sets",
      slug: "necklaces-sets",
      sortOrder: 1,
      imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80",
    },
  });

  const catEarrings = await db.category.upsert({
    where: { slug: "earrings-jhumkas" },
    update: {},
    create: {
      name: "Earrings & Jhumkas",
      slug: "earrings-jhumkas",
      sortOrder: 2,
      imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&auto=format&fit=crop&q=80",
    },
  });

  const catBangles = await db.category.upsert({
    where: { slug: "bangles-kadas" },
    update: {},
    create: {
      name: "Bangles & Kadas",
      slug: "bangles-kadas",
      sortOrder: 3,
      imageUrl: "https://images.unsplash.com/photo-1611591475836-4188c035626a?w=600&auto=format&fit=crop&q=80",
    },
  });

  const catRings = await db.category.upsert({
    where: { slug: "rings" },
    update: {},
    create: {
      name: "Finger Rings & Solitaires",
      slug: "rings",
      sortOrder: 4,
      imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80",
    },
  });

  const catBridal = await db.category.upsert({
    where: { slug: "bridal-accents" },
    update: {},
    create: {
      name: "Bridal Accents & Naths",
      slug: "bridal-accents",
      sortOrder: 5,
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80",
    },
  });

  const catMens = await db.category.upsert({
    where: { slug: "mens-jewellery" },
    update: {},
    create: {
      name: "Men's Royal Jewellery",
      slug: "mens-jewellery",
      sortOrder: 6,
      imageUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&auto=format&fit=crop&q=80",
    },
  });

  // 2. Subcategories
  const subKundan = await db.category.upsert({
    where: { slug: "kundan-chokers" },
    update: {},
    create: { name: "Kundan Chokers", slug: "kundan-chokers", parentId: catNecklaces.id, sortOrder: 1 },
  });

  const subTempleHaar = await db.category.upsert({
    where: { slug: "temple-haar" },
    update: {},
    create: { name: "Temple Antique Haar", slug: "temple-haar", parentId: catNecklaces.id, sortOrder: 2 },
  });

  const subJhumkas = await db.category.upsert({
    where: { slug: "royal-jhumkas" },
    update: {},
    create: { name: "Royal Jhumkas", slug: "royal-jhumkas", parentId: catEarrings.id, sortOrder: 1 },
  });

  const subChandbalis = await db.category.upsert({
    where: { slug: "chandbalis" },
    update: {},
    create: { name: "Chandbalis", slug: "chandbalis", parentId: catEarrings.id, sortOrder: 2 },
  });

  const subKadas = await db.category.upsert({
    where: { slug: "openable-kadas" },
    update: {},
    create: { name: "Openable Kadas", slug: "openable-kadas", parentId: catBangles.id, sortOrder: 1 },
  });

  const subCocktailRings = await db.category.upsert({
    where: { slug: "adjustable-cocktail-rings" },
    update: {},
    create: { name: "Cocktail Rings", slug: "adjustable-cocktail-rings", parentId: catRings.id, sortOrder: 1 },
  });

  const subTikka = await db.category.upsert({
    where: { slug: "maang-tikka" },
    update: {},
    create: { name: "Maang Tikka & Matha Patti", slug: "maang-tikka", parentId: catBridal.id, sortOrder: 1 },
  });

  const subBrooches = await db.category.upsert({
    where: { slug: "royal-brooches" },
    update: {},
    create: { name: "Royal Kalgi & Brooches", slug: "royal-brooches", parentId: catMens.id, sortOrder: 1 },
  });

  // 3. Sample High-End Artificial Jewellery Products
  const sampleJewellery = [
    {
      name: "Mughal Kundan & Pearl Bridal Choker Set",
      slug: "mughal-kundan-pearl-bridal-choker-set",
      categoryId: subKundan.id,
      brand: "Imperial Jewels",
      fabric: "High Purity Brass Alloy", // Base metal
      pattern: "24K Micro Gold Plated & Meenakari", // Plating
      occasion: "Bridal & Wedding",
      description: "An opulent royal choker set featuring uncut hand-set Kundan stones, emerald meenakari back-enameling, and cascading freshwater imitation pearls. Comes with matching jhumkas and maang tikka.",
      isFeatured: true,
      isBestSeller: true,
      averageRating: 4.9,
      totalReviews: 38,
      specifications: {
        base_metal: "High Purity Brass & Copper Alloy",
        plating: "24K Micron Gold Plated with Anti-Tarnish Coating",
        stone_type: "Uncut Hand-set Kundan & Austrian Pearls",
        closure: "Adjustable Silk Thread Dori (Necklace) & Push-back (Earrings)",
        package_contains: "1 Choker Necklace, 1 Pair Earrings, 1 Maang Tikka",
        weight_grams: "145g",
        care_guide: "Keep away from direct heat, water, perfumes, and deodorants. Store in the velvet airtight box provided.",
      },
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&auto=format&fit=crop&q=85",
      ],
      variants: [
        { sku: "JW-KND-01-GOLD", colour: "Gold & Emerald", size: "Free Size (Adjustable)", price: 3499, compareAtPrice: 5999, stockQuantity: 15 },
        { sku: "JW-KND-01-RUBY", colour: "Gold & Ruby Pink", size: "Free Size (Adjustable)", price: 3499, compareAtPrice: 5999, stockQuantity: 10 },
      ],
    },
    {
      name: "Antique Temple Matte Gold Long Haar Set",
      slug: "antique-temple-matte-gold-long-haar-set",
      categoryId: subTempleHaar.id,
      brand: "Imperial Jewels",
      fabric: "Copper & Brass",
      pattern: "Antique 22K Matte Gold Polish",
      occasion: "Festive & Festive South Indian",
      description: "Intricately embossed Lakshmi motifs and temple deities in rich matte antique gold polish. Adorned with Kemp stones and subtle golden ghungroo drop accents.",
      isFeatured: true,
      averageRating: 4.8,
      totalReviews: 21,
      specifications: {
        base_metal: "Copper & Brass",
        plating: "22K Antique Matte Gold Finish",
        stone_type: "Kemp & Ruby Red Cabochons",
        closure: "Adjustable Gold Polish Chain Link",
        package_contains: "1 Long Haar Necklace, 1 Pair Temple Jhumkas",
        weight_grams: "180g",
        care_guide: "Wipe with a soft cotton cloth after use. Store away from moisture.",
      },
      images: [
        "https://images.unsplash.com/photo-1611591475836-4188c035626a?w=1000&auto=format&fit=crop&q=85",
      ],
      variants: [
        { sku: "JW-TMP-02-MATTE", colour: "Antique Gold", size: "Free Size (Adjustable)", price: 2899, compareAtPrice: 4499, stockQuantity: 12 },
      ],
    },
    {
      name: "Bahubali Royal Chandbali Earrings with Hair Chains",
      slug: "bahubali-royal-chandbali-earrings",
      categoryId: subChandbalis.id,
      brand: "Imperial Jewels",
      fabric: "Brass Alloy",
      pattern: "24K Gold Plated",
      occasion: "Sangeet & Festive",
      description: "Dramatic crescent moon shaped Chandbalis featuring tiered pearl droplets and detachable sahara hair chains for a grand royal silhouette.",
      isNewArrival: true,
      isBestSeller: true,
      averageRating: 4.9,
      totalReviews: 45,
      specifications: {
        base_metal: "High-grade Brass",
        plating: "24K Micron Gold Plated",
        stone_type: "Faceted American Diamond & Faux Pearls",
        closure: "Push Back with Silicone Safety Stopper",
        package_contains: "1 Pair Chandbali Earrings with 1 Pair Detachable Sahara Chains",
        dimensions: "Length: 9.5 cm, Width: 5.5 cm",
        care_guide: "Avoid contact with cosmetics, hairspray, and humidity.",
      },
      images: [
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1000&auto=format&fit=crop&q=85",
      ],
      variants: [
        { sku: "JW-EAR-03-GOLD", colour: "Gold & White Pearls", size: "Free Size", price: 1499, compareAtPrice: 2499, stockQuantity: 25 },
        { sku: "JW-EAR-03-ROSE", colour: "Rose Gold", size: "Free Size", price: 1599, compareAtPrice: 2699, stockQuantity: 18 },
      ],
    },
    {
      name: "Kundan & Meenakari Openable Kada Bangles (Pair)",
      slug: "kundan-meenakari-openable-kada-bangles",
      categoryId: subKadas.id,
      brand: "Imperial Jewels",
      fabric: "Brass Alloy",
      pattern: "24K Gold Plated",
      occasion: "Festive & Wedding",
      description: "A pair of regal openable kadas with side screw lock for effortless wearing. Embellished with uncut Kundan floral motifs and intricate red meenakari inlay work.",
      isFeatured: true,
      averageRating: 4.7,
      totalReviews: 19,
      specifications: {
        base_metal: "Brass Alloy",
        plating: "24K Micro Gold Plated",
        stone_type: "Kundan & Enamel Meenakari",
        closure: "Side Screw Lock Mechanism (Fits all hand sizes comfortably)",
        package_contains: "Set of 2 Openable Kada Bangles",
        care_guide: "Store in the individual velvet pouch provided.",
      },
      images: [
        "https://images.unsplash.com/photo-1611591475836-4188c035626a?w=1000&auto=format&fit=crop&q=85",
      ],
      variants: [
        { sku: "JW-BNG-04-24", colour: "Gold & Red Meena", size: "2.4 (Small)", price: 1899, compareAtPrice: 2999, stockQuantity: 14 },
        { sku: "JW-BNG-04-26", colour: "Gold & Red Meena", size: "2.6 (Medium)", price: 1899, compareAtPrice: 2999, stockQuantity: 20 },
        { sku: "JW-BNG-04-28", colour: "Gold & Red Meena", size: "2.8 (Large)", price: 1899, compareAtPrice: 2999, stockQuantity: 12 },
      ],
    },
    {
      name: "Floral American Diamond Adjustable Cocktail Ring",
      slug: "floral-american-diamond-adjustable-cocktail-ring",
      categoryId: subCocktailRings.id,
      brand: "Imperial Jewels",
      fabric: "Stainless Steel & Silver Alloy",
      pattern: "Rhodium / Silver Plated",
      occasion: "Cocktail & Evening Gala",
      description: "A magnificent statement cocktail ring studded with brilliant-cut AAA cubic zirconia stones forming a blooming floral starburst. Features a smooth adjustable band.",
      isNewArrival: true,
      averageRating: 4.9,
      totalReviews: 32,
      specifications: {
        base_metal: "Hypoallergenic Alloy",
        plating: "High-Lustre Rhodium Polish",
        stone_type: "AAA Grade Cubic Zirconia (CZ)",
        ring_size: "Adjustable (Fits Indian Sizes 12 to 20)",
        package_contains: "1 Statement Cocktail Ring in Gift Box",
        care_guide: "Keep in a cool dry place away from moisture and soap.",
      },
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&auto=format&fit=crop&q=85",
      ],
      variants: [
        { sku: "JW-RNG-05-SLV", colour: "Silver / Rhodium", size: "Adjustable Band", price: 899, compareAtPrice: 1499, stockQuantity: 30 },
        { sku: "JW-RNG-05-ROSE", colour: "Rose Gold", size: "Adjustable Band", price: 949, compareAtPrice: 1599, stockQuantity: 22 },
      ],
    },
  ];

  for (const p of sampleJewellery) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        brand: p.brand,
        fabric: p.fabric,
        pattern: p.pattern,
        occasion: p.occasion,
        description: p.description,
        isFeatured: p.isFeatured,
        isNewArrival: p.isNewArrival,
        isBestSeller: p.isBestSeller,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        specifications: p.specifications,
      },
      create: {
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        brand: p.brand,
        fabric: p.fabric,
        pattern: p.pattern,
        occasion: p.occasion,
        description: p.description,
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isBestSeller: p.isBestSeller ?? false,
        averageRating: p.averageRating ?? 4.8,
        totalReviews: p.totalReviews ?? 10,
        specifications: p.specifications,
      },
    });

    // Create product images
    for (let i = 0; i < p.images.length; i++) {
      const imgUrl = p.images[i];
      const existing = await db.productImage.findFirst({
        where: { productId: product.id, imageUrl: imgUrl },
      });
      if (!existing) {
        await db.productImage.create({
          data: {
            productId: product.id,
            imageUrl: imgUrl,
            sortOrder: i,
            altText: `${p.name} - View ${i + 1}`,
          },
        });
      }
    }

    // Create variants
    for (const v of p.variants) {
      await db.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockQuantity: v.stockQuantity,
        },
        create: {
          productId: product.id,
          sku: v.sku,
          colour: v.colour,
          size: v.size,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockQuantity: v.stockQuantity,
        },
      });
    }
  }

  // 4. Default Hero Banner for Jewellery
  const existingBanner = await db.banner.findFirst({
    where: { position: "HERO" },
  });

  if (!existingBanner) {
    await db.banner.create({
      data: {
        title: "Royalty in Every Sparkle",
        subtitle: "Handcrafted 24K Micro-Plated Kundan, Polki Sets, Jhumkas & Bridal Splendour",
        badge: "Grand Festive Drop 2026",
        buttonText: "Explore Imperial Jewels",
        linkUrl: "/shop",
        imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=85",
        position: "HERO",
        isActive: true,
      },
    });
  }

  console.log("✅ Imperial Jewellery catalog seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  });
