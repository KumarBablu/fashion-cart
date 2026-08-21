import { NextRequest, NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

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

  // If the description became empty or too short after cleaning, provide an elegant description
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

  if (combined.includes("free size") || combined.includes("free-size") || combined.includes("saree") || combined.includes("sari")) {
    return "Free Size";
  }

  return "Free Size";
}

// Auto-extracts pattern from title or description
function extractPattern(title: string, rawPattern?: string): string {
  if (rawPattern && rawPattern.trim()) return rawPattern.trim();
  const t = title.toLowerCase();

  if (t.includes("floral")) return "Floral Print";
  if (t.includes("printed") || t.includes("print")) return "Artisan Print";
  if (t.includes("solid") || t.includes("plain")) return "Solid / Plain";
  if (t.includes("embroidered") || t.includes("mirror work") || t.includes("zari")) return "Embroidered Zari";
  if (t.includes("striped") || t.includes("stripe")) return "Striped";
  if (t.includes("checked") || t.includes("check")) return "Checks";
  if (t.includes("bandhani") || t.includes("tie dye")) return "Bandhani Tie-Dye";

  return "Contemporary";
}

// Infers department and subcategory if empty in CSV
function inferTaxonomy(title: string, dept?: string, cat?: string, subcat?: string) {
  const t = title.toLowerCase();

  let department = dept?.trim() || "";
  let subcategory = subcat?.trim() || cat?.trim() || "";

  if (!department) {
    if (t.includes("men") && !t.includes("women")) {
      department = "Men";
    } else if (t.includes("kid") || t.includes("boy") || t.includes("girl")) {
      department = "Kids";
    } else if (t.includes("footwear") || t.includes("mojari") || t.includes("shoe") || t.includes("sandal")) {
      department = "Footwear";
    } else {
      department = "Women";
    }
  }

  if (!subcategory || subcategory.toLowerCase() === "kurta") {
    if (t.includes("saree") || t.includes("sari")) {
      subcategory = "Sarees";
    } else if (t.includes("dupatta set") || t.includes("pant set") || t.includes("kurta set")) {
      subcategory = "Kurta Sets";
    } else if (t.includes("kurta") || t.includes("kurti")) {
      subcategory = "Kurtas & Tunics";
    } else if (t.includes("anarkali") || t.includes("dress") || t.includes("gown") || t.includes("lehenga")) {
      subcategory = "Dresses & Gowns";
    } else if (t.includes("shirt")) {
      subcategory = "Shirts";
    } else if (t.includes("pant") || t.includes("trouser") || t.includes("jeans") || t.includes("bottom")) {
      subcategory = "Trousers & Bottoms";
    } else if (t.includes("mojari") || t.includes("shoe") || t.includes("footwear")) {
      subcategory = "Ethnic Footwear";
    } else {
      subcategory = "Ethnic Wear";
    }
  }

  const category = cat?.trim() || subcategory;
  return { department, category, subcategory };
}

// Cloaks third-party image URLs through our internal proxy so source domains are hidden from shoppers
function cloakImageUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return "";
  const clean = rawUrl.trim();

  // If already relative, data URL, or internal proxy URL, keep as is
  if (clean.startsWith("/") || clean.startsWith("data:") || clean.includes("/api/proxy-image")) {
    return clean;
  }

  // Cloak external marketplace domains (Flipkart, Amazon, etc.) through our internal proxy
  if (
    clean.includes("flixcart.com") ||
    clean.includes("amazon.com") ||
    clean.includes("media-amazon.com") ||
    clean.includes("myntassets.com") ||
    clean.includes("ajio.com") ||
    clean.includes("meesho.com")
  ) {
    return `/api/proxy-image?url=${encodeURIComponent(clean)}`;
  }

  return clean;
}

// Simple robust CSV row parser handling quoted text with commas and escaped quotes
function parseCsvRows(text: string): string[][] {
  const lines: string[][] = [];
  const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  for (const rawLine of rawLines) {
    const row: string[] = [];
    let insideQuotes = false;
    let current = "";

    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      if (char === '"') {
        if (insideQuotes && rawLine[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    lines.push(row);
  }

  return lines;
}

// Bulletproof Category Hierarchy Resolver - Guaranteed to never throw unique constraint error
async function resolveCategoryHierarchy(deptName: string, subcatName: string): Promise<string> {
  const cleanDept = deptName.trim() || "Women";
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

  if (!cleanSubcatName(subcatName) || !parentCat) {
    return parentCat?.id || (await getFallbackCategoryId());
  }

  // 2. Find or create Subcategory under Parent
  const cleanSub = subcatName.trim();
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

  return subCat?.id || parentCat.id;
}

function cleanSubcatName(s: string) {
  return s && s.trim().length > 0;
}

async function getFallbackCategoryId(): Promise<string> {
  let fallback = await prisma.category.findFirst({ where: { isActive: true } });
  if (!fallback) {
    fallback = await prisma.category.create({
      data: {
        name: "Apparel & Couture",
        slug: "apparel-couture",
        isActive: true,
      },
    });
  }
  return fallback.id;
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

      // 1. Slug calculation: Auto-create if empty or starts with item code
      let rawSlug = getVal(colIndex.slug);
      let slug = rawSlug && rawSlug.length > 2 && !rawSlug.startsWith("itm") ? slugify(rawSlug) : slugify(title);
      if (!slug || slug.length < 2) {
        slug = `garment-${Date.now()}-${r}`;
      }

      // 2. ProductID: Auto-create if empty
      let customProductId = getVal(colIndex.productId);
      if (!customProductId) {
        const brandCode = slugify(brand || "FC").toUpperCase().slice(0, 4) || "FC";
        customProductId = `FC-PRD-${brandCode}-${r.toString().padStart(4, "0")}`;
      }

      // 3. ProductURL: Auto-create if empty
      let productUrl = getVal(colIndex.productUrl);
      if (!productUrl) {
        productUrl = `/products/${slug}`;
      }

      // 4. Infer Taxonomy & Category Hierarchy
      const rawDept = getVal(colIndex.department);
      const rawCat = getVal(colIndex.category);
      const rawSubcat = getVal(colIndex.subcategory);
      const { department, category, subcategory } = inferTaxonomy(title, rawDept, rawCat, rawSubcat);
      const categoryPath = [department, category, subcategory]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(" > ");

      // 5. Fabric & Material: Auto-extract if empty
      const rawFabric = getVal(colIndex.fabric);
      const rawDesc = getVal(colIndex.description);
      const fabric = extractFabric(title, rawDesc, rawFabric);
      const material = getVal(colIndex.material) || fabric;

      // 6. Sanitize Description: Clean out Flipkart / third-party noise
      const description = sanitizeDescription(rawDesc, title, brand, fabric);

      // 7. Status & Availability: Normalize
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

      // 8. Raw Images (up to 5 lookbook URLs) & Cloaking
      const rawImageUrls = [
        getVal(colIndex.imageUrl),
        getVal(colIndex.imageUrl2),
        getVal(colIndex.imageUrl3),
        getVal(colIndex.imageUrl4),
        getVal(colIndex.imageUrl5),
      ].filter((u) => u && (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/")));

      const imageUrls = rawImageUrls.map(cloakImageUrl);

      // 9. Variant Attributes: Auto-extract Size, Pattern, Fit
      const rawSize = getVal(colIndex.size);
      const size = extractSize(title, rawImageUrls, rawSize);
      const colour = getVal(colIndex.colour) || "Classic Multi";
      const pattern = extractPattern(title, getVal(colIndex.pattern));
      const fit = getVal(colIndex.fit) || "Regular Fit";
      const occasion = getVal(colIndex.occasion) || "Festive & Daily Luxury";
      const currency = getVal(colIndex.currency) || "INR";

      // 10. SKU: Auto-create if empty
      let sku = getVal(colIndex.sku);
      if (!sku) {
        const brandCode = slugify(brand || "FC").toUpperCase().slice(0, 4) || "FC";
        sku = `FC-SKU-${brandCode}-${slug.slice(0, 8).toUpperCase()}-${slugify(size).toUpperCase()}-${r}`;
      }

      // 11. Price & Discounts
      const priceNum = Number(getVal(colIndex.price).replace(/[^0-9.]/g, "")) || 999;
      const compareNum = Number(getVal(colIndex.compareAtPrice).replace(/[^0-9.]/g, "")) || null;
      let discountNum = Number(getVal(colIndex.discountPercent).replace(/[^0-9.]/g, "")) || null;
      if (!discountNum && compareNum && compareNum > priceNum) {
        discountNum = Math.round(((compareNum - priceNum) / compareNum) * 100);
      }

      // 12. Stock Quantity: Default to 25 if empty
      const stockNum = parseInt(getVal(colIndex.stockQuantity).replace(/[^0-9]/g, "") || "25", 10) || 25;

      // 13. Seller / Supplier details: Auto-generate SellerID if empty
      const sellerName = getVal(colIndex.sellerName);
      let sellerIdStr = getVal(colIndex.sellerId);
      if (!sellerIdStr && sellerName) {
        sellerIdStr = `SLR-${slugify(sellerName).toUpperCase().slice(0, 8)}-101`;
      }

      // 14. Ratings & reviews
      const ratingNum = Number(getVal(colIndex.rating).replace(/[^0-9.]/g, "")) || 4.8;
      const ratingCountNum = parseInt(getVal(colIndex.ratingCount).replace(/[^0-9]/g, "") || "18", 10);
      const reviewCountNum = parseInt(getVal(colIndex.reviewCount).replace(/[^0-9]/g, "") || "12", 10);

      try {
        // 1. Resolve Category Hierarchy safely
        const assignedCategoryId = await resolveCategoryHierarchy(department, subcategory);

        // 2. Resolve or Create Seller / Supplier (Admin Confidential Entity)
        let linkedSellerId: string | null = null;
        if (sellerIdStr || sellerName) {
          const sellerLookupId = sellerIdStr || `SLR-${slugify(sellerName || "VENDOR").toUpperCase().slice(0, 10)}`;
          let seller = await prisma.seller.findUnique({
            where: { sellerId: sellerLookupId },
          });

          if (!seller) {
            try {
              seller = await prisma.seller.create({
                data: {
                  sellerId: sellerLookupId,
                  name: sellerName || `Supplier ${sellerLookupId}`,
                  url: productUrl || null,
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
          }
        }

        // 3. Upsert Product by slug or name
        let product = await prisma.product.findFirst({
          where: {
            OR: [
              { slug },
              { name: { equals: title, mode: "insensitive" } },
              ...(customProductId ? [{ productId: customProductId }] : []),
            ],
          },
        });

        const productData = {
          productId: customProductId,
          name: title,
          slug: product ? product.slug : slug,
          productUrl,
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
          sellerUrl: productUrl || null,
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

        // 4. Upsert ProductVariant by SKU
        const existingVariant = await prisma.productVariant.findUnique({ where: { sku } });
        const variantData = {
          productId: product.id,
          sku,
          colour,
          size,
          price: priceNum,
          compareAtPrice: compareNum,
          discountPercent: discountNum,
          stockQuantity: stockNum,
          isActive: true,
        };

        if (existingVariant) {
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: variantData,
          });
        } else {
          await prisma.productVariant.create({ data: variantData });
        }
        variantsCreatedOrUpdated++;

        // 5. Upsert Cloaked Lookbook Images (Up to 5 photos)
        for (let imgIdx = 0; imgIdx < imageUrls.length; imgIdx++) {
          const imgUrl = imageUrls[imgIdx];
          const imgExists = await prisma.productImage.findFirst({
            where: { productId: product.id, imageUrl: imgUrl },
          });

          if (!imgExists) {
            await prisma.productImage.create({
              data: {
                productId: product.id,
                imageUrl: imgUrl,
                altText: `${title} - Look ${imgIdx + 1}`,
                sortOrder: imgIdx,
              },
            });
          }
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
