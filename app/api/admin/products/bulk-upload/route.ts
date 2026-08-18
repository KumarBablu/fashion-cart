import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Simple robust CSV row parser handling quoted commas
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

    // Header matching (lowercase)
    const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const colIndex = {
      title: header.findIndex((h) => h.includes("title") || h.includes("name")),
      slug: header.findIndex((h) => h.includes("slug")),
      department: header.findIndex((h) => h.includes("department") || h.includes("maincat")),
      subcategory: header.findIndex((h) => h.includes("subcat") || h.includes("category")),
      brand: header.findIndex((h) => h.includes("brand")),
      fabric: header.findIndex((h) => h.includes("fabric") || h.includes("material")),
      description: header.findIndex((h) => h.includes("desc")),
      status: header.findIndex((h) => h.includes("status")),
      sku: header.findIndex((h) => h.includes("sku")),
      colour: header.findIndex((h) => h.includes("colour") || h.includes("color")),
      size: header.findIndex((h) => h.includes("size")),
      price: header.findIndex((h) => h === "price" || h.includes("sellingprice") || h.includes("priceinr")),
      compareAtPrice: header.findIndex((h) => h.includes("compare") || h.includes("mrp") || h.includes("original")),
      stockQuantity: header.findIndex((h) => h.includes("stock") || h.includes("quantity") || h.includes("qty")),
      imageUrl: header.findIndex((h) => h.includes("image") || h.includes("img") || h.includes("photo")),
    };

    let processedCount = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    let variantsCreatedOrUpdated = 0;
    const errors: string[] = [];

    // Fallback default category
    let defaultCategory = await prisma.category.findFirst({ where: { isActive: true } });
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: "General Apparel",
          slug: "general-apparel",
          isActive: true,
        },
      });
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || row.every((c) => !c)) continue;

      const title = (colIndex.title >= 0 ? row[colIndex.title] : "") || "Untitled Garment";
      let slug = (colIndex.slug >= 0 ? row[colIndex.slug] : "") || slugify(title);
      if (!slug) slug = `garment-${Date.now()}-${r}`;

      const deptName = (colIndex.department >= 0 ? row[colIndex.department] : "").trim();
      const subcatName = (colIndex.subcategory >= 0 ? row[colIndex.subcategory] : "").trim();
      const brand = (colIndex.brand >= 0 ? row[colIndex.brand] : "").trim() || "Fashion Cart Atelier";
      const fabric = (colIndex.fabric >= 0 ? row[colIndex.fabric] : "").trim() || "Pure Fabric";
      const description = (colIndex.description >= 0 ? row[colIndex.description] : "").trim() || "";
      const statusRaw = (colIndex.status >= 0 ? row[colIndex.status] : "").toUpperCase();
      const status = statusRaw === "DRAFT" || statusRaw === "ARCHIVED" ? statusRaw : "ACTIVE";

      const sku = (colIndex.sku >= 0 ? row[colIndex.sku] : "").trim() || `FC-SKU-${slug.slice(0, 8).toUpperCase()}-${r}`;
      const colour = (colIndex.colour >= 0 ? row[colIndex.colour] : "").trim() || "Classic";
      const size = (colIndex.size >= 0 ? row[colIndex.size] : "").trim() || "Free Size";
      const priceNum = Number(colIndex.price >= 0 ? row[colIndex.price].replace(/[^0-9.]/g, "") : "") || 999;
      const compareNum = Number(colIndex.compareAtPrice >= 0 ? row[colIndex.compareAtPrice].replace(/[^0-9.]/g, "") : "") || null;
      const stockNum = parseInt(colIndex.stockQuantity >= 0 ? row[colIndex.stockQuantity].replace(/[^0-9]/g, "") : "10", 10) || 0;
      const imageUrl = (colIndex.imageUrl >= 0 ? row[colIndex.imageUrl] : "").trim();

      try {
        // Resolve or create category hierarchy
        let assignedCategoryId = defaultCategory.id;

        if (deptName) {
          let deptCat = await prisma.category.findFirst({
            where: {
              OR: [{ name: { equals: deptName, mode: "insensitive" } }, { slug: slugify(deptName) }],
              parentId: null,
            },
          });

          if (!deptCat) {
            deptCat = await prisma.category.create({
              data: {
                name: deptName,
                slug: slugify(deptName),
                isActive: true,
                parentId: null,
              },
            });
          }

          assignedCategoryId = deptCat.id;

          if (subcatName) {
            let subCat = await prisma.category.findFirst({
              where: {
                OR: [{ name: { equals: subcatName, mode: "insensitive" } }, { slug: slugify(subcatName) }],
                parentId: deptCat.id,
              },
            });

            if (!subCat) {
              subCat = await prisma.category.create({
                data: {
                  name: subcatName,
                  slug: slugify(subcatName),
                  isActive: true,
                  parentId: deptCat.id,
                },
              });
            }

            assignedCategoryId = subCat.id;
          }
        } else if (subcatName) {
          let cat = await prisma.category.findFirst({
            where: {
              OR: [{ name: { equals: subcatName, mode: "insensitive" } }, { slug: slugify(subcatName) }],
            },
          });
          if (!cat) {
            cat = await prisma.category.create({
              data: {
                name: subcatName,
                slug: slugify(subcatName),
                isActive: true,
              },
            });
          }
          assignedCategoryId = cat.id;
        }

        // Upsert Product by slug
        let product = await prisma.product.findUnique({ where: { slug } });
        if (!product) {
          product = await prisma.product.create({
            data: {
              name: title,
              slug,
              brand,
              fabric,
              description,
              status,
              categoryId: assignedCategoryId,
              averageRating: 4.8,
              totalReviews: 12,
            },
          });
          productsCreated++;
        } else {
          product = await prisma.product.update({
            where: { id: product.id },
            data: {
              name: title,
              brand,
              fabric,
              description: description || product.description,
              status,
              categoryId: assignedCategoryId,
            },
          });
          productsUpdated++;
        }

        // Upsert Variant by SKU
        const existingVariant = await prisma.productVariant.findUnique({ where: { sku } });
        if (existingVariant) {
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              productId: product.id,
              colour,
              size,
              price: priceNum,
              compareAtPrice: compareNum,
              stockQuantity: stockNum,
              isActive: true,
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku,
              colour,
              size,
              price: priceNum,
              compareAtPrice: compareNum,
              stockQuantity: stockNum,
              isActive: true,
            },
          });
        }
        variantsCreatedOrUpdated++;

        // Add Image if present
        if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/"))) {
          const imgExists = await prisma.productImage.findFirst({
            where: { productId: product.id, imageUrl },
          });
          if (!imgExists) {
            await prisma.productImage.create({
              data: {
                productId: product.id,
                imageUrl,
                altText: title,
                sortOrder: 0,
              },
            });
          }
        }

        processedCount++;
      } catch (err: any) {
        console.error(`Error processing row ${r + 1}:`, err);
        errors.push(`Row ${r + 1} (${title}): ${err.message || "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: true,
      processedRows: processedCount,
      productsCreated,
      productsUpdated,
      variantsCreatedOrUpdated,
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
