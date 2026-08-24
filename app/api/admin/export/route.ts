import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

function convertToCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escapeCsv = (val: string | number | boolean | null | undefined) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCsv).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsv).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") || "products";
  const storeParam = req.nextUrl.searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const isJewellery = storeParam.toLowerCase().includes("jewel") || type.includes("jewellery");
  const activeStore = isJewellery ? "jewellery" : "garments";
  const db = getDb(activeStore);
  const timestamp = new Date().toISOString().split("T")[0];

  try {
    switch (type) {
      case "jewellery-template": {
        const headers = [
          "ProductID",
          "SKU",
          "Title",
          "Slug",
          "ProductURL",
          "Department",
          "Category",
          "Subcategory",
          "CategoryPath",
          "ProductType",
          "NetQty",
          "MaterialType",
          "ClosureType",
          "ColourName",
          "Shape",
          "KeyFeatures",
          "Gender",
          "Occasion",
          "DesignType",
          "GemType",
          "Plating",
          "MetalType",
          "Gift",
          "Brand",
          "Description",
          "Status",
          "Availability",
          "Price",
          "CompareAtPrice",
          "DiscountPercent",
          "DiscountAmount",
          "Currency",
          "StockQuantity",
          "Rating",
          "RatingCount",
          "ReviewCount",
          "ImageURL",
          "ImageURL2",
          "ImageURL3",
          "ImageURL4",
          "ImageURL5",
          "SellerName",
          "SellerEmail",
          "SellerAddress",
          "SellerLicenseNo",
          "ManufacturerOrMarketerName",
          "ManufacturerOrMarketerAddress",
          "CountryOfOrigin",
          "SearchKeywords",
          "SourceURL",
          "CollectedAt",
          "Attribute_Net_Qty",
          "Attribute_Product_Type",
          "Attribute_Material_Type",
          "Attribute_Brand",
          "Attribute_Colour_Name",
          "Attribute_Key_Features",
          "Attribute_Occasion",
          "Attribute_Design_Type",
          "Attribute_Plating",
          "Attribute_Seller_Name",
          "Attribute_Seller_Address",
          "Attribute_Seller_License_No",
          "Attribute_Manufacturer_Or_Marketer_Name",
          "Attribute_Manufacturer_Or_Marketer_Address",
          "Attribute_Country_Of_Origin",
          "Attribute_Closure_Type",
          "Attribute_Shape",
          "Attribute_Gender",
          "Attribute_Gem_Type",
          "Attribute_Metal_Type",
          "Attribute_Gift",
        ];

        const sampleRows = [
          [
            "PRD-JW-001",
            "FC-JW-KUN-CHK-01",
            "Mughal Royal Uncut Kundan & Pearl Bridal Choker Set",
            "mughal-royal-uncut-kundan-pearl-bridal-choker-set",
            "https://atelier.fashioncart.shop/jewellery/kundan-choker-01",
            "Jewellery",
            "Necklaces & Sets",
            "Kundan Chokers",
            "Jewellery > Necklaces & Sets > Kundan Chokers",
            "Bridal Choker Set",
            "1 Set (1 Choker, 2 Earrings, 1 Maang Tikka)",
            "High-Grade Brass Alloy with Real Meenakari Backing",
            "Adjustable Dori (Drawstring)",
            "Royal Gold & Pearl Cream",
            "Peacock & Floral Jali",
            "24K Micro-Plated Gold, Hand-set Uncut Kundan Stones, Real Freshwater Cultured Pearls, Anti-Tarnish Coating",
            "Women",
            "Bridal & Wedding",
            "Heirloom Heritage Mughal",
            "Uncut Kundan & Polki Stones",
            "24K Micron Gold Plated",
            "Brass Alloy",
            "Velvet Gift Casing with Anti-Tarnish Pouch",
            "Imperial Fine Jewels",
            "Grand heirloom bridal choker handcrafted with traditional Rajasthani uncut Kundan stones, emerald meenakari reverse work, and cascading pearl latkans.",
            "ACTIVE",
            "IN_STOCK",
            "188",
            "499",
            "62",
            "311",
            "INR",
            "50",
            "4.9",
            "42",
            "38",
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
            "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800",
            "",
            "",
            "",
            "Jaipur Royal Goldsmiths Guild",
            "supplier@jaipurjewels.example.com",
            "Johari Bazaar, Jaipur, Rajasthan - 302003",
            "BIS/HM-JW-92847",
            "Imperial Atelier Crafts LLP",
            "Johari Bazaar, Jaipur, Rajasthan - 302003",
            "India 🇮🇳",
            "kundan choker, bridal necklace, wedding jewellery, 24k gold plated, pearl jhumka",
            "https://atelier.fashioncart.shop/jewellery/source-kundan-01",
            "2026-08-22T23:00:00Z",
            "1 Set",
            "Bridal Choker Set",
            "Brass Alloy with Meenakari",
            "Imperial Fine Jewels",
            "Royal Gold & Pearl Cream",
            "24K Micro-Plated, Uncut Kundan, Real Pearls",
            "Bridal & Wedding",
            "Heirloom Heritage Mughal",
            "24K Micron Gold Plated",
            "Jaipur Royal Goldsmiths Guild",
            "Johari Bazaar, Jaipur, Rajasthan",
            "BIS/HM-JW-92847",
            "Imperial Atelier Crafts LLP",
            "Johari Bazaar, Jaipur, Rajasthan",
            "India 🇮🇳",
            "Adjustable Dori",
            "Peacock Floral",
            "Women",
            "Uncut Kundan & Polki",
            "Brass Alloy",
            "Velvet Gift Box",
          ],
          [
            "PRD-JW-002",
            "FC-JW-KAD-24K-26",
            "24K Micro-Plated Antique Openable Royal Kadas (Pair)",
            "24k-micro-plated-antique-openable-royal-kadas-pair",
            "https://atelier.fashioncart.shop/jewellery/royal-kadas-02",
            "Jewellery",
            "Bangles & Kadas",
            "Openable Kadas",
            "Jewellery > Bangles & Kadas > Openable Kadas",
            "Openable Kada Pair",
            "2 Units (1 Pair)",
            "Copper Brass Base with Electrophoretic Seal",
            "Screw & Hinge Openable",
            "Antique Matte Gold",
            "Gajra Floral Filigree",
            "Screw Lock Mechanism, Fits Sizes 2.4 to 2.8 Comfortably, 100% Lead-Free & Hypoallergenic",
            "Women",
            "Festive & Wedding",
            "South Indian Antique Temple",
            "Ruby Red Kemp Stones",
            "24K Micron Matte Gold",
            "Copper Brass",
            "Atelier Jewellery Pouch Ready",
            "Imperial Fine Jewels",
            "Classic temple filigree openable bangles crafted in antique gold finish, highlighted with deep ruby red kemp stones.",
            "ACTIVE",
            "IN_STOCK",
            "188",
            "399",
            "53",
            "211",
            "INR",
            "75",
            "4.8",
            "29",
            "24",
            "https://images.unsplash.com/photo-1611591475836-4188c035626a?w=800",
            "",
            "",
            "",
            "",
            "Chennai Temple Arts Pvt Ltd",
            "templearts@chennai.example.com",
            "T. Nagar, Chennai, Tamil Nadu - 600017",
            "BIS/HM-JW-44109",
            "Imperial Atelier Crafts LLP",
            "T. Nagar, Chennai, Tamil Nadu",
            "India 🇮🇳",
            "openable kada, antique bangles, temple jewellery, 24k gold kada",
            "https://atelier.fashioncart.shop/jewellery/source-kada-02",
            "2026-08-22T23:00:00Z",
            "2 Units (Pair)",
            "Openable Kada Pair",
            "Copper Brass Alloy",
            "Imperial Fine Jewels",
            "Antique Matte Gold",
            "Screw lock, Kemp stones, Hypoallergenic",
            "Festive & Wedding",
            "South Indian Antique",
            "24K Micron Gold",
            "Chennai Temple Arts Pvt Ltd",
            "T. Nagar, Chennai, Tamil Nadu",
            "BIS/HM-JW-44109",
            "Imperial Atelier Crafts LLP",
            "T. Nagar, Chennai, Tamil Nadu",
            "India 🇮🇳",
            "Screw & Hinge",
            "Gajra Filigree",
            "Women",
            "Ruby Red Kemp",
            "Copper Brass",
            "Velvet Pouch",
          ],
        ];

        const csv = convertToCsv(headers, sampleRows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-jewellery-72col-template-${timestamp}.csv"`,
          },
        });
      }

      case "template": {
        if (isJewellery) {
          return GET(new NextRequest(new URL(`${req.url}&type=jewellery-template`), req));
        }

        const headers = [
          "ProductID",
          "SKU",
          "Title",
          "Slug",
          "ProductURL",
          "Department",
          "Category",
          "Subcategory",
          "Brand",
          "Fabric",
          "Material",
          "Description",
          "Status",
          "Availability",
          "Colour",
          "Size",
          "Pattern",
          "Fit",
          "Occasion",
          "Price",
          "CompareAtPrice",
          "DiscountPercent",
          "Currency",
          "StockQuantity",
          "SellerName",
          "SellerID",
          "Rating",
          "RatingCount",
          "ReviewCount",
          "ImageURL",
          "ImageURL2",
          "ImageURL3",
          "ImageURL4",
          "ImageURL5",
        ];

        const sampleRows = [
          [
            "PRD-SAR-001",
            "FC-SAR-EME-01",
            "Royal Emerald Banarasi Silk Saree",
            "royal-emerald-banarasi-silk-saree",
            "https://supplier.example.com/item/banarasi-emerald-99",
            "Women",
            "Ethnic Wear",
            "Sarees",
            "Fashion Cart Atelier",
            "100% Pure Mulberry Silk",
            "Pure Katan Silk with Metallic Zari",
            "Exquisite handloom Banarasi silk saree woven with real metallic zari threads and heritage floral vines.",
            "ACTIVE",
            "IN_STOCK",
            "Emerald Green",
            "Free Size",
            "Zari Woven Floral",
            "Classic Drape",
            "Wedding & Festive",
            "4499",
            "7999",
            "44",
            "INR",
            "25",
            "Varanasi Heritage Silks",
            "SLR-VNS-101",
            "4.9",
            "48",
            "36",
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800",
            "",
            "",
            "",
          ],
        ];

        const csv = convertToCsv(headers, sampleRows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-garments-template-${timestamp}.csv"`,
          },
        });
      }

      case "products": {
        const products = await db.product.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            category: true,
            variants: true,
            images: { orderBy: { sortOrder: "asc" } },
            seller: true,
          },
        });

        const headers = [
          "ProductID",
          "SKU",
          "Title",
          "Slug",
          "Category",
          "Brand",
          "Price",
          "CompareAtPrice",
          "StockQuantity",
          "Status",
          "Material",
          "ImageURL",
        ];

        const rows = products.map((p) => [
          p.productId || p.id,
          p.variants[0]?.sku || "",
          p.name,
          p.slug,
          p.category.name,
          p.brand || "",
          p.variants[0]?.price ? Number(p.variants[0].price) : 0,
          p.variants[0]?.compareAtPrice ? Number(p.variants[0].compareAtPrice) : "",
          p.variants.reduce((acc, v) => acc + v.stockQuantity, 0),
          p.status,
          p.material || p.fabric || "",
          p.images[0]?.imageUrl || "",
        ]);

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-${activeStore}-products-${timestamp}.csv"`,
          },
        });
      }

      case "payments": {
        const payments = await db.payment.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            order: {
              include: { user: true },
            },
          },
        });

        const headers = [
          "PaymentID",
          "OrderNumber",
          "CustomerName",
          "CustomerEmail",
          "CustomerPhone",
          "Amount",
          "Currency",
          "Gateway",
          "PaymentChannel",
          "InstrumentDetails",
          "UTR_TransactionRef",
          "PaymentStatus",
          "VerifiedAt",
          "SubmittedAt",
          "CreatedAt",
        ];

        const rows = payments.map((p) => [
          p.id,
          p.order?.orderNumber || "",
          p.order?.user?.name || "",
          p.order?.user?.email || "",
          p.order?.user?.phone || "",
          Number(p.amount),
          "INR",
          p.gatewayName || (p.method === "ONLINE_GATEWAY" ? "Razorpay" : p.method.replace(/_/g, " ")),
          p.paymentChannel || (p.method === "ONLINE_GATEWAY" ? "ONLINE_GATEWAY" : p.method),
          p.instrumentDetails || "",
          p.utrNumber || "",
          p.status,
          p.verifiedAt ? new Date(p.verifiedAt).toISOString() : "",
          p.submittedAt ? new Date(p.submittedAt).toISOString() : "",
          new Date(p.createdAt).toISOString(),
        ]);

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-${activeStore}-payments-${timestamp}.csv"`,
          },
        });
      }

      case "orders": {
        const orders = await db.order.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
            payment: true,
            items: true,
          },
        });

        const headers = [
          "OrderNumber",
          "CustomerName",
          "CustomerEmail",
          "CustomerPhone",
          "OrderStatus",
          "PaymentGateway",
          "PaymentChannel",
          "InstrumentDetails",
          "TransactionRef",
          "Subtotal",
          "Discount",
          "DeliveryCharge",
          "TotalAmount",
          "ItemCount",
          "CreatedAt",
        ];

        const rows = orders.map((o) => [
          o.orderNumber,
          o.user?.name || "",
          o.user?.email || "",
          o.user?.phone || "",
          o.status,
          o.payment?.gatewayName || (o.paymentMethod.includes("ONLINE") ? "Razorpay" : o.paymentMethod),
          o.payment?.paymentChannel || "",
          o.payment?.instrumentDetails || "",
          o.payment?.utrNumber || "",
          Number(o.subtotal),
          Number(o.discount),
          Number(o.deliveryCharge),
          Number(o.total),
          o.items.reduce((s, i) => s + i.quantity, 0),
          new Date(o.createdAt).toISOString(),
        ]);

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-${activeStore}-orders-${timestamp}.csv"`,
          },
        });
      }

      default: {
        return NextResponse.json({ error: `Unknown export type: ${type}` }, { status: 400 });
      }
    }
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate CSV export" }, { status: 500 });
  }
}
