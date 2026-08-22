import { getDb } from "../lib/db";
import * as dotenv from "dotenv";
dotenv.config();

async function seedZeptoJewellery() {
  const db = getDb("jewellery");
  console.log("💎 Seeding Zepto sample jewellery product to fashion-cart-jwellery DB...");

  // 1. Ensure Root & Sub Category
  const catEarrings = await db.category.upsert({
    where: { slug: "earrings-jhumkas" },
    update: {},
    create: {
      name: "Earrings & Jhumkas",
      slug: "earrings-jhumkas",
      sortOrder: 2,
      imageUrl: "https://cdn.zeptonow.com/production/ik-seo/cms/product_variant/eea9a7f1-8e4c-4217-9cbd-cb5b31960ceb/Estailo-Fashion-Women-s-Jewellery-Earrings-Gold-One-Size.jpeg",
    },
  });

  const subStuds = await db.category.upsert({
    where: { slug: "stud-earrings" },
    update: {},
    create: {
      name: "Stud Earrings",
      slug: "stud-earrings",
      parentId: catEarrings.id,
      sortOrder: 1,
    },
  });

  // 2. Upsert Product
  const product = await db.product.upsert({
    where: { slug: "estailo-fashion-womens-jewellery-earrings-gold-one-size" },
    update: {
      name: "Estailo Fashion Women's Jewellery Earrings Gold One Size",
      brand: "Estailo Fashion",
      department: "Women",
      subcategory: "Stud Earrings",
      categoryPath: "Jewellery > Earrings and Jhumkas > Stud Earrings",
      productType: "Stud Earrings",
      productUrl: "https://www.zepto.com/pn/estailo-fashion-womens-jewellery-earrings-gold-one-size-e0001453/pvid/fb367973-bac4-40f3-9118-b55c55e84d2e",
      fabric: "Alloy, Pearl",
      material: "Alloy and Pearl",
      pattern: "Gold Plated",
      fit: "One Size (Regular)",
      occasion: "Casual, Party",
      sellerName: "Commodum Groceries Private Limited",
      sellerEmail: "support@zeptonow.com",
      sellerIdentifier: "12822999000310",
      description: "Estailo Fashion Women's Jewellery Earrings Gold One Size, 1 pair. Premium pearl and crystal embellishments, elegant mermaid tail design motif, lightweight and comfortable daily wear. Product type: Stud Earrings. Material type: Alloy, Pearl. Closure type: Push Back. Colour name: Gold, White. Shape: Leaf. Gender: Women. Occasion: Casual, Party. Design type: Contemporary. Gem type: Crystal and Pearl. Plating: Gold. Metal type: Alloy. Gift: Yes. Country of origin: India.",
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: true,
      averageRating: 4.2,
      totalReviews: 1029,
      ratingCount: 1029,
      specifications: {
        product_type: "Stud Earrings",
        net_qty: "1 pair",
        material_type: "Alloy, Pearl",
        closure_type: "Push Back",
        colour_name: "Gold, White",
        shape: "Leaf / Mermaid Motif",
        key_features: "Premium pearl and crystal embellishments, elegant mermaid tail design motif, lightweight and comfortable daily wear",
        gender: "Women",
        occasion: "Casual, Party",
        design_type: "Contemporary",
        gem_type: "Crystal and Pearl",
        plating: "Gold",
        metal_type: "Alloy",
        gift: "Yes (Velvet Gift Box Included)",
        seller_name: "Commodum Groceries Private Limited",
        seller_email: "support@zeptonow.com",
        seller_address: "Fourth Floor, Unit No. 442, JMD Megapolis, Village Tikri, Tehsil Badshahpur Sohna Road, Sector 48, Gurgaon, Haryana- 122018, India.",
        seller_license_no: "12822999000310",
        manufacturer_name: "ESTFAZ FASHION PRIVATE LIMITED",
        manufacturer_address: "ESTFAZ FASHION PRIVATE LIMITED, India",
        country_of_origin: "India",
        care_guide: "Wipe with a soft cotton cloth. Keep away from water, perfumes, and chemical deodorants. Store in airtight velvet box.",
      },
    },
    create: {
      productId: "63dd0078-d413-4c6c-a7c2-c11db2575088",
      name: "Estailo Fashion Women's Jewellery Earrings Gold One Size",
      slug: "estailo-fashion-womens-jewellery-earrings-gold-one-size",
      categoryId: subStuds.id,
      brand: "Estailo Fashion",
      department: "Women",
      subcategory: "Stud Earrings",
      categoryPath: "Jewellery > Earrings and Jhumkas > Stud Earrings",
      productType: "Stud Earrings",
      productUrl: "https://www.zepto.com/pn/estailo-fashion-womens-jewellery-earrings-gold-one-size-e0001453/pvid/fb367973-bac4-40f3-9118-b55c55e84d2e",
      fabric: "Alloy, Pearl",
      material: "Alloy and Pearl",
      pattern: "Gold Plated",
      fit: "One Size (Regular)",
      occasion: "Casual, Party",
      sellerName: "Commodum Groceries Private Limited",
      sellerEmail: "support@zeptonow.com",
      sellerIdentifier: "12822999000310",
      description: "Estailo Fashion Women's Jewellery Earrings Gold One Size, 1 pair. Premium pearl and crystal embellishments, elegant mermaid tail design motif, lightweight and comfortable daily wear. Product type: Stud Earrings. Material type: Alloy, Pearl. Closure type: Push Back. Colour name: Gold, White. Shape: Leaf. Gender: Women. Occasion: Casual, Party. Design type: Contemporary. Gem type: Crystal and Pearl. Plating: Gold. Metal type: Alloy. Gift: Yes. Country of origin: India.",
      status: "ACTIVE",
      isFeatured: true,
      isBestSeller: true,
      averageRating: 4.2,
      totalReviews: 1029,
      ratingCount: 1029,
      specifications: {
        product_type: "Stud Earrings",
        net_qty: "1 pair",
        material_type: "Alloy, Pearl",
        closure_type: "Push Back",
        colour_name: "Gold, White",
        shape: "Leaf / Mermaid Motif",
        key_features: "Premium pearl and crystal embellishments, elegant mermaid tail design motif, lightweight and comfortable daily wear",
        gender: "Women",
        occasion: "Casual, Party",
        design_type: "Contemporary",
        gem_type: "Crystal and Pearl",
        plating: "Gold",
        metal_type: "Alloy",
        gift: "Yes (Velvet Gift Box Included)",
        seller_name: "Commodum Groceries Private Limited",
        seller_email: "support@zeptonow.com",
        seller_address: "Fourth Floor, Unit No. 442, JMD Megapolis, Village Tikri, Tehsil Badshahpur Sohna Road, Sector 48, Gurgaon, Haryana- 122018, India.",
        seller_license_no: "12822999000310",
        manufacturer_name: "ESTFAZ FASHION PRIVATE LIMITED",
        manufacturer_address: "ESTFAZ FASHION PRIVATE LIMITED, India",
        country_of_origin: "India",
        care_guide: "Wipe with a soft cotton cloth. Keep away from water, perfumes, and chemical deodorants. Store in airtight velvet box.",
      },
    },
  });

  // 3. Upsert Images
  const imageUrls = [
    "https://cdn.zeptonow.com/production/ik-seo/cms/product_variant/eea9a7f1-8e4c-4217-9cbd-cb5b31960ceb/Estailo-Fashion-Women-s-Jewellery-Earrings-Gold-One-Size.jpeg",
    "https://cdn.zeptonow.com/production/ik-seo/cms/product_variant/24ff15d7-7d8f-4aaf-a313-0722184a6cb3/Estailo-Fashion-Women-s-Jewellery-Earrings-Gold-One-Size.jpeg",
    "https://cdn.zeptonow.com/production/ik-seo/cms/product_variant/ace13090-cd39-44d2-8b4a-4fde91e6f84e/Estailo-Fashion-Women-s-Jewellery-Earrings-Gold-One-Size.jpeg",
    "https://cdn.zeptonow.com/production/ik-seo/cms/product_variant/71436b35-759c-4d05-8c87-9e29ff442ebb/Estailo-Fashion-Women-s-Jewellery-Earrings-Gold-One-Size.jpeg",
    "https://cdn.zeptonow.com/production/ik-seo/cms/product_variant/09aee1bf-b49a-4a02-afb5-ff261eee41d3/Estailo-Fashion-Women-s-Jewellery-Earrings-Gold-One-Size.jpeg",
  ];

  await db.productImage.deleteMany({ where: { productId: product.id } });
  for (let i = 0; i < imageUrls.length; i++) {
    await db.productImage.create({
      data: {
        productId: product.id,
        imageUrl: imageUrls[i],
        sortOrder: i,
      },
    });
  }

  // 4. Upsert Variant
  await db.productVariant.upsert({
    where: { sku: "fb367973-bac4-40f3-9118-b55c55e84d2e" },
    update: {
      productId: product.id,
      colour: "Gold, White",
      size: "One Size",
      price: 139,
      compareAtPrice: 399,
      discountPercent: 65,
      stockQuantity: 50,
      isActive: true,
    },
    create: {
      productId: product.id,
      sku: "fb367973-bac4-40f3-9118-b55c55e84d2e",
      colour: "Gold, White",
      size: "One Size",
      price: 139,
      compareAtPrice: 399,
      discountPercent: 65,
      stockQuantity: 50,
      isActive: true,
    },
  });

  console.log("✅ Successfully seeded Zepto Jewellery product:", product.name);
}

seedZeptoJewellery()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
