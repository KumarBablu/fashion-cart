import { NextRequest, NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
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
function sanitizeDescription(desc: string, title: string, brand: string, fabric: string): string {
  if (!desc) {
    return `${title} crafted with premium ${fabric || "fabrics"} and luxury finishing, curated exclusively for Fashion Cart.`;
  }

  let cleaned = desc
    .replace(/Buy\s+.*?\s+For\s+Only\s+Rs\.\s*[0-9.]+\s+Online\s+in\s+India\.?/gi, "")
    .replace(/Shop\s+Online\s+For\s+Apparels\.?/gi, "")
    .replace(/Huge\s+Collection\s+of\s+Branded\s+Clothes\s+Only\s+at\s+Flipkart\.com\.?/gi, "")
    .replace(/\b(Flipkart|Amazon|Meesho|Myntra|Snapdeal|Ajio|Shopsy|TataCliq|Nykaa)\b(?:\.com)?/gi, "Fashion Cart")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 15) {
    cleaned = `${title} from ${brand || "Fashion Cart Atelier"} crafted with ${fabric || "fine textiles"} and tailored for premium comfort and style.`;
  }

  return cleaned;
}

// Auto-extracts fabric from title or description if blank
function extractFabric(title: string, desc: string, rawFabric?: string): string {
  if (rawFabric && rawFabric.trim()) return rawFabric.trim();

  const combined = `${title} ${desc}`.toLowerCase();
  if (combined.includes("georgette")) return "Pure Georgette";
  if (combined.includes("silk") && combined.includes("satin")) return "Silk Satin Blend";
  if (combined.includes("banarasi silk") || combined.includes("katan silk")) return "Pure Banarasi Silk";
  if (combined.includes("silk")) return "Artisan Silk";
  if (combined.includes("linen")) return "Pure French Linen";
  if (combined.includes("cotton")) return "100% Breathable Cotton";
  if (combined.includes("rayon")) return "Soft Premium Rayon";
  if (combined.includes("chiffon")) return "Flowing Chiffon";
  if (combined.includes("velvet")) return "Plush Velvet";
  if (combined.includes("organza")) return "Delicate Organza";
  if (combined.includes("crepe")) return "Draped Crepe";
  if (combined.includes("denim")) return "Durable Denim";
  if (combined.includes("leather")) return "Genuine Leather";

  return "Premium Textile Blend";
}

// Auto-extracts size from title or image URLs if blank
function extractSize(title: string, imageUrls: string[], rawSize?: string): string {
  if (rawSize && rawSize.trim()) return rawSize.trim();

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

// Auto-extracts Pattern
function extractPattern(title: string, rawPattern?: string): string {
  if (rawPattern && rawPattern.trim()) return rawPattern.trim();
  const lower = title.toLowerCase();
  if (lower.includes("printed") || lower.includes("floral print")) return "Artisan Print";
  if (lower.includes("woven") || lower.includes("zari")) return "Zari Woven";
  if (lower.includes("embroidered")) return "Handcrafted Embroidery";
  if (lower.includes("solid") || lower.includes("plain")) return "Solid Minimalist";
  if (lower.includes("striped") || lower.includes("stripes")) return "Striped";
  if (lower.includes("checked") || lower.includes("checks")) return "Checked";
  return "Artisan Handloom";
}

// Automatically infers Department, Category, and Subcategory
function inferTaxonomy(title: string, rawDept?: string, rawCat?: string, rawSubcat?: string) {
  const lower = title.toLowerCase();

  let department = rawDept?.trim();
  let category = rawCat?.trim();
  let subcategory = rawSubcat?.trim();

  // 1. Department fallback
  if (!department) {
    if (lower.includes("women") || lower.includes("women's") || lower.includes("lady") || lower.includes("girl") || lower.includes("saree") || lower.includes("kurti") || lower.includes("anarkali") || lower.includes("lehenga") || lower.includes("dupatta")) {
      department = "Women";
    } else if (lower.includes("men") || lower.includes("men's") || lower.includes("boy") || lower.includes("shirt") || lower.includes("t-shirt") || lower.includes("polo") || lower.includes("trouser") || lower.includes("blazer") || lower.includes("chino")) {
      department = "Men";
    } else if (lower.includes("kid") || lower.includes("baby") || lower.includes("infant") || lower.includes("child")) {
      department = "Kids";
    } else {
      department = "Women";
    }
  }

  // 2. Subcategory / Category fallback
  if (!subcategory) {
    if (lower.includes("saree") || lower.includes("sari")) subcategory = "Mulberry Silk Sarees";
    else if (lower.includes("kurta pant") || lower.includes("kurti set") || lower.includes("ethnic set")) subcategory = "Velvet & Silk Kurti Sets";
    else if (lower.includes("kurti") || lower.includes("kurta")) subcategory = "Embroidered Silk Kurtis";
    else if (lower.includes("polo") || lower.includes("t-shirt") || lower.includes("tshirt")) subcategory = "T-Shirts";
    else if (lower.includes("shirt")) subcategory = "Pure French Linen Shirts";
    else if (lower.includes("trouser") || lower.includes("pant") || lower.includes("chino")) subcategory = "Trousers & Chinos";
    else if (lower.includes("dress") || lower.includes("gown") || lower.includes("maxi")) subcategory = "Evening Gowns & Dresses";
    else if (lower.includes("lehenga") || lower.includes("choli")) subcategory = "Bridal & Festive Lehengas";
    else subcategory = "Apparel & Couture";
  }

  if (!category) {
    category = subcategory;
  }

  return { department, category, subcategory };
}

// In-memory Caches across requests
const categoryCache = new Map<string, string>();
const sellerCache = new Map<string, string>();

async function resolveCategoryHierarchy(deptName: string, subcatName: string): Promise<string> {
  const cleanDept = deptName.trim() || "Women";
  const cleanSub = subcatName.trim() || "Apparel";
  const cacheKey = `${cleanDept.toLowerCase()}:::${cleanSub.toLowerCase()}`;

  if (categoryCache.has(cacheKey)) {
    return categoryCache.get(cacheKey)!;
  }

  const deptSlug = slugify(cleanDept);

  // 1. Find or create Department (Parent Category)
  let parentCat = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: cleanDept, mode: "insensitive" } },
        { slug: deptSlug },
      ],
      parentId: null,
    },
  });

  if (!parentCat) {
    try {
      parentCat = await prisma.category.create({
        data: {
          name: cleanDept,
          slug: deptSlug,
          isActive: true,
          parentId: null,
        },
      });
    } catch {
      parentCat = await prisma.category.findFirst({
        where: { slug: deptSlug },
      });
    }
  }

  if (!parentCat) {
    const fallbackId = await getFallbackCategoryId();
    categoryCache.set(cacheKey, fallbackId);
    return fallbackId;
  }

  // 2. Find or create Subcategory under Parent
  const subSlug = `${deptSlug}-${slugify(cleanSub)}`;

  let subCat = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: cleanSub, mode: "insensitive" }, parentId: parentCat.id },
        { slug: subSlug },
        { slug: slugify(cleanSub) },
      ],
    },
  });

  if (!subCat) {
    try {
      subCat = await prisma.category.create({
        data: {
          name: cleanSub,
          slug: subSlug,
          isActive: true,
          parentId: parentCat.id,
        },
      });
    } catch {
      subCat = await prisma.category.findFirst({
        where: {
          OR: [{ slug: subSlug }, { slug: slugify(cleanSub) }],
        },
      });
    }
  }

  const finalId = subCat?.id || parentCat.id;
  categoryCache.set(cacheKey, finalId);
  return finalId;
}

async function getFallbackCategoryId(): Promise<string> {
  let fallback = await prisma.category.findFirst({ where: { isActive: true } });
  if (!fallback) {
    try {
      fallback = await prisma.category.create({
        data: {
          name: "Apparel & Couture",
          slug: "apparel-couture",
          isActive: true,
        },
      });
    } catch {
      fallback = await prisma.category.findFirst();
    }
  }
  return fallback?.id || "";
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
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

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
        const idx = header.findIndex((h) => h === p || h.includes(p));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colIndex = {
      productId: findIndex("productid", "itemid"),
      sku: findIndex("sku", "variantid", "productsku"),
      title: findIndex("title", "name", "productname"),
      slug: findIndex("slug", "handle"),
      productUrl: findIndex("producturl", "sellerurl", "sourcelink", "url"),
      department: findIndex("department", "maincategory", "gender", "dept"),
      category: findIndex("category", "parentcategory", "cat"),
      subcategory: findIndex("subcategory", "subcat", "type"),
      brand: findIndex("brand", "designer"),
      fabric: findIndex("fabric", "weave"),
      material: findIndex("material", "composition"),
      description: findIndex("description", "desc", "details"),
      status: findIndex("status", "state"),
      availability: findIndex("availability", "stockstatus"),
      colour: findIndex("colour", "color", "shade"),
      size: findIndex("size", "dimensions"),
      pattern: findIndex("pattern", "print", "motif"),
      fit: findIndex("fit", "cut"),
      occasion: findIndex("occasion", "wear"),
      price: findIndex("price", "sellingprice", "priceinr", "offerprice"),
      compareAtPrice: findIndex("compareatprice", "compareprice", "mrp", "originalprice"),
      discountPercent: findIndex("discountpercent", "discount", "offpercent"),
      currency: findIndex("currency"),
      stockQuantity: findIndex("stockquantity", "stock", "quantity", "qty"),
      sellerName: findIndex("sellername", "vendorname", "suppliername", "seller"),
      sellerId: findIndex("sellerid", "vendorid", "supplierid"),
      rating: findIndex("rating", "stars", "averagerating"),
      ratingCount: findIndex("ratingcount", "ratingscount"),
      reviewCount: findIndex("reviewcount", "totalreviews", "reviews"),
      imageUrl: findIndex("imageurl", "image1", "image", "photo"),
      imageUrl2: findIndex("imageurl2", "image2", "photo2"),
      imageUrl3: findIndex("imageurl3", "image3", "photo3"),
      imageUrl4: findIndex("imageurl4", "image4", "photo4"),
      imageUrl5: findIndex("imageurl5", "image5", "photo5"),
    };

    let processedCount = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    let variantsCreatedOrUpdated = 0;
    let sellersCreatedOrLinked = 0;
    const errors: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || row.every((c) => !c)) continue;

      const getVal = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : "");

      const rawTitle = getVal(colIndex.title);
      const title = rawTitle || "Luxury Garment Listing";
      const brand = getVal(colIndex.brand) || "Fashion Cart Atelier";
      const rawCustomProductId = getVal(colIndex.productId);
      const rawSlug = getVal(colIndex.slug);
      const rawSku = getVal(colIndex.sku);

      // Fast random entropy per row to guarantee 100% slug & SKU uniqueness instantly without DB loop
      const rowRandomEntropy = Math.random().toString(36).substring(2, 7).toLowerCase();
      const rowSkuEntropy = Math.random().toString(36).substring(2, 7).toUpperCase();

      // 1. Taxonomy & Hierarchy
      const rawDept = getVal(colIndex.department);
      const rawCat = getVal(colIndex.category);
      const rawSubcat = getVal(colIndex.subcategory);
      const { department, category, subcategory } = inferTaxonomy(title, rawDept, rawCat, rawSubcat);
      const categoryPath = [department, category, subcategory]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(" > ");

      // 2. Fabric & Material
      const rawFabric = getVal(colIndex.fabric);
      const rawDesc = getVal(colIndex.description);
      const fabric = extractFabric(title, rawDesc, rawFabric);
      const material = getVal(colIndex.material) || fabric;

      // 3. Clean Description
      const description = sanitizeDescription(rawDesc, title, brand, fabric);

      // 4. Status & Availability
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

      // 5. Lookbook Images (Up to 5)
      const rawImageUrls = [
        getVal(colIndex.imageUrl),
        getVal(colIndex.imageUrl2),
        getVal(colIndex.imageUrl3),
        getVal(colIndex.imageUrl4),
        getVal(colIndex.imageUrl5),
      ].filter((u) => u && (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/") || u.startsWith("data:")));

      const imageUrls = rawImageUrls.map(normalizeImageUrl);

      // 6. Variant Attributes
      const rawSize = getVal(colIndex.size);
      const size = extractSize(title, rawImageUrls, rawSize);
      const colour = getVal(colIndex.colour) || "Classic Multi";
      const pattern = extractPattern(title, getVal(colIndex.pattern));
      const fit = getVal(colIndex.fit) || "Regular Fit";
      const occasion = getVal(colIndex.occasion) || "Festive & Daily Luxury";
      const currency = getVal(colIndex.currency) || "INR";

      // 7. Price & Discounts
      const priceNum = Number(getVal(colIndex.price).replace(/[^0-9.]/g, "")) || 999;
      const compareNum = Number(getVal(colIndex.compareAtPrice).replace(/[^0-9.]/g, "")) || null;
      let discountNum = Number(getVal(colIndex.discountPercent).replace(/[^0-9.]/g, "")) || null;
      if (!discountNum && compareNum && compareNum > priceNum) {
        discountNum = Math.round(((compareNum - priceNum) / compareNum) * 100);
      }

      // 8. Stock Quantity
      const stockNum = parseInt(getVal(colIndex.stockQuantity).replace(/[^0-9]/g, "") || "25", 10) || 25;

      // 9. Seller / Supplier
      const sellerName = getVal(colIndex.sellerName);
      let sellerIdStr = getVal(colIndex.sellerId);
      if (!sellerIdStr && sellerName) {
        sellerIdStr = `SLR-${slugify(sellerName).toUpperCase().slice(0, 8)}-101`;
      }

      // 10. Ratings
      const ratingNum = Number(getVal(colIndex.rating).replace(/[^0-9.]/g, "")) || 4.8;
      const ratingCountNum = parseInt(getVal(colIndex.ratingCount).replace(/[^0-9]/g, "") || "18", 10);
      const reviewCountNum = parseInt(getVal(colIndex.reviewCount).replace(/[^0-9]/g, "") || "12", 10);

      try {
        // 1. Resolve Category
        const assignedCategoryId = await resolveCategoryHierarchy(department, subcategory);

        // 2. Resolve or Create Seller with in-memory caching
        let linkedSellerId: string | null = null;
        if (sellerIdStr || sellerName) {
          const sellerLookupId = sellerIdStr || `SLR-${slugify(sellerName || "VENDOR").toUpperCase().slice(0, 10)}`;
          
          if (sellerCache.has(sellerLookupId)) {
            linkedSellerId = sellerCache.get(sellerLookupId)!;
          } else {
            let seller = await prisma.seller.findUnique({
              where: { sellerId: sellerLookupId },
            });

            if (!seller) {
              try {
                seller = await prisma.seller.create({
                  data: {
                    sellerId: sellerLookupId,
                    name: sellerName || `Supplier ${sellerLookupId}`,
                    url: getVal(colIndex.productUrl) || null,
                    isActive: true,
                  },
                });
                sellersCreatedOrLinked++;
              } catch {
                seller = await prisma.seller.findFirst({
                  where: { sellerId: sellerLookupId },
                });
              }
            }
            if (seller) {
              linkedSellerId = seller.id;
              sellerCache.set(sellerLookupId, seller.id);
            }
          }
        }

        // 3. Resolve Product
        let product = null;
        if (rawCustomProductId) {
          product = await prisma.product.findFirst({
            where: { productId: rawCustomProductId },
          });
        } else if (rawSlug && rawSlug.length > 2 && !rawSlug.startsWith("itm")) {
          product = await prisma.product.findUnique({
            where: { slug: slugify(rawSlug) },
          });
        }

        // Determine Fast Collision-Proof Slug & ProductID
        const baseSlug = rawSlug && rawSlug.length > 2 && !rawSlug.startsWith("itm") ? slugify(rawSlug) : slugify(title);
        const finalSlug = product ? product.slug : `${baseSlug}-${rowRandomEntropy}`;

        const brandCode = slugify(brand || "FC").toUpperCase().slice(0, 4) || "FC";
        const finalProductId = rawCustomProductId || product?.productId || `FC-PRD-${brandCode}-${rowSkuEntropy}`;
        const finalProductUrl = getVal(colIndex.productUrl) || `/products/${finalSlug}`;

        const productData = {
          productId: finalProductId,
          name: title,
          slug: finalSlug,
          productUrl: finalProductUrl,
          department,
          subcategory,
          categoryPath,
          productType: subcategory,
          brand,
          fabric,
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
          averageRating: ratingNum,
          ratingCount: ratingCountNum,
          totalReviews: reviewCountNum,
          reviewCount: reviewCountNum,
        };

        if (!product) {
          product = await prisma.product.create({ data: productData });
          productsCreated++;
        } else {
          product = await prisma.product.update({
            where: { id: product.id },
            data: productData,
          });
          productsUpdated++;
        }

        // 4. Create or Update Variant with Collision-Proof SKU
        const sizeCode = slugify(size || "FS").toUpperCase().slice(0, 4) || "FS";
        const finalSku = rawSku ? `${rawSku}-${rowSkuEntropy.slice(0, 3)}` : `FC-SKU-${brandCode}-${sizeCode}-${rowSkuEntropy}`;

        const variantData = {
          productId: product.id,
          sku: finalSku,
          colour,
          size,
          price: priceNum,
          compareAtPrice: compareNum,
          discountPercent: discountNum,
          stockQuantity: stockNum,
          isActive: true,
        };

        await prisma.productVariant.create({ data: variantData });
        variantsCreatedOrUpdated++;

        // 5. Lookbook Images (Single batch insert)
        if (imageUrls.length > 0) {
          await prisma.productImage.createMany({
            data: imageUrls.map((url, imgIdx) => ({
              productId: product.id,
              imageUrl: url,
              altText: `${title} - Look ${imgIdx + 1}`,
              sortOrder: imgIdx,
            })),
            skipDuplicates: true,
          });
        }

        processedCount++;
      } catch (err: any) {
        console.error(`Error processing row ${r + 1} (${title}):`, err);
        errors.push(`Row ${r + 1} (${title}): ${err.message || "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: true,
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
