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

  if (!subcategory) {
    if (t.includes("saree") || t.includes("sari")) {
      subcategory = "Sarees";
    } else if (t.includes("kurta") || t.includes("kurti") || t.includes("ethnic set") || t.includes("dupatta set")) {
      subcategory = "Kurtas & Sets";
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

// Robust CSV row parser handling quoted text with commas and escaped quotes
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
      // If slug collision or race condition, retrieve the existing category
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

      const customProductId = getVal(colIndex.productId);
      const rawTitle = getVal(colIndex.title);
      const title = rawTitle || "Luxury Garment Listing";

      // Calculate clean slug
      let rawSlug = getVal(colIndex.slug);
      let slug = rawSlug && rawSlug.length > 2 ? slugify(rawSlug) : slugify(title);
      if (!slug || slug.length < 2) {
        slug = `garment-${Date.now()}-${r}`;
      }

      const productUrl = getVal(colIndex.productUrl);

      // Infer Taxonomy if empty in CSV
      const rawDept = getVal(colIndex.department);
      const rawCat = getVal(colIndex.category);
      const rawSubcat = getVal(colIndex.subcategory);
      const { department, category, subcategory } = inferTaxonomy(title, rawDept, rawCat, rawSubcat);
      const categoryPath = [department, category, subcategory]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(" > ");

      const brand = getVal(colIndex.brand) || "Fashion Cart Atelier";
      const fabric = getVal(colIndex.fabric) || "Pure Fabric";
      const material = getVal(colIndex.material) || fabric;

      // Sanitize Description: Clean out Flipkart / third-party noise
      const rawDescription = getVal(colIndex.description);
      const description = sanitizeDescription(rawDescription, title, brand, fabric);

      const statusRaw = getVal(colIndex.status).toUpperCase();
      const status: ProductStatus =
        statusRaw === "DRAFT"
          ? ProductStatus.DRAFT
          : statusRaw === "ARCHIVED"
          ? ProductStatus.ARCHIVED
          : ProductStatus.ACTIVE;
      const availability = getVal(colIndex.availability) || "IN_STOCK";

      // Variant Attributes
      const sku = getVal(colIndex.sku) || `FC-SKU-${slug.slice(0, 10).toUpperCase()}-${r}`;
      const colour = getVal(colIndex.colour) || "Classic";
      const size = getVal(colIndex.size) || "Free Size";
      const pattern = getVal(colIndex.pattern) || "Solid";
      const fit = getVal(colIndex.fit) || "Regular Fit";
      const occasion = getVal(colIndex.occasion) || "Festive & Casual";
      const currency = getVal(colIndex.currency) || "INR";

      const priceNum = Number(getVal(colIndex.price).replace(/[^0-9.]/g, "")) || 999;
      const compareNum = Number(getVal(colIndex.compareAtPrice).replace(/[^0-9.]/g, "")) || null;
      let discountNum = Number(getVal(colIndex.discountPercent).replace(/[^0-9.]/g, "")) || null;
      if (!discountNum && compareNum && compareNum > priceNum) {
        discountNum = Math.round(((compareNum - priceNum) / compareNum) * 100);
      }

      const stockNum = parseInt(getVal(colIndex.stockQuantity).replace(/[^0-9]/g, "") || "25", 10);

      // Seller / Supplier details (Admin Confidential)
      const sellerName = getVal(colIndex.sellerName);
      const sellerIdStr = getVal(colIndex.sellerId);

      // Ratings & reviews
      const ratingNum = Number(getVal(colIndex.rating).replace(/[^0-9.]/g, "")) || 4.8;
      const ratingCountNum = parseInt(getVal(colIndex.ratingCount).replace(/[^0-9]/g, "") || "18", 10);
      const reviewCountNum = parseInt(getVal(colIndex.reviewCount).replace(/[^0-9]/g, "") || "12", 10);

      // Images (up to 5 lookbook URLs)
      const imageUrls = [
        getVal(colIndex.imageUrl),
        getVal(colIndex.imageUrl2),
        getVal(colIndex.imageUrl3),
        getVal(colIndex.imageUrl4),
        getVal(colIndex.imageUrl5),
      ].filter((u) => u && (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/")));

      try {
        // 1. Resolve Category Hierarchy safely
        const assignedCategoryId = await resolveCategoryHierarchy(department, subcategory);

        // 2. Resolve or Create Seller / Supplier
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
          productId: customProductId || null,
          name: title,
          slug: product ? product.slug : slug,
          productUrl: productUrl || null,
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

        // 5. Upsert Images (Up to 5 lookbook photos)
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
                altText: `${title} - View ${imgIdx + 1}`,
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
