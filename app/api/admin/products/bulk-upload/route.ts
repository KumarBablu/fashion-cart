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

    // Fallback default category
    let defaultCategory = await prisma.category.findFirst({ where: { isActive: true } });
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: "Apparel & Couture",
          slug: "apparel-couture",
          isActive: true,
        },
      });
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || row.every((c) => !c)) continue;

      const getVal = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : "");

      const customProductId = getVal(colIndex.productId);
      const title = getVal(colIndex.title) || "Luxury Fashion Item";
      let slug = getVal(colIndex.slug) || slugify(title);
      if (!slug) slug = `garment-${Date.now()}-${r}`;

      const productUrl = getVal(colIndex.productUrl);
      const deptName = getVal(colIndex.department) || getVal(colIndex.category) || "Women";
      const catName = getVal(colIndex.category) || deptName;
      const subcatName = getVal(colIndex.subcategory) || "Sarees";
      const categoryPath = [deptName, catName, subcatName]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(" > ");

      const brand = getVal(colIndex.brand) || "Fashion Cart Atelier";
      const fabric = getVal(colIndex.fabric) || "Pure Fabric";
      const material = getVal(colIndex.material) || fabric;
      const description = getVal(colIndex.description) || `${title} crafted with premium ${fabric}.`;
      const statusRaw = getVal(colIndex.status).toUpperCase();
      const status: ProductStatus =
        statusRaw === "DRAFT"
          ? ProductStatus.DRAFT
          : statusRaw === "ARCHIVED"
          ? ProductStatus.ARCHIVED
          : ProductStatus.ACTIVE;
      const availability = getVal(colIndex.availability) || "IN_STOCK";

      const sku = getVal(colIndex.sku) || `FC-SKU-${slug.slice(0, 8).toUpperCase()}-${r}`;
      const colour = getVal(colIndex.colour) || "Classic";
      const size = getVal(colIndex.size) || "Free Size";
      const pattern = getVal(colIndex.pattern) || "Solid";
      const fit = getVal(colIndex.fit) || "Regular Fit";
      const occasion = getVal(colIndex.occasion) || "Festive & Casual";
      const currency = getVal(colIndex.currency) || "INR";

      const priceNum = Number(getVal(colIndex.price).replace(/[^0-9.]/g, "")) || 1499;
      const compareNum = Number(getVal(colIndex.compareAtPrice).replace(/[^0-9.]/g, "")) || null;
      let discountNum = Number(getVal(colIndex.discountPercent).replace(/[^0-9.]/g, "")) || null;
      if (!discountNum && compareNum && compareNum > priceNum) {
        discountNum = Math.round(((compareNum - priceNum) / compareNum) * 100);
      }

      const stockNum = parseInt(getVal(colIndex.stockQuantity).replace(/[^0-9]/g, "") || "25", 10);

      // Seller / Supplier details (Admin Only)
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
        // 1. Resolve or Create Category Hierarchy
        let assignedCategoryId = defaultCategory.id;

        if (deptName) {
          let parentCat = await prisma.category.findFirst({
            where: {
              OR: [{ name: { equals: deptName, mode: "insensitive" } }, { slug: slugify(deptName) }],
              parentId: null,
            },
          });

          if (!parentCat) {
            parentCat = await prisma.category.create({
              data: {
                name: deptName,
                slug: slugify(deptName),
                isActive: true,
                parentId: null,
              },
            });
          }

          assignedCategoryId = parentCat.id;

          if (subcatName) {
            let subCat = await prisma.category.findFirst({
              where: {
                OR: [{ name: { equals: subcatName, mode: "insensitive" } }, { slug: slugify(subcatName) }],
                parentId: parentCat.id,
              },
            });

            if (!subCat) {
              subCat = await prisma.category.create({
                data: {
                  name: subcatName,
                  slug: `${slugify(deptName)}-${slugify(subcatName)}`,
                  isActive: true,
                  parentId: parentCat.id,
                },
              });
            }

            assignedCategoryId = subCat.id;
          }
        }

        // 2. Resolve or Create Seller / Supplier (Admin Confidential Entity)
        let linkedSellerId: string | null = null;
        if (sellerIdStr || sellerName) {
          const sellerLookupId = sellerIdStr || `SLR-${slugify(sellerName || "VENDOR").toUpperCase().slice(0, 10)}`;
          let seller = await prisma.seller.findUnique({
            where: { sellerId: sellerLookupId },
          });

          if (!seller) {
            seller = await prisma.seller.create({
              data: {
                sellerId: sellerLookupId,
                name: sellerName || `Supplier ${sellerLookupId}`,
                url: productUrl || null,
                isActive: true,
              },
            });
            sellersCreatedOrLinked++;
          }
          linkedSellerId = seller.id;
        }

        // 3. Upsert Product
        let product = await prisma.product.findUnique({ where: { slug } });
        const productData = {
          productId: customProductId || null,
          name: title,
          slug,
          productUrl: productUrl || null,
          department: deptName,
          subcategory: subcatName,
          categoryPath,
          productType: subcatName,
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

        // 4. Upsert ProductVariant
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

        // 5. Upsert Images (Up to 5 images)
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
