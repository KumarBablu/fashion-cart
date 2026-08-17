import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPremiumCatalog() {
  console.log("👗 Starting Premium Fashion Catalog Seed (40+ Luxury Garments)...");

  // 1. Ensure Main Category Pillars and Subcategories exist
  // ---- 1. Women's Ethnic & Couture ----
  const catWomen = await prisma.category.upsert({
    where: { slug: "women" },
    update: { name: "Women's Ethnic & Couture", sortOrder: 1 },
    create: { name: "Women's Ethnic & Couture", slug: "women", sortOrder: 1 },
  });

  const catWomenKurtis = await prisma.category.upsert({
    where: { slug: "women-kurtis" },
    update: { name: "Velvet & Silk Kurti Sets", parentId: catWomen.id, sortOrder: 1 },
    create: { name: "Velvet & Silk Kurti Sets", slug: "women-kurtis", parentId: catWomen.id, sortOrder: 1 },
  });

  const catWomenSarees = await prisma.category.upsert({
    where: { slug: "women-sarees" },
    update: { name: "Mulberry Silk Sarees", parentId: catWomen.id, sortOrder: 2 },
    create: { name: "Mulberry Silk Sarees", slug: "women-sarees", parentId: catWomen.id, sortOrder: 2 },
  });

  const catWomenDresses = await prisma.category.upsert({
    where: { slug: "women-dresses" },
    update: { name: "Anarkali & Gala Gowns", parentId: catWomen.id, sortOrder: 3 },
    create: { name: "Anarkali & Gala Gowns", slug: "women-dresses", parentId: catWomen.id, sortOrder: 3 },
  });

  // ---- 2. Men's Apparel & Tailoring ----
  const catMen = await prisma.category.upsert({
    where: { slug: "men" },
    update: { name: "Men's Apparel & Tailoring", sortOrder: 2 },
    create: { name: "Men's Apparel & Tailoring", slug: "men", sortOrder: 2 },
  });

  const catMenShirts = await prisma.category.upsert({
    where: { slug: "men-shirts" },
    update: { name: "Pure French Linen Shirts", parentId: catMen.id, sortOrder: 1 },
    create: { name: "Pure French Linen Shirts", slug: "men-shirts", parentId: catMen.id, sortOrder: 1 },
  });

  const catMenMandarin = await prisma.category.upsert({
    where: { slug: "men-mandarin" },
    update: { name: "Mandarin Collar Shirts", parentId: catMen.id, sortOrder: 2 },
    create: { name: "Mandarin Collar Shirts", slug: "men-mandarin", parentId: catMen.id, sortOrder: 2 },
  });

  const catMenJeans = await prisma.category.upsert({
    where: { slug: "men-jeans" },
    update: { name: "Stretch Denim & Chinos", parentId: catMen.id, sortOrder: 3 },
    create: { name: "Stretch Denim & Chinos", slug: "men-jeans", parentId: catMen.id, sortOrder: 3 },
  });

  // ---- 3. Western & Contemporary ----
  const catWestern = await prisma.category.upsert({
    where: { slug: "western" },
    update: { name: "Western & Contemporary", sortOrder: 3 },
    create: { name: "Western & Contemporary", slug: "western", sortOrder: 3 },
  });

  const catWesternCocktail = await prisma.category.upsert({
    where: { slug: "western-cocktail" },
    update: { name: "Cocktail & Midi Dresses", parentId: catWestern.id, sortOrder: 1 },
    create: { name: "Cocktail & Midi Dresses", slug: "western-cocktail", parentId: catWestern.id, sortOrder: 1 },
  });

  const catWesternTops = await prisma.category.upsert({
    where: { slug: "western-tops" },
    update: { name: "Party Wear & Silk Tops", parentId: catWestern.id, sortOrder: 2 },
    create: { name: "Party Wear & Silk Tops", slug: "western-tops", parentId: catWestern.id, sortOrder: 2 },
  });

  // ---- 4. Kids & Special Edits ----
  const catKids = await prisma.category.upsert({
    where: { slug: "kids" },
    update: { name: "Kids & Special Edits", sortOrder: 4 },
    create: { name: "Kids & Special Edits", slug: "kids", sortOrder: 4 },
  });

  const catKidsWear = await prisma.category.upsert({
    where: { slug: "kids-wear" },
    update: { name: "Junior Festive & Ethnic Wear", parentId: catKids.id, sortOrder: 1 },
    create: { name: "Junior Festive & Ethnic Wear", slug: "kids-wear", parentId: catKids.id, sortOrder: 1 },
  });

  const catKidsCotton = await prisma.category.upsert({
    where: { slug: "kids-cotton" },
    update: { name: "Everyday Combed Cotton Sets", parentId: catKids.id, sortOrder: 2 },
    create: { name: "Everyday Combed Cotton Sets", slug: "kids-cotton", parentId: catKids.id, sortOrder: 2 },
  });

  // Data structure for the 40+ products (10 per main category)
  const CATALOG_PRODUCTS = [
    // ========================================================
    // CATEGORY 1: WOMEN'S ETHNIC & COUTURE (10 Products)
    // ========================================================
    {
      name: "Royal Zardozi Micro-Velvet Kurta Set with Organza Dupatta",
      slug: "royal-zardozi-micro-velvet-kurta-set",
      categoryId: catWomenKurtis.id,
      brand: "Fashion Cart Atelier",
      fabric: "Silk Micro-Velvet & Pure Organza",
      description: "Artisanal hand-embroidered micro-velvet straight kurta set accented with real metallic gold zardozi and sequin work. Paired with matching tailored cigarette trousers and a sheer scalloped organza dupatta.",
      isFeatured: true,
      isBestSeller: true,
      averageRating: 4.95,
      totalReviews: 128,
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Wine Maroon", size: "S", price: 2899, compareAtPrice: 4499, stock: 12 },
        { colour: "Wine Maroon", size: "M", price: 2899, compareAtPrice: 4499, stock: 20 },
        { colour: "Wine Maroon", size: "L", price: 2899, compareAtPrice: 4499, stock: 15 },
        { colour: "Wine Maroon", size: "XL", price: 2899, compareAtPrice: 4499, stock: 8 },
        { colour: "Emerald Green", size: "M", price: 2899, compareAtPrice: 4499, stock: 18 },
        { colour: "Emerald Green", size: "L", price: 2899, compareAtPrice: 4499, stock: 14 },
      ],
    },
    {
      name: "Banarasi Pure Kanjeevaram Mulberry Silk Saree with Zari Pallu",
      slug: "banarasi-pure-kanjeevaram-mulberry-silk-saree",
      categoryId: catWomenSarees.id,
      brand: "Varanasi Heritage Loom",
      fabric: "100% Certified Mulberry Silk",
      description: "Heirloom grade Banarasi Kanjeevaram silk saree woven on traditional pit looms with floral floral jaal motifs and an opulent gold brocade pallu. Comes with an unstitched brocade blouse piece.",
      isFeatured: true,
      isNewArrival: true,
      averageRating: 4.98,
      totalReviews: 94,
      imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Royal Crimson Red", size: "Free Size", price: 3499, compareAtPrice: 5999, stock: 10 },
        { colour: "Mustard Gold", size: "Free Size", price: 3499, compareAtPrice: 5999, stock: 8 },
        { colour: "Peacock Blue", size: "Free Size", price: 3499, compareAtPrice: 5999, stock: 6 },
      ],
    },
    {
      name: "Hand-Embroidered Chanderi Silk Flared Anarkali Gown",
      slug: "hand-embroidered-chanderi-silk-anarkali-gown",
      categoryId: catWomenDresses.id,
      brand: "Fashion Cart Atelier",
      fabric: "Pure Chanderi Silk with Santoon Lining",
      description: "Magnificent 32-kali flared Chanderi silk Anarkali gown enriched with intricate gota patti neckline embroidery, handcrafted tassels, and a lightweight zari border dupatta.",
      isBestSeller: true,
      averageRating: 4.9,
      totalReviews: 82,
      imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Blush Rose", size: "S", price: 2499, compareAtPrice: 3999, stock: 14 },
        { colour: "Blush Rose", size: "M", price: 2499, compareAtPrice: 3999, stock: 22 },
        { colour: "Blush Rose", size: "L", price: 2499, compareAtPrice: 3999, stock: 16 },
        { colour: "Ivory Cream", size: "M", price: 2499, compareAtPrice: 3999, stock: 12 },
      ],
    },
    {
      name: "Festive Embroidered Silk Peplum Kurti & Sharara Set",
      slug: "festive-embroidered-silk-peplum-sharara-set",
      categoryId: catWomenKurtis.id,
      brand: "Fashion Cart Royal",
      fabric: "Art Silk & Georgette",
      description: "Contemporary festive sharara suit featuring an architectural peplum short kurti adorned with mirror work and a voluminous tiered flared sharara with gold lace trims.",
      isNewArrival: true,
      averageRating: 4.85,
      totalReviews: 46,
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Turquoise Blue", size: "S", price: 2199, compareAtPrice: 3499, stock: 10 },
        { colour: "Turquoise Blue", size: "M", price: 2199, compareAtPrice: 3499, stock: 18 },
        { colour: "Turquoise Blue", size: "L", price: 2199, compareAtPrice: 3499, stock: 12 },
        { colour: "Marigold Yellow", size: "M", price: 2199, compareAtPrice: 3499, stock: 15 },
      ],
    },
    {
      name: "Tussar Silk Hand-Block Printed Saree with Tassels",
      slug: "tussar-silk-hand-block-printed-saree",
      categoryId: catWomenSarees.id,
      brand: "Jaipur Loom Heritage",
      fabric: "Organic Tussar Silk",
      description: "Handcrafted Tussar silk saree featuring authentic Bagru hand-block botanical prints, natural vegetable dyes, and artisanal fringe tassels on the pallu.",
      averageRating: 4.88,
      totalReviews: 38,
      imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Beige & Indigo", size: "Free Size", price: 1899, compareAtPrice: 2999, stock: 16 },
        { colour: "Earthy Terracotta", size: "Free Size", price: 1899, compareAtPrice: 2999, stock: 12 },
      ],
    },
    {
      name: "Georgette Chikankari Embroidered Straight Kurta Set",
      slug: "georgette-chikankari-embroidered-straight-kurta-set",
      categoryId: catWomenKurtis.id,
      brand: "Lucknow Crafts",
      fabric: "Faux Georgette with Cotton Inner",
      description: "Classic Lucknowi shadow-work Chikankari embroidery handcrafted with delicate pearl embellishments over a soft, flowing straight silhouette. Includes matching palazzo pants.",
      averageRating: 4.92,
      totalReviews: 64,
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Pastel Lavender", size: "S", price: 1699, compareAtPrice: 2799, stock: 15 },
        { colour: "Pastel Lavender", size: "M", price: 1699, compareAtPrice: 2799, stock: 25 },
        { colour: "Pastel Lavender", size: "L", price: 1699, compareAtPrice: 2799, stock: 18 },
        { colour: "Pistachio Mint", size: "M", price: 1699, compareAtPrice: 2799, stock: 20 },
      ],
    },
    {
      name: "Royal Velvet Embroidered Floor-Length Indo-Western Gown",
      slug: "royal-velvet-embroidered-floor-length-gown",
      categoryId: catWomenDresses.id,
      brand: "Fashion Cart Atelier",
      fabric: "Plush Velvet with Satin Lining",
      description: "Sophisticated gala gown crafted from plush micro-velvet featuring an asymmetrical neckline, gold thread baroque embroidery, and a structured mermaid flared hem.",
      isFeatured: true,
      averageRating: 4.96,
      totalReviews: 52,
      imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Midnight Black", size: "S", price: 3199, compareAtPrice: 5299, stock: 8 },
        { colour: "Midnight Black", size: "M", price: 3199, compareAtPrice: 5299, stock: 14 },
        { colour: "Midnight Black", size: "L", price: 3199, compareAtPrice: 5299, stock: 10 },
        { colour: "Royal Plum", size: "M", price: 3199, compareAtPrice: 5299, stock: 9 },
      ],
    },
    {
      name: "Zari Woven Organza Silk Saree with Scalloped Border",
      slug: "zari-woven-organza-silk-saree-scalloped",
      categoryId: catWomenSarees.id,
      brand: "Fashion Cart Royal",
      fabric: "Glass Organza Silk",
      description: "Featherlight tissue organza silk saree designed with floral resham embroidery and delicate gold zari scalloped borders. Perfect for day weddings and festive celebrations.",
      averageRating: 4.87,
      totalReviews: 41,
      imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Champagne Peach", size: "Free Size", price: 2299, compareAtPrice: 3899, stock: 14 },
        { colour: "Sage Green", size: "Free Size", price: 2299, compareAtPrice: 3899, stock: 11 },
      ],
    },
    {
      name: "Bandhani Silk Festive Kurta with Foil Print Trousers",
      slug: "bandhani-silk-festive-kurta-with-trousers",
      categoryId: catWomenKurtis.id,
      brand: "Gujarat Artisanal",
      fabric: "Pure Silk Blend",
      description: "Vibrant traditional Bandhej tie-dye printed straight kurta accented with a Mandarin neckline, gold sequin detailing, and comfortable cigarette trousers.",
      averageRating: 4.84,
      totalReviews: 33,
      imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Ruby Red", size: "S", price: 1499, compareAtPrice: 2499, stock: 18 },
        { colour: "Ruby Red", size: "M", price: 1499, compareAtPrice: 2499, stock: 24 },
        { colour: "Ruby Red", size: "L", price: 1499, compareAtPrice: 2499, stock: 15 },
      ],
    },
    {
      name: "Handcrafted Zari Border Silk Festive Kaftan Set",
      slug: "handcrafted-zari-border-silk-festive-kaftan-set",
      categoryId: catWomenDresses.id,
      brand: "Fashion Cart Modern",
      fabric: "Crushed Silk Blend",
      description: "Relaxed luxury kaftan dress woven from shimmer silk blend featuring an adjustable drawstring waist, gold lace trims, and matching straight trousers.",
      isNewArrival: true,
      averageRating: 4.89,
      totalReviews: 29,
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Royal Teal", size: "M", price: 1799, compareAtPrice: 2999, stock: 16 },
        { colour: "Royal Teal", size: "L", price: 1799, compareAtPrice: 2999, stock: 20 },
        { colour: "Deep Bronze", size: "M", price: 1799, compareAtPrice: 2999, stock: 14 },
      ],
    },

    // ========================================================
    // CATEGORY 2: MEN'S APPAREL & TAILORING (10 Products)
    // ========================================================
    {
      name: "100% Pure French Linen Relaxed Fit Shirt",
      slug: "100-percent-pure-french-linen-relaxed-shirt",
      categoryId: catMenShirts.id,
      brand: "Atelier Sartorial",
      fabric: "100% Certified French Flax Linen",
      description: "Mastercrafted from breathable European flax linen. Naturally thermoregulating, soft enzyme washed for skin comfort, with genuine mother-of-pearl buttons and a classic spread collar.",
      isFeatured: true,
      isBestSeller: true,
      averageRating: 4.96,
      totalReviews: 142,
      imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Natural Sandstone", size: "S", price: 1499, compareAtPrice: 2499, stock: 14 },
        { colour: "Natural Sandstone", size: "M", price: 1499, compareAtPrice: 2499, stock: 28 },
        { colour: "Natural Sandstone", size: "L", price: 1499, compareAtPrice: 2499, stock: 22 },
        { colour: "Natural Sandstone", size: "XL", price: 1499, compareAtPrice: 2499, stock: 10 },
        { colour: "Crisp White", size: "M", price: 1499, compareAtPrice: 2499, stock: 25 },
        { colour: "Crisp White", size: "L", price: 1499, compareAtPrice: 2499, stock: 20 },
      ],
    },
    {
      name: "Sartorial Mandarin Collar Pure Linen Kurta Shirt",
      slug: "sartorial-mandarin-collar-pure-linen-kurta-shirt",
      categoryId: catMenMandarin.id,
      brand: "Fashion Cart Bespoke",
      fabric: "Pure Organic Linen",
      description: "Refined Mandarin collar short kurta shirt tailored with clean curved hem, reinforced placket, and concealed wooden buttons. Perfect for semi-formal celebrations and weekend brunches.",
      isNewArrival: true,
      averageRating: 4.91,
      totalReviews: 78,
      imageUrl: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Olive Green", size: "M", price: 1299, compareAtPrice: 2199, stock: 20 },
        { colour: "Olive Green", size: "L", price: 1299, compareAtPrice: 2199, stock: 18 },
        { colour: "Olive Green", size: "XL", price: 1299, compareAtPrice: 2199, stock: 12 },
        { colour: "Midnight Navy", size: "M", price: 1299, compareAtPrice: 2199, stock: 22 },
        { colour: "Midnight Navy", size: "L", price: 1299, compareAtPrice: 2199, stock: 15 },
      ],
    },
    {
      name: "Premium Comfort-Flex Indigo Stretch Denim Jeans",
      slug: "premium-comfort-flex-indigo-stretch-denim-jeans",
      categoryId: catMenJeans.id,
      brand: "Fashion Cart Denim Lab",
      fabric: "98% Combed Cotton, 2% Spandex",
      description: "Tailored slim-tapered jeans crafted from ring-spun denim with 4-way stretch flex technology. Hand-whiskered vintage wash that retains shape all day.",
      isBestSeller: true,
      averageRating: 4.88,
      totalReviews: 110,
      imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Dark Indigo", size: "30", price: 1699, compareAtPrice: 2799, stock: 16 },
        { colour: "Dark Indigo", size: "32", price: 1699, compareAtPrice: 2799, stock: 24 },
        { colour: "Dark Indigo", size: "34", price: 1699, compareAtPrice: 2799, stock: 20 },
        { colour: "Dark Indigo", size: "36", price: 1699, compareAtPrice: 2799, stock: 12 },
      ],
    },
    {
      name: "Italian Fit Breathable Cotton Stretch Chino Trousers",
      slug: "italian-fit-breathable-cotton-stretch-chino-trousers",
      categoryId: catMenJeans.id,
      brand: "Atelier Sartorial",
      fabric: "Fine Twill Combed Cotton",
      description: "Architectural slim-fit chinos constructed from fine twill combed cotton with subtle stretch. Features angled slash pockets, horn-effect buttons, and anti-slip waistband grip.",
      averageRating: 4.89,
      totalReviews: 65,
      imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Khaki Beige", size: "30", price: 1399, compareAtPrice: 2299, stock: 14 },
        { colour: "Khaki Beige", size: "32", price: 1399, compareAtPrice: 2299, stock: 22 },
        { colour: "Khaki Beige", size: "34", price: 1399, compareAtPrice: 2299, stock: 18 },
        { colour: "Carbon Charcoal", size: "32", price: 1399, compareAtPrice: 2299, stock: 16 },
      ],
    },
    {
      name: "Egyptian Giza Cotton Formal Luxury Shirt",
      slug: "egyptian-giza-cotton-formal-luxury-shirt",
      categoryId: catMenShirts.id,
      brand: "Fashion Cart Bespoke",
      fabric: "100% Giza Long-Staple Cotton",
      description: "Woven from 2-ply long staple Egyptian cotton with silk-like sheen and high wrinkle resistance. Finished with French cuffs and precision semi-cutaway collar.",
      isFeatured: true,
      averageRating: 4.94,
      totalReviews: 87,
      imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Sky Blue", size: "M", price: 1599, compareAtPrice: 2699, stock: 20 },
        { colour: "Sky Blue", size: "L", price: 1599, compareAtPrice: 2699, stock: 18 },
        { colour: "Sky Blue", size: "XL", price: 1599, compareAtPrice: 2699, stock: 12 },
        { colour: "Pure White", size: "M", price: 1599, compareAtPrice: 2699, stock: 25 },
      ],
    },
    {
      name: "Raw Silk Blend Bandhgala Nehru Jacket",
      slug: "raw-silk-blend-bandhgala-nehru-jacket",
      categoryId: catMenMandarin.id,
      brand: "Fashion Cart Royal",
      fabric: "Matka Raw Silk Blend",
      description: "Structured Nehru sleeveless jacket tailored from textured Matka raw silk with antique brass buttons, dual chest welt pockets, and a Mandarin collar.",
      isBestSeller: true,
      averageRating: 4.93,
      totalReviews: 58,
      imageUrl: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Royal Navy", size: "M", price: 1999, compareAtPrice: 3499, stock: 15 },
        { colour: "Royal Navy", size: "L", price: 1999, compareAtPrice: 3499, stock: 18 },
        { colour: "Royal Navy", size: "XL", price: 1999, compareAtPrice: 3499, stock: 10 },
        { colour: "Ivory Cream", size: "M", price: 1999, compareAtPrice: 3499, stock: 12 },
      ],
    },
    {
      name: "Textured Seersucker Casual Summer Button-Down Shirt",
      slug: "textured-seersucker-casual-summer-shirt",
      categoryId: catMenShirts.id,
      brand: "Atelier Sartorial",
      fabric: "100% Breathable Seersucker Cotton",
      description: "Puckered seersucker weave that naturally sits away from the skin, encouraging cooling airflow on humid summer afternoons. Modern casual curved hem.",
      averageRating: 4.86,
      totalReviews: 39,
      imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Nautical Navy Stripe", size: "M", price: 1199, compareAtPrice: 1999, stock: 18 },
        { colour: "Nautical Navy Stripe", size: "L", price: 1199, compareAtPrice: 1999, stock: 15 },
        { colour: "Sage Green Stripe", size: "M", price: 1199, compareAtPrice: 1999, stock: 14 },
      ],
    },
    {
      name: "Vintage Stone Wash Regular Straight Fit Jeans",
      slug: "vintage-stone-wash-regular-straight-jeans",
      categoryId: catMenJeans.id,
      brand: "Fashion Cart Denim Lab",
      fabric: "100% Durable Rigid Denim",
      description: "Authentic heritage straight leg jeans in a classic stone-washed light blue hue. Built with heavy-duty 13.5 oz denim and copper rivet reinforcements.",
      averageRating: 4.82,
      totalReviews: 44,
      imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Light Stone Blue", size: "30", price: 1499, compareAtPrice: 2499, stock: 12 },
        { colour: "Light Stone Blue", size: "32", price: 1499, compareAtPrice: 2499, stock: 20 },
        { colour: "Light Stone Blue", size: "34", price: 1499, compareAtPrice: 2499, stock: 16 },
      ],
    },
    {
      name: "Printed Cuban Camp Collar Resort Shirt",
      slug: "printed-cuban-camp-collar-resort-shirt",
      categoryId: catMenShirts.id,
      brand: "Fashion Cart Modern",
      fabric: "Silk-Modal Blend",
      description: "Retro Cuban collar holiday shirt with relaxed boxy silhouette and artistic hand-painted botanical prints. Silky smooth and ultra-breathable.",
      isNewArrival: true,
      averageRating: 4.87,
      totalReviews: 31,
      imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Tropical Palm Green", size: "M", price: 999, compareAtPrice: 1699, stock: 20 },
        { colour: "Tropical Palm Green", size: "L", price: 999, compareAtPrice: 1699, stock: 16 },
        { colour: "Amber Floral", size: "M", price: 999, compareAtPrice: 1699, stock: 18 },
      ],
    },
    {
      name: "Classic Supima Cotton Everyday Crew Neck Tee",
      slug: "classic-supima-cotton-everyday-crew-neck-tee",
      categoryId: catMenShirts.id,
      brand: "Fashion Cart Basics",
      fabric: "100% American Supima Cotton",
      description: "Luxuriously soft crew-neck t-shirt made with extra-long staple Supima cotton. Retains deep color vibrancy and zero-pilling wash after wash.",
      averageRating: 4.9,
      totalReviews: 76,
      imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Jet Black", size: "M", price: 799, compareAtPrice: 1299, stock: 30 },
        { colour: "Jet Black", size: "L", price: 799, compareAtPrice: 1299, stock: 25 },
        { colour: "Heather Grey", size: "M", price: 799, compareAtPrice: 1299, stock: 22 },
      ],
    },

    // ========================================================
    // CATEGORY 3: WESTERN & CONTEMPORARY (10 Products)
    // ========================================================
    {
      name: "Satin Silk Cocktail Wrap Midi Dress with Belt",
      slug: "satin-silk-cocktail-wrap-midi-dress",
      categoryId: catWesternCocktail.id,
      brand: "Fashion Cart Contemporary",
      fabric: "Heavyweight Liquid Satin Silk",
      description: "Showstopping wrap midi dress featuring a fluid drape, surplice V-neckline, self-tie waist sash, and bishop sleeves with buttoned cuffs.",
      isFeatured: true,
      isBestSeller: true,
      averageRating: 4.94,
      totalReviews: 95,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Emerald Silk", size: "S", price: 2199, compareAtPrice: 3699, stock: 12 },
        { colour: "Emerald Silk", size: "M", price: 2199, compareAtPrice: 3699, stock: 20 },
        { colour: "Emerald Silk", size: "L", price: 2199, compareAtPrice: 3699, stock: 14 },
        { colour: "Champagne Gold", size: "M", price: 2199, compareAtPrice: 3699, stock: 16 },
      ],
    },
    {
      name: "Pleated Tiered Floral Chiffon Summer Maxi Dress",
      slug: "pleated-tiered-floral-chiffon-summer-maxi-dress",
      categoryId: catWesternCocktail.id,
      brand: "Fashion Cart Contemporary",
      fabric: "Lightweight Silk Chiffon",
      description: "Airy, romantic tiered maxi dress tailored from fine silk chiffon with hand-rendered botanical motifs, smocked bodice, and a fluid flounce hem.",
      isNewArrival: true,
      averageRating: 4.91,
      totalReviews: 63,
      imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Pastel Meadow", size: "S", price: 1899, compareAtPrice: 3199, stock: 14 },
        { colour: "Pastel Meadow", size: "M", price: 1899, compareAtPrice: 3199, stock: 22 },
        { colour: "Pastel Meadow", size: "L", price: 1899, compareAtPrice: 3199, stock: 15 },
      ],
    },
    {
      name: "Tailored Double-Breasted Linen Blazer with Horn Buttons",
      slug: "tailored-double-breasted-linen-blazer",
      categoryId: catWesternTops.id,
      brand: "Atelier Sartorial",
      fabric: "Pure French Flax Linen",
      description: "Structured yet breathable double-breasted blazer cut with peak lapels, horn buttons, and subtle shoulder padding for an architectural power silhouette.",
      isFeatured: true,
      averageRating: 4.97,
      totalReviews: 81,
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Oatmeal Beige", size: "S", price: 2799, compareAtPrice: 4599, stock: 10 },
        { colour: "Oatmeal Beige", size: "M", price: 2799, compareAtPrice: 4599, stock: 16 },
        { colour: "Oatmeal Beige", size: "L", price: 2799, compareAtPrice: 4599, stock: 12 },
        { colour: "Classic Noir", size: "M", price: 2799, compareAtPrice: 4599, stock: 14 },
      ],
    },
    {
      name: "Silk Georgette Draped Cowl Neck Evening Top",
      slug: "silk-georgette-draped-cowl-neck-evening-top",
      categoryId: catWesternTops.id,
      brand: "Fashion Cart Contemporary",
      fabric: "Pure Silk Georgette",
      description: "Minimalist luxury sleeveless top featuring an effortless cowl drape, adjustable satin straps, and delicate bias-cut hem.",
      averageRating: 4.88,
      totalReviews: 47,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Pearl Ivory", size: "S", price: 1199, compareAtPrice: 1999, stock: 18 },
        { colour: "Pearl Ivory", size: "M", price: 1199, compareAtPrice: 1999, stock: 24 },
        { colour: "Midnight Plum", size: "M", price: 1199, compareAtPrice: 1999, stock: 15 },
      ],
    },
    {
      name: "Ribbed Knit Bodycon Midi Dress with Side Slit",
      slug: "ribbed-knit-bodycon-midi-dress-side-slit",
      categoryId: catWesternCocktail.id,
      brand: "Fashion Cart Modern",
      fabric: "Viscose-Nylon Premium Ribbed Knit",
      description: "Figure-flattering ribbed knit dress designed with a square neckline, subtle side leg slit, and thick compression knit fabric that hugs curves comfortably.",
      averageRating: 4.85,
      totalReviews: 54,
      imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Mocha Brown", size: "S", price: 1399, compareAtPrice: 2299, stock: 15 },
        { colour: "Mocha Brown", size: "M", price: 1399, compareAtPrice: 2299, stock: 22 },
        { colour: "Mocha Brown", size: "L", price: 1399, compareAtPrice: 2299, stock: 16 },
      ],
    },
    {
      name: "High-Waisted Wide Leg Pleated Trousers",
      slug: "high-waisted-wide-leg-pleated-trousers",
      categoryId: catWesternTops.id,
      brand: "Fashion Cart Contemporary",
      fabric: "Polyester-Viscose Drape Twill",
      description: "Sophisticated palazzo trousers featuring front pleats, high-rise fitted waistband, belt loops, and an elongated wide-leg profile.",
      isBestSeller: true,
      averageRating: 4.92,
      totalReviews: 73,
      imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Slate Charcoal", size: "S", price: 1499, compareAtPrice: 2499, stock: 16 },
        { colour: "Slate Charcoal", size: "M", price: 1499, compareAtPrice: 2499, stock: 25 },
        { colour: "Slate Charcoal", size: "L", price: 1499, compareAtPrice: 2499, stock: 18 },
        { colour: "Camel Beige", size: "M", price: 1499, compareAtPrice: 2499, stock: 20 },
      ],
    },
    {
      name: "Lace Insert Puff-Sleeve Poplin Shirt",
      slug: "lace-insert-puff-sleeve-poplin-shirt",
      categoryId: catWesternTops.id,
      brand: "Fashion Cart Contemporary",
      fabric: "100% Crisp Cotton Poplin",
      description: "Architectural blouse cut with dramatic puff sleeves, crochet lace insets, and high stand collar with pearl button accents.",
      averageRating: 4.87,
      totalReviews: 36,
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Optical White", size: "S", price: 1299, compareAtPrice: 2199, stock: 14 },
        { colour: "Optical White", size: "M", price: 1299, compareAtPrice: 2199, stock: 18 },
        { colour: "Optical White", size: "L", price: 1299, compareAtPrice: 2199, stock: 12 },
      ],
    },
    {
      name: "Belted Trench Style Cotton Shirt Dress",
      slug: "belted-trench-style-cotton-shirt-dress",
      categoryId: catWesternCocktail.id,
      brand: "Atelier Sartorial",
      fabric: "Heavy Cotton Twill",
      description: "Utility-inspired shirt dress featuring notch lapels, removable D-ring fabric belt, rolled cuff sleeves, and tortoiseshell button fastening.",
      averageRating: 4.9,
      totalReviews: 48,
      imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Warm Khaki", size: "S", price: 1799, compareAtPrice: 2999, stock: 12 },
        { colour: "Warm Khaki", size: "M", price: 1799, compareAtPrice: 2999, stock: 19 },
        { colour: "Warm Khaki", size: "L", price: 1799, compareAtPrice: 2999, stock: 14 },
      ],
    },
    {
      name: "Sequin Embroidered Mesh Party Top",
      slug: "sequin-embroidered-mesh-party-top",
      categoryId: catWesternTops.id,
      brand: "Fashion Cart Modern",
      fabric: "Stretch Mesh with Glass Sequins",
      description: "Shimmering party top detailed with micro glass sequins on a stretchy breathable mesh lining. Round neckline and keyhole back closure.",
      isNewArrival: true,
      averageRating: 4.83,
      totalReviews: 28,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Rose Gold Shimmer", size: "S", price: 1099, compareAtPrice: 1799, stock: 15 },
        { colour: "Rose Gold Shimmer", size: "M", price: 1099, compareAtPrice: 1799, stock: 20 },
        { colour: "Rose Gold Shimmer", size: "L", price: 1099, compareAtPrice: 1799, stock: 14 },
      ],
    },
    {
      name: "Linen-Blend Notch Collar Co-ord Shorts Set",
      slug: "linen-blend-notch-collar-coord-shorts-set",
      categoryId: catWesternCocktail.id,
      brand: "Fashion Cart Basics",
      fabric: "55% Linen, 45% Cotton",
      description: "Coordinated resort two-piece set featuring a relaxed short-sleeve button-down shirt and matching high-waisted elasticated tailored shorts.",
      averageRating: 4.89,
      totalReviews: 42,
      imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Sage Mint", size: "S", price: 1599, compareAtPrice: 2599, stock: 16 },
        { colour: "Sage Mint", size: "M", price: 1599, compareAtPrice: 2599, stock: 22 },
        { colour: "Sage Mint", size: "L", price: 1599, compareAtPrice: 2599, stock: 15 },
      ],
    },

    // ========================================================
    // CATEGORY 4: KIDS & SPECIAL EDITS (10 Products)
    // ========================================================
    {
      name: "Junior Zari Brocade Silk Kurta Pyjama & Jacket Set (Boys)",
      slug: "junior-zari-brocade-silk-kurta-pyjama-jacket-set",
      categoryId: catKidsWear.id,
      brand: "Fashion Cart Juniors",
      fabric: "Pure Silk Blend with Cotton Lining",
      description: "Regal 3-piece festive ethnic set for boys featuring a gold brocade Nehru jacket, dupion silk kurta, and comfortable drawstring pyjama pants. Lined with soft cotton.",
      isFeatured: true,
      isBestSeller: true,
      averageRating: 4.96,
      totalReviews: 72,
      imageUrl: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Royal Maroon & Gold", size: "3-4 Y", price: 1299, compareAtPrice: 2199, stock: 12 },
        { colour: "Royal Maroon & Gold", size: "5-6 Y", price: 1299, compareAtPrice: 2199, stock: 18 },
        { colour: "Royal Maroon & Gold", size: "7-8 Y", price: 1299, compareAtPrice: 2199, stock: 15 },
        { colour: "Royal Maroon & Gold", size: "9-10 Y", price: 1299, compareAtPrice: 2199, stock: 10 },
      ],
    },
    {
      name: "Girls Festive Georgette Embroidered Lehenga Choli Set",
      slug: "girls-festive-georgette-embroidered-lehenga-choli-set",
      categoryId: catKidsWear.id,
      brand: "Fashion Cart Juniors",
      fabric: "Faux Georgette with Pure Cotton Inner Lining",
      description: "Festive flared lehenga choli set for girls adorned with gold foil mirror work and paired with a sheer net dupatta. Skin-safe, irritation-free cotton lining throughout.",
      isBestSeller: true,
      averageRating: 4.94,
      totalReviews: 68,
      imageUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Rani Pink", size: "3-4 Y", price: 1399, compareAtPrice: 2299, stock: 14 },
        { colour: "Rani Pink", size: "5-6 Y", price: 1399, compareAtPrice: 2299, stock: 20 },
        { colour: "Rani Pink", size: "7-8 Y", price: 1399, compareAtPrice: 2299, stock: 16 },
        { colour: "Rani Pink", size: "9-10 Y", price: 1399, compareAtPrice: 2299, stock: 12 },
      ],
    },
    {
      name: "100% Organic Combed Cotton Everyday Play Set (Pack of 2)",
      slug: "organic-combed-cotton-everyday-play-set-pack-of-2",
      categoryId: catKidsCotton.id,
      brand: "Fashion Cart Kids Basics",
      fabric: "100% GOTS Certified Organic Cotton",
      description: "Ultra-soft, non-toxic dyed everyday t-shirt and shorts pack. Breathable, hypoallergenic, with soft ribbed neckbands and tagless comfort labels.",
      averageRating: 4.92,
      totalReviews: 84,
      imageUrl: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Dino Green & Sky Blue", size: "2-3 Y", price: 699, compareAtPrice: 1199, stock: 25 },
        { colour: "Dino Green & Sky Blue", size: "4-5 Y", price: 699, compareAtPrice: 1199, stock: 30 },
        { colour: "Dino Green & Sky Blue", size: "6-7 Y", price: 699, compareAtPrice: 1199, stock: 22 },
      ],
    },
    {
      name: "Girls Tiered Tulle Fairy Party Frock with Satin Bow",
      slug: "girls-tiered-tulle-fairy-party-frock",
      categoryId: catKidsWear.id,
      brand: "Fashion Cart Juniors",
      fabric: "Soft Tulle Mesh with Cotton Underlayer",
      description: "Enchanting birthday party dress with multi-tiered fluffy tulle skirt, embroidered pearl bodice, and a large satin bow at the back.",
      isNewArrival: true,
      averageRating: 4.9,
      totalReviews: 53,
      imageUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Lavender Lilac", size: "2-3 Y", price: 999, compareAtPrice: 1699, stock: 16 },
        { colour: "Lavender Lilac", size: "4-5 Y", price: 999, compareAtPrice: 1699, stock: 20 },
        { colour: "Lavender Lilac", size: "6-7 Y", price: 999, compareAtPrice: 1699, stock: 15 },
      ],
    },
    {
      name: "Boys Pure Linen Mandarin Collar Half Sleeve Shirt",
      slug: "boys-pure-linen-mandarin-collar-shirt",
      categoryId: catKidsCotton.id,
      brand: "Fashion Cart Juniors",
      fabric: "100% Breathable Linen",
      description: "Smart casual summer shirt for little boys with a neat Mandarin collar, real wood buttons, and a patch chest pocket.",
      averageRating: 4.88,
      totalReviews: 37,
      imageUrl: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Sea Breeze Blue", size: "3-4 Y", price: 749, compareAtPrice: 1299, stock: 18 },
        { colour: "Sea Breeze Blue", size: "5-6 Y", price: 749, compareAtPrice: 1299, stock: 24 },
        { colour: "Sea Breeze Blue", size: "7-8 Y", price: 749, compareAtPrice: 1299, stock: 16 },
      ],
    },
    {
      name: "Girls Cotton Chikankari Kurti with Dhoti Pants",
      slug: "girls-cotton-chikankari-kurti-dhoti-pants",
      categoryId: catKidsWear.id,
      brand: "Fashion Cart Juniors",
      fabric: "100% Pure Cambric Cotton",
      description: "Traditional hand-embroidered Lucknowi cotton kurti paired with pre-stitched pleated dhoti pants. Comfortable and festive.",
      averageRating: 4.93,
      totalReviews: 45,
      imageUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Lemon Yellow", size: "3-4 Y", price: 899, compareAtPrice: 1499, stock: 15 },
        { colour: "Lemon Yellow", size: "5-6 Y", price: 899, compareAtPrice: 1499, stock: 20 },
        { colour: "Lemon Yellow", size: "7-8 Y", price: 899, compareAtPrice: 1499, stock: 14 },
      ],
    },
    {
      name: "Boys Stretch Denim Joggers with Elastic Drawstring Waist",
      slug: "boys-stretch-denim-joggers-drawstring",
      categoryId: catKidsCotton.id,
      brand: "Fashion Cart Kids Basics",
      fabric: "Cotton-Spandex Knit Denim",
      description: "Comfortable pull-on jeans with ribbed elasticated ankle cuffs and flexible drawstring waistband designed for active kids.",
      averageRating: 4.86,
      totalReviews: 51,
      imageUrl: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Medium Wash Blue", size: "4-5 Y", price: 799, compareAtPrice: 1399, stock: 20 },
        { colour: "Medium Wash Blue", size: "6-7 Y", price: 799, compareAtPrice: 1399, stock: 25 },
        { colour: "Medium Wash Blue", size: "8-9 Y", price: 799, compareAtPrice: 1399, stock: 18 },
      ],
    },
    {
      name: "Girls Floral Print Smocked Cotton Summer Dress",
      slug: "girls-floral-print-smocked-cotton-summer-dress",
      categoryId: catKidsCotton.id,
      brand: "Fashion Cart Kids Basics",
      fabric: "100% Breathable Cotton Poplin",
      description: "Sweet A-line summer frock featuring hand-drawn botanical floral prints, smocked elasticated chest, and frilled cap sleeves.",
      averageRating: 4.91,
      totalReviews: 39,
      imageUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Coral Floral", size: "2-3 Y", price: 599, compareAtPrice: 999, stock: 22 },
        { colour: "Coral Floral", size: "4-5 Y", price: 599, compareAtPrice: 999, stock: 28 },
        { colour: "Coral Floral", size: "6-7 Y", price: 599, compareAtPrice: 999, stock: 18 },
      ],
    },
    {
      name: "Boys Hand-Block Print Festive Cotton Kurta Set",
      slug: "boys-hand-block-print-festive-cotton-kurta-set",
      categoryId: catKidsWear.id,
      brand: "Fashion Cart Juniors",
      fabric: "100% Jaipur Hand-Block Cotton",
      description: "Traditional Rajasthani block print kurta with wooden buttons and matching white cotton churidar pyjama. Lightweight and skin-friendly.",
      isNewArrival: true,
      averageRating: 4.87,
      totalReviews: 34,
      imageUrl: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Turquoise & Orange", size: "3-4 Y", price: 849, compareAtPrice: 1399, stock: 15 },
        { colour: "Turquoise & Orange", size: "5-6 Y", price: 849, compareAtPrice: 1399, stock: 20 },
        { colour: "Turquoise & Orange", size: "7-8 Y", price: 849, compareAtPrice: 1399, stock: 14 },
      ],
    },
    {
      name: "Kids Unisex Combed Cotton Nightwear Pajama Set",
      slug: "kids-unisex-combed-cotton-nightwear-set",
      categoryId: catKidsCotton.id,
      brand: "Fashion Cart Kids Basics",
      fabric: "100% Interlock Combed Cotton",
      description: "Cozy full-sleeve button-down night suit with piped collar trims and relaxed elastic-waist lounge trousers. Ultra-gentle for peaceful sleep.",
      averageRating: 4.95,
      totalReviews: 62,
      imageUrl: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1000&auto=format&fit=crop&q=85",
      variants: [
        { colour: "Starlit Navy Print", size: "3-4 Y", price: 649, compareAtPrice: 1099, stock: 20 },
        { colour: "Starlit Navy Print", size: "5-6 Y", price: 649, compareAtPrice: 1099, stock: 25 },
        { colour: "Starlit Navy Print", size: "7-8 Y", price: 649, compareAtPrice: 1099, stock: 18 },
      ],
    },
  ];

  console.log(`📦 Upserting ${CATALOG_PRODUCTS.length} curated luxury products...`);

  let count = 0;
  for (const item of CATALOG_PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        categoryId: item.categoryId,
        brand: item.brand,
        fabric: item.fabric,
        description: item.description,
        isFeatured: item.isFeatured || false,
        isNewArrival: item.isNewArrival || false,
        isBestSeller: item.isBestSeller || false,
        averageRating: item.averageRating || 4.85,
        totalReviews: item.totalReviews || 35,
        status: "ACTIVE",
      },
      create: {
        name: item.name,
        slug: item.slug,
        categoryId: item.categoryId,
        brand: item.brand,
        fabric: item.fabric,
        description: item.description,
        isFeatured: item.isFeatured || false,
        isNewArrival: item.isNewArrival || false,
        isBestSeller: item.isBestSeller || false,
        averageRating: item.averageRating || 4.85,
        totalReviews: item.totalReviews || 35,
        status: "ACTIVE",
      },
    });

    // Ensure product image
    const existingImg = await prisma.productImage.findFirst({
      where: { productId: product.id },
    });

    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: item.imageUrl,
          altText: item.name,
          sortOrder: 0,
        },
      });
    } else {
      await prisma.productImage.update({
        where: { id: existingImg.id },
        data: { imageUrl: item.imageUrl, altText: item.name },
      });
    }

    // Upsert variants
    for (const v of item.variants) {
      const sku = `${item.slug.slice(0, 10).toUpperCase()}-${v.colour.slice(0, 3).toUpperCase()}-${v.size.toUpperCase()}`;
      await prisma.productVariant.upsert({
        where: {
          productId_colour_size: {
            productId: product.id,
            colour: v.colour,
            size: v.size,
          },
        },
        update: {
          price: v.price,
          compareAtPrice: v.compareAtPrice || null,
          stockQuantity: v.stock,
          isActive: true,
        },
        create: {
          productId: product.id,
          sku,
          colour: v.colour,
          size: v.size,
          price: v.price,
          compareAtPrice: v.compareAtPrice || null,
          stockQuantity: v.stock,
          isActive: true,
        },
      });
    }

    count++;
  }

  console.log(`✅ Successfully seeded ${count} premium products across all 4 departments!`);
}

seedPremiumCatalog()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
