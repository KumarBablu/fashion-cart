import { NextRequest, NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Cleans third-party marketplace platform references and promotional noise
function sanitizeDescription(desc: string, title: string, brand: string, material: string): string {
  if (!desc) {
    return `${title} crafted with exquisite ${material || "premium materials"} and luxury finishing, curated exclusively for Fashion Cart.`;
  }

  let cleaned = desc
    .replace(/Buy\s+.*?\s+For\s+Only\s+Rs\.\s*[0-9.]+\s+Online\s+in\s+India\.?/gi, "")
    .replace(/Shop\s+Online\s+For\s+(?:Apparels|Jewellery)\.?/gi, "")
    .replace(/Huge\s+Collection\s+of\s+Branded\s+(?:Clothes|Jewellery)\s+Only\s+at\s+Flipkart\.com\.?/gi, "")
    .replace(/\b(Flipkart|Amazon|Meesho|Myntra|Snapdeal|Ajio|Shopsy|TataCliq|Nykaa)\b(?:\.com)?/gi, "Fashion Cart")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 15) {
    cleaned = `${title} from ${brand || "Fashion Cart Atelier"} crafted with ${material || "fine craftsmanship"} and tailored for premium elegance and splendour.`;
  }

  return cleaned;
}

// Auto-extracts material / fabric
function extractMaterial(title: string, desc: string, rawMaterial?: string): string {
  if (rawMaterial && rawMaterial.trim()) return rawMaterial.trim();

  const combined = `${title} ${desc}`.toLowerCase();
  // Jewellery materials
  if (combined.includes("kundan")) return "Brass Alloy with Uncut Kundan";
  if (combined.includes("polki")) return "Copper Alloy with Polki Stones";
  if (combined.includes("american diamond") || combined.includes("cz") || combined.includes("zircon")) return "Brass Alloy with Cubic Zirconia";
  if (combined.includes("temple")) return "Matte Antique Gold Brass Alloy";
  if (combined.includes("pearl")) return "Alloy with Cultured Pearls";
  if (combined.includes("silver") || combined.includes("925")) return "925 Sterling Silver Plated";
  if (combined.includes("gold plated") || combined.includes("micro-plated") || combined.includes("micron")) return "24K Micro-Plated Brass";

  // Garment fabrics
  if (combined.includes("georgette")) return "Pure Georgette";
  if (combined.includes("silk") && combined.includes("satin")) return "Silk Satin Blend";
  if (combined.includes("banarasi silk") || combined.includes("katan silk")) return "Pure Banarasi Silk";
  if (combined.includes("silk")) return "Artisan Silk";
  if (combined.includes("linen")) return "Pure French Linen";
  if (combined.includes("cotton")) return "100% Breathable Cotton";
  if (combined.includes("rayon")) return "Soft Premium Rayon";
  if (combined.includes("chiffon")) return "Flowing Chiffon";
  if (combined.includes("velvet")) return "Plush Velvet";

  return "Premium Alloy & Materials";
}

// Auto-extracts size from title or image URLs if blank
function extractSize(title: string, imageUrls: string[], rawSize?: string, isJewellery = false): string {
  if (rawSize && rawSize.trim()) return rawSize.trim();

  if (isJewellery) {
    const combined = title.toLowerCase();
    if (combined.includes("adjustable") || combined.includes("free size")) return "Adjustable";
    if (combined.includes("2.4") || combined.includes("2-4")) return "2.4";
    if (combined.includes("2.6") || combined.includes("2-6")) return "2.6";
    if (combined.includes("2.8") || combined.includes("2-8")) return "2.8";
    return "Free Size / Adjustable";
  }

  const combined = `${title} ${imageUrls.join(" ")}`.toLowerCase();
  if (/(?:^|[^a-z0-9])xxxl(?:$|[^a-z0-9])/i.test(combined) || combined.includes("3xl")) return "3XL";
  if (/(?:^|[^a-z0-9])xxl(?:$|[^a-z0-9])/i.test(combined) || combined.includes("2xl")) return "XXL";
  if (/(?:^|[^a-z0-9])xl(?:$|[^a-z0-9])/i.test(combined)) return "XL";
  if (/(?:^|[^a-z0-9])l(?:$|[^a-z0-9])/i.test(combined)) return "L";
  if (/(?:^|[^a-z0-9])m(?:$|[^a-z0-9])/i.test(combined)) return "M";
  if (/(?:^|[^a-z0-9])xs(?:$|[^a-z0-9])/i.test(combined)) return "XS";
  if (/(?:^|[^a-z0-9])s(?:$|[^a-z0-9])/i.test(combined)) return "S";

  return "Free Size";
}

// Automatically infers Department, Category, and Subcategory
function inferTaxonomy(title: string, rawDept?: string, rawCat?: string, rawSubcat?: string, isJewellery = false) {
  const lower = title.toLowerCase();

  let department = rawDept?.trim();
  let category = rawCat?.trim();
  let subcategory = rawSubcat?.trim();

  if (isJewellery) {
    if (!department) department = "Jewellery";
    if (!category) {
      if (lower.includes("choker") || lower.includes("necklace") || lower.includes("haar") || lower.includes("set")) category = "Necklaces & Sets";
      else if (lower.includes("earring") || lower.includes("jhumka") || lower.includes("bali") || lower.includes("stud")) category = "Earrings & Jhumkas";
      else if (lower.includes("bangle") || lower.includes("kada") || lower.includes("bracelet")) category = "Bangles & Kadas";
      else if (lower.includes("ring")) category = "Rings";
      else if (lower.includes("tikka") || lower.includes("nath") || lower.includes("anklet") || lower.includes("payal")) category = "Bridal Accents";
      else category = "Fine Jewellery";
    }
    if (!subcategory) {
      if (lower.includes("kundan")) subcategory = "Kundan Chokers";
      else if (lower.includes("temple")) subcategory = "Temple Haar";
      else if (lower.includes("jhumka")) subcategory = "Royal Jhumkas";
      else if (lower.includes("kada")) subcategory = "Openable Kadas";
      else if (lower.includes("solitaire")) subcategory = "Solitaire Rings";
      else subcategory = category;
    }
    return { department, category, subcategory };
  }

  // 1. Department fallback for garments
  if (!department) {
    if (lower.includes("women") || lower.includes("saree") || lower.includes("kurti") || lower.includes("lehenga") || lower.includes("anarkali") || lower.includes("gown") || lower.includes("dress")) {
      department = "Women";
    } else if (lower.includes("men") || lower.includes("shirt") || lower.includes("kurta") || lower.includes("trouser") || lower.includes("jeans")) {
      department = "Men";
    } else if (lower.includes("kid") || lower.includes("boy") || lower.includes("girl") || lower.includes("baby")) {
      department = "Kids";
    } else {
      department = "Women";
    }
  }

  // 2. Category & Subcategory fallback
  if (!category || !subcategory) {
    if (lower.includes("saree") || lower.includes("sari")) {
      category = category || "Ethnic Wear";
      subcategory = subcategory || (lower.includes("banarasi") ? "Banarasi Silk Sarees" : lower.includes("cotton") ? "Cotton Sarees" : "Designer Sarees");
    } else if (lower.includes("kurti") || lower.includes("kurta")) {
      category = category || "Ethnic Wear";
      subcategory = subcategory || "Kurtis & Tunics";
    } else if (lower.includes("lehenga") || lower.includes("choli")) {
      category = category || "Festive & Bridal";
      subcategory = subcategory || "Bridal Lehengas";
    } else if (lower.includes("dress") || lower.includes("gown")) {
      category = category || "Western Wear";
      subcategory = subcategory || "Maxi & Party Dresses";
    } else if (lower.includes("shirt")) {
      category = category || "Topwear";
      subcategory = subcategory || "Linen & Casual Shirts";
    } else if (lower.includes("jeans") || lower.includes("denim")) {
      category = category || "Bottomwear";
      subcategory = subcategory || "Denim Jeans";
    } else {
      category = category || "Apparel";
      subcategory = subcategory || "Atelier Collection";
    }
  }

  return { department, category, subcategory };
}

// In-memory Category Resolver with Request Cache
async function resolveCategoryHierarchy(
  department: string,
  subcategory: string,
  db: any,
  cache?: Map<string, string>
): Promise<string> {
  const cleanParent = department.trim();
  const cleanSub = subcategory.trim();
  const cacheKey = `${cleanParent}:::${cleanSub}`;

  if (cache && cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const parentSlug = slugify(cleanParent);
  const subSlug = slugify(`${cleanParent}-${cleanSub}`);

  let parentCat = await db.category.findFirst({
    where: {
      OR: [{ slug: parentSlug }, { slug: slugify(cleanParent) }, { name: { equals: cleanParent, mode: "insensitive" } }],
    },
  });

  if (!parentCat) {
    try {
      parentCat = await db.category.create({
        data: {
          name: cleanParent,
          slug: parentSlug,
          isActive: true,
        },
      });
    } catch {
      parentCat = await db.category.findFirst({
        where: {
          OR: [{ slug: parentSlug }, { slug: slugify(cleanParent) }],
        },
      });
    }
  }

  if (!parentCat) {
    const fallback = await db.category.findFirst({ where: { isActive: true } });
    const resolvedId = fallback?.id || "";
    if (cache) cache.set(cacheKey, resolvedId);
    return resolvedId;
  }

  let subCat = await db.category.findFirst({
    where: {
      OR: [
        { slug: subSlug },
        { slug: slugify(cleanSub) },
        { name: { equals: cleanSub, mode: "insensitive" }, parentId: parentCat.id },
      ],
    },
  });

  if (!subCat) {
    try {
      subCat = await db.category.create({
        data: {
          name: cleanSub,
          slug: subSlug,
          isActive: true,
          parentId: parentCat.id,
        },
      });
    } catch {
      subCat = await db.category.findFirst({
        where: {
          OR: [{ slug: subSlug }, { slug: slugify(cleanSub) }],
        },
      });
    }
  }

  const finalId = subCat?.id || parentCat.id;
  if (cache) cache.set(cacheKey, finalId);
  return finalId;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !insideQuotes) {
      if (char === "\r") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const storeParam = req.nextUrl.searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const activeStore = storeParam.toLowerCase().includes("jewel") ? "jewellery" : "garments";
  const isJewellery = activeStore === "jewellery";
  const db = getDb(activeStore);

  try {
    let csvText = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No CSV file provided in upload" }, { status: 400 });
      }
      csvText = await file.text();
    } else if (contentType.includes("application/json")) {
      const jsonBody = await req.json().catch(() => ({}));
      csvText = jsonBody.csvText || "";
    } else {
      csvText = await req.text();
    }

    if (!csvText || !csvText.trim()) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    const rows = parseCsvRows(csvText);
    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV contains no data rows (only header found)" }, { status: 400 });
    }

    // Normalized header mapping (alphanumeric lowercase)
    const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const findIndex = (...patterns: string[]) => {
      for (const p of patterns) {
        const cleanPattern = p.toLowerCase().replace(/[^a-z0-9]/g, "");
        const idx = header.findIndex((h) => h === cleanPattern || h.includes(cleanPattern));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    // Map all 72 columns and attribute synonyms
    const colIndex = {
      productId: findIndex("productid", "itemid"),
      sku: findIndex("sku", "variantid", "productsku"),
      title: findIndex("title", "name", "productname"),
      slug: findIndex("slug", "handle"),
      productUrl: findIndex("producturl", "sellerurl", "sourcelink", "sourceurl", "url"),
      department: findIndex("department", "maincategory", "gender", "dept"),
      category: findIndex("category", "parentcategory", "cat"),
      subcategory: findIndex("subcategory", "subcat", "type"),
      categoryPath: findIndex("categorypath"),
      productType: findIndex("producttype", "attributeproducttype", "type"),
      netQty: findIndex("netqty", "attributenetqty", "netquantity"),
      materialType: findIndex("materialtype", "attributematerialtype", "material", "fabric", "composition"),
      closureType: findIndex("closuretype", "attributeclosuretype", "closure"),
      colourName: findIndex("colourname", "attributecolourname", "colour", "color", "shade"),
      shape: findIndex("shape", "attributeshape", "motif"),
      keyFeatures: findIndex("keyfeatures", "attributekeyfeatures", "highlights", "features"),
      gender: findIndex("gender", "attributegender"),
      occasion: findIndex("occasion", "attributeoccasion", "wear"),
      designType: findIndex("designtype", "attributedesigntype", "design"),
      gemType: findIndex("gemtype", "attributegemtype", "stone", "gem"),
      plating: findIndex("plating", "attributeplating", "polish", "finish"),
      metalType: findIndex("metaltype", "attributemetaltype", "metal"),
      gift: findIndex("gift", "attributegift", "giftready"),
      brand: findIndex("brand", "attributebrand", "designer"),
      description: findIndex("description", "desc", "details"),
      status: findIndex("status", "state"),
      availability: findIndex("availability", "stockstatus"),
      price: findIndex("price", "sellingprice", "priceinr", "offerprice"),
      compareAtPrice: findIndex("compareatprice", "compareprice", "mrp", "originalprice"),
      discountPercent: findIndex("discountpercent", "discount", "offpercent"),
      discountAmount: findIndex("discountamount"),
      currency: findIndex("currency"),
      stockQuantity: findIndex("stockquantity", "stock", "quantity", "qty"),
      rating: findIndex("rating", "stars", "averagerating"),
      ratingCount: findIndex("ratingcount", "ratingscount"),
      reviewCount: findIndex("reviewcount", "totalreviews", "reviews"),
      imageUrl: findIndex("imageurl", "image1", "image", "photo"),
      imageUrl2: findIndex("imageurl2", "image2", "photo2"),
      imageUrl3: findIndex("imageurl3", "image3", "photo3"),
      imageUrl4: findIndex("imageurl4", "image4", "photo4"),
      imageUrl5: findIndex("imageurl5", "image5", "photo5"),
      sellerName: findIndex("sellername", "attributesellername", "vendorname", "suppliername", "seller"),
      sellerEmail: findIndex("selleremail"),
      sellerAddress: findIndex("selleraddress", "attributeselleraddress"),
      sellerLicenseNo: findIndex("sellerlicenseno", "attributesellerlicenseno"),
      manufacturerOrMarketerName: findIndex("manufacturerormarketername", "attributemanufacturerormarketername"),
      manufacturerOrMarketerAddress: findIndex("manufacturerormarketeraddress", "attributemanufacturerormarketeraddress"),
      countryOfOrigin: findIndex("countryoforigin", "attributecountryoforigin", "origin"),
      searchKeywords: findIndex("searchkeywords", "keywords", "tags"),
      sourceUrl: findIndex("sourceurl"),
      collectedAt: findIndex("collectedat"),
      size: findIndex("size", "dimensions"),
      pattern: findIndex("pattern", "print", "motif"),
      fit: findIndex("fit", "cut"),
    };

    let processedCount = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    let variantsCreatedOrUpdated = 0;
    let sellersCreatedOrLinked = 0;
    const errors: string[] = [];

    const sellerCache = new Map<string, string>();
    const categoryCache = new Map<string, string>();

    const dataRows = rows.slice(1);
    const BATCH_SIZE = 20;

    for (let batchStart = 0; batchStart < dataRows.length; batchStart += BATCH_SIZE) {
      const currentBatch = dataRows.slice(batchStart, batchStart + BATCH_SIZE);
      await Promise.all(
        currentBatch.map(async (row, batchIdx) => {
          const idx = batchStart + batchIdx;
          if (row.length === 0 || row.every((c) => !c)) return;
          const r = idx + 1;

        const getVal = (col: number) => (col >= 0 && col < row.length ? row[col].trim() : "");

        const rawTitle = getVal(colIndex.title);
        const title = rawTitle || (isJewellery ? "Imperial Jewellery Masterpiece" : "Luxury Garment Listing");
        const brand = getVal(colIndex.brand) || (isJewellery ? "Imperial Fine Jewels" : "Fashion Cart Atelier");
        const rawCustomProductId = getVal(colIndex.productId);
        const rawSlug = getVal(colIndex.slug);
        const rawSku = getVal(colIndex.sku);

        const rowRandomEntropy = Math.random().toString(36).substring(2, 7).toLowerCase();
        const rowSkuEntropy = Math.random().toString(36).substring(2, 7).toUpperCase();

        // 1. Taxonomy & Hierarchy
        const rawDept = getVal(colIndex.department);
        const rawCat = getVal(colIndex.category);
        const rawSubcat = getVal(colIndex.subcategory);
        const { department, category, subcategory } = inferTaxonomy(title, rawDept, rawCat, rawSubcat, isJewellery);
        const rawCategoryPath = getVal(colIndex.categoryPath);
        const categoryPath = rawCategoryPath || [department, category, subcategory]
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(" > ");

        // 2. Specifications & Materials
        const rawMaterial = getVal(colIndex.materialType);
        const rawDesc = getVal(colIndex.description);
        const material = extractMaterial(title, rawDesc, rawMaterial);
        const description = sanitizeDescription(rawDesc, title, brand, material);

        // Cleaned Specification Attributes Object without "Attribute" prefix
        const specifications: Record<string, string> = {};
        const addSpec = (key: string, val: string) => {
          if (val && val.trim()) specifications[key] = val.trim();
        };

        addSpec("product_type", getVal(colIndex.productType) || subcategory);
        addSpec("net_qty", getVal(colIndex.netQty) || "1 Unit");
        addSpec("material_type", material);
        addSpec("closure_type", getVal(colIndex.closureType));
        addSpec("colour_name", getVal(colIndex.colourName));
        addSpec("shape", getVal(colIndex.shape));
        addSpec("key_features", getVal(colIndex.keyFeatures));
        addSpec("gender", getVal(colIndex.gender) || (isJewellery ? "Women" : department));
        addSpec("occasion", getVal(colIndex.occasion) || (isJewellery ? "Bridal & Festive" : "Party & Casual"));
        addSpec("design_type", getVal(colIndex.designType));
        addSpec("gem_type", getVal(colIndex.gemType));
        addSpec("plating", getVal(colIndex.plating) || (isJewellery ? "24K Micro-Plated Gold" : ""));
        addSpec("metal_type", getVal(colIndex.metalType) || (isJewellery ? "Brass Alloy" : ""));
        addSpec("gift", getVal(colIndex.gift) || "Velvet Gift Box Ready");
        addSpec("country_of_origin", getVal(colIndex.countryOfOrigin) || "India 🇮🇳");
        addSpec("search_keywords", getVal(colIndex.searchKeywords));
        addSpec("source_url", getVal(colIndex.sourceUrl) || getVal(colIndex.productUrl));
        addSpec("collected_at", getVal(colIndex.collectedAt) || new Date().toISOString());
        
        // Confidential Supplier attributes (Admin view only)
        addSpec("seller_name", getVal(colIndex.sellerName));
        addSpec("seller_email", getVal(colIndex.sellerEmail));
        addSpec("seller_address", getVal(colIndex.sellerAddress));
        addSpec("seller_license_no", getVal(colIndex.sellerLicenseNo));
        addSpec("manufacturer_or_marketer_name", getVal(colIndex.manufacturerOrMarketerName));
        addSpec("manufacturer_or_marketer_address", getVal(colIndex.manufacturerOrMarketerAddress));

        // 3. Status & Availability
        const statusRaw = getVal(colIndex.status).toUpperCase();
        const status: ProductStatus =
          statusRaw === "DRAFT"
            ? ProductStatus.DRAFT
            : statusRaw === "ARCHIVED"
            ? ProductStatus.ARCHIVED
            : ProductStatus.ACTIVE;

        const availRaw = getVal(colIndex.availability).toUpperCase();
        const availability =
          availRaw === "OUT_OF_STOCK" || availRaw === "OUTOFSTOCK"
            ? "OUT_OF_STOCK"
            : "IN_STOCK";

        // 4. Images (Up to 5)
        const rawImageUrls = [
          getVal(colIndex.imageUrl),
          getVal(colIndex.imageUrl2),
          getVal(colIndex.imageUrl3),
          getVal(colIndex.imageUrl4),
          getVal(colIndex.imageUrl5),
        ].filter((u) => u && (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/") || u.startsWith("data:")));

        const imageUrls = rawImageUrls.map(normalizeImageUrl);

        // 5. Variant Attributes
        const rawSize = getVal(colIndex.size);
        const size = extractSize(title, rawImageUrls, rawSize, isJewellery);
        const colour = getVal(colIndex.colourName) || "Classic Gold";
        const pattern = getVal(colIndex.pattern) || (isJewellery ? "Handcrafted Kundan" : "Artisan Weave");
        const fit = getVal(colIndex.fit) || (isJewellery ? "Comfort Fit" : "Regular Fit");
        const occasion = getVal(colIndex.occasion) || (isJewellery ? "Bridal & Festive" : "Festive & Daily Luxury");
        const currency = getVal(colIndex.currency) || "INR";

        // 6. Price & Discounts
        const priceNum = Number(getVal(colIndex.price).replace(/[^0-9.]/g, "")) || (isJewellery ? 188 : 999);
        let compareNum = Number(getVal(colIndex.compareAtPrice).replace(/[^0-9.]/g, "")) || null;
        let discountNum = Number(getVal(colIndex.discountPercent).replace(/[^0-9.]/g, "")) || null;

        if (discountNum && discountNum > 0 && discountNum < 90 && (!compareNum || compareNum <= priceNum)) {
          compareNum = Math.round(priceNum / (1 - discountNum / 100));
        }

        if (!compareNum || compareNum <= priceNum) {
          compareNum = Math.round((priceNum * 1.5) / 50) * 50 - 1;
          if (compareNum <= priceNum) compareNum = priceNum + (isJewellery ? 299 : 499);
        }

        if (!discountNum && compareNum && compareNum > priceNum) {
          discountNum = Math.round(((compareNum - priceNum) / compareNum) * 100);
        }

        // 7. Stock Quantity
        const stockNum = parseInt(getVal(colIndex.stockQuantity).replace(/[^0-9]/g, "") || "50", 10) || 50;

        // 8. Seller / Supplier
        const sellerName = getVal(colIndex.sellerName);
        const sellerEmail = getVal(colIndex.sellerEmail);
        let sellerIdStr = `SLR-${slugify(sellerName || "VENDOR").toUpperCase().slice(0, 8)}-101`;

        // 9. Ratings
        const ratingNum = Number(getVal(colIndex.rating).replace(/[^0-9.]/g, "")) || 4.9;
        const ratingCountNum = parseInt(getVal(colIndex.ratingCount).replace(/[^0-9]/g, "") || "24", 10);
        const reviewCountNum = parseInt(getVal(colIndex.reviewCount).replace(/[^0-9]/g, "") || "18", 10);

        try {
          // 1. Resolve Category in active store DB (cached)
          const assignedCategoryId = await resolveCategoryHierarchy(department, subcategory, db, categoryCache);

          // 2. Resolve or Create Seller in active store DB
          let linkedSellerId: string | null = null;
          if (sellerName) {
            if (sellerCache.has(sellerIdStr)) {
              linkedSellerId = sellerCache.get(sellerIdStr)!;
            } else {
              let seller = await db.seller.findUnique({
                where: { sellerId: sellerIdStr },
              });

              if (!seller) {
                try {
                  seller = await db.seller.create({
                    data: {
                      sellerId: sellerIdStr,
                      name: sellerName,
                      email: sellerEmail || null,
                      address: getVal(colIndex.sellerAddress) || null,
                      url: getVal(colIndex.productUrl) || null,
                      isActive: true,
                    },
                  });
                  sellersCreatedOrLinked++;
                } catch {
                  seller = await db.seller.findFirst({
                    where: { sellerId: sellerIdStr },
                  });
                }
              }
              if (seller) {
                linkedSellerId = seller.id;
                sellerCache.set(sellerIdStr, seller.id);
              }
            }
          }

          // 3. Resolve Existing Product with Single Consolidated Query
          const searchConditions: any[] = [];
          if (rawCustomProductId) searchConditions.push({ productId: rawCustomProductId });
          if (rawSlug && rawSlug.length > 2 && !rawSlug.startsWith("itm")) searchConditions.push({ slug: slugify(rawSlug) });
          if (title) searchConditions.push({ name: { equals: title, mode: "insensitive" as const } });

          let product: any = null;
          if (searchConditions.length > 0) {
            product = await db.product.findFirst({
              where: { OR: searchConditions },
            });
          }

          // Collision-proof Slug & ProductID
          const baseSlug = rawSlug && rawSlug.length > 2 && !rawSlug.startsWith("itm") ? slugify(rawSlug) : slugify(title);
          const finalSlug = product ? product.slug : `${baseSlug}-${rowRandomEntropy}`;

          const brandPrefix = isJewellery ? "JW" : "GAR";
          const brandCode = slugify(brand || "FC").toUpperCase().slice(0, 4) || "FC";
          const finalProductId = rawCustomProductId || product?.productId || `FC-${brandPrefix}-${brandCode}-${rowSkuEntropy}`;
          const finalProductUrl = getVal(colIndex.productUrl) || `/products/${finalSlug}`;

          const productData = {
            productId: finalProductId,
            name: title,
            slug: finalSlug,
            productUrl: finalProductUrl,
            department,
            subcategory,
            categoryPath,
            productType: getVal(colIndex.productType) || subcategory,
            brand,
            fabric: !isJewellery ? material : null,
            material,
            pattern,
            fit,
            occasion,
            currency,
            availability,
            description,
            status,
            categoryId: assignedCategoryId,
            sellerId: linkedSellerId,
            sellerName: sellerName || null,
            sellerIdentifier: sellerIdStr || null,
            sellerUrl: finalProductUrl || null,
            sellerEmail: sellerEmail || null,
            averageRating: ratingNum,
            ratingCount: ratingCountNum,
            totalReviews: reviewCountNum,
            reviewCount: reviewCountNum,
            tags: getVal(colIndex.searchKeywords) || null,
            specifications: specifications,
          };

          const sizeCode = slugify(size || "FS").toUpperCase().slice(0, 4) || "FS";
          const finalSku = rawSku ? `${rawSku}-${rowSkuEntropy.slice(0, 3)}` : `FC-${brandPrefix}-${brandCode}-${sizeCode}-${rowSkuEntropy}`;

          if (!product) {
            product = await db.product.create({
              data: {
                ...productData,
                variants: {
                  create: {
                    sku: finalSku,
                    colour,
                    size,
                    price: priceNum,
                    compareAtPrice: compareNum,
                    discountPercent: discountNum,
                    stockQuantity: stockNum,
                    isActive: true,
                  },
                },
                images: imageUrls.length > 0 ? {
                  createMany: {
                    data: imageUrls.map((url, imgIdx) => ({
                      imageUrl: url,
                      altText: `${title} - View ${imgIdx + 1}`,
                      sortOrder: imgIdx,
                    })),
                  },
                } : undefined,
              },
            });
            productsCreated++;
            variantsCreatedOrUpdated++;
          } else {
            product = await db.product.update({
              where: { id: product.id },
              data: productData,
            });
            productsUpdated++;

            const existingVariant = await db.productVariant.findFirst({
              where: {
                productId: product.id,
                OR: [
                  ...(rawSku ? [{ sku: rawSku }] : []),
                  { size: size, colour: colour },
                ],
              },
            });

            if (existingVariant) {
              await db.productVariant.update({
                where: { id: existingVariant.id },
                data: {
                  price: priceNum,
                  compareAtPrice: compareNum,
                  discountPercent: discountNum,
                  stockQuantity: stockNum,
                  isActive: true,
                },
              });
            } else {
              await db.productVariant.create({
                data: {
                  productId: product.id,
                  sku: finalSku,
                  colour,
                  size,
                  price: priceNum,
                  compareAtPrice: compareNum,
                  discountPercent: discountNum,
                  stockQuantity: stockNum,
                  isActive: true,
                },
              });
            }
            variantsCreatedOrUpdated++;

            if (imageUrls.length > 0) {
              await db.productImage.createMany({
                data: imageUrls.map((url, imgIdx) => ({
                  productId: product.id,
                  imageUrl: url,
                  altText: `${title} - View ${imgIdx + 1}`,
                  sortOrder: imgIdx,
                })),
                skipDuplicates: true,
              });
            }
          }

          processedCount++;
        } catch (err: any) {
          console.error(`Error processing row ${r + 1} (${title}):`, err);
          errors.push(`Row ${r + 1} (${title}): ${err.message || "Unknown error"}`);
        }
      })
    );
  }

    return NextResponse.json({
      success: true,
      store: activeStore,
      processedRows: processedCount,
      productsCreated,
      productsUpdated,
      variantsCreatedOrUpdated,
      sellersCreatedOrLinked,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Bulk upload processing error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file. Ensure it is valid CSV formatting." },
      { status: 500 }
    );
  }
}
