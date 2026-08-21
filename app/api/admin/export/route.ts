import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
  const timestamp = new Date().toISOString().split("T")[0];

  try {
    switch (type) {
      case "template": {
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
          [
            "PRD-SHT-002",
            "FC-SHT-LIN-WHT-M",
            "Tailored French Linen Shirt - Cloud White",
            "tailored-french-linen-shirt-white",
            "https://supplier.example.com/item/linen-shirt-white",
            "Men",
            "Western Wear",
            "Shirts",
            "Fashion Cart Tailored",
            "100% Certified French Linen",
            "Pre-Washed Organic Linen",
            "Breathable pre-washed French linen shirt with tailored fit and natural mother-of-pearl buttons.",
            "ACTIVE",
            "IN_STOCK",
            "Cloud White",
            "M",
            "Solid",
            "Slim Fit",
            "Casual & Resort Wear",
            "1899",
            "2999",
            "37",
            "INR",
            "40",
            "Normandy Weaves Co",
            "SLR-NRM-204",
            "4.8",
            "32",
            "24",
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
            "",
            "",
            "",
          ],
          [
            "PRD-SHT-002",
            "FC-SHT-LIN-WHT-L",
            "Tailored French Linen Shirt - Cloud White",
            "tailored-french-linen-shirt-white",
            "https://supplier.example.com/item/linen-shirt-white",
            "Men",
            "Western Wear",
            "Shirts",
            "Fashion Cart Tailored",
            "100% Certified French Linen",
            "Pre-Washed Organic Linen",
            "Breathable pre-washed French linen shirt with tailored fit and natural mother-of-pearl buttons.",
            "ACTIVE",
            "IN_STOCK",
            "Cloud White",
            "L",
            "Solid",
            "Slim Fit",
            "Casual & Resort Wear",
            "1899",
            "2999",
            "37",
            "INR",
            "35",
            "Normandy Weaves Co",
            "SLR-NRM-204",
            "4.8",
            "32",
            "24",
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
            "",
            "",
            "",
          ],
          [
            "PRD-DRS-003",
            "FC-DRS-FLR-01",
            "Festive Embroidered Anarkali Dress",
            "festive-embroidered-anarkali-dress",
            "https://supplier.example.com/item/anarkali-festive",
            "Women",
            "Ethnic Wear",
            "Dresses",
            "Fashion Cart Couture",
            "Georgette with Shantoon Lining",
            "Pure Micro Georgette",
            "Flared festive Anarkali dress featuring intricate mirror work and paired with matching dupatta.",
            "ACTIVE",
            "IN_STOCK",
            "Ruby Rose",
            "M",
            "Embroidered Mirror Work",
            "Flared Fit",
            "Party & Wedding",
            "3299",
            "5499",
            "40",
            "INR",
            "20",
            "Jaipur Royal Crafts",
            "SLR-JPR-308",
            "4.9",
            "60",
            "45",
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800",
            "",
            "",
            "",
            "",
          ],
          [
            "PRD-FTW-004",
            "FC-MOJ-ROY-42",
            "Handcrafted Royal Leather Mojari",
            "handcrafted-royal-leather-mojari",
            "https://supplier.example.com/item/leather-mojari-tan",
            "Footwear",
            "Men Footwear",
            "Ethnic Footwear",
            "Fashion Cart Heritage",
            "Genuine Full-Grain Leather",
            "Hand-Stitched Leather Sole",
            "Traditional royal mojari crafted with vegetable-tanned leather and memory foam insole.",
            "ACTIVE",
            "IN_STOCK",
            "Tan Gold",
            "42 (UK 8)",
            "Embossed Zari",
            "Comfort Fit",
            "Wedding & Festive",
            "1999",
            "3499",
            "43",
            "INR",
            "15",
            "Jodhpur Footwear Guild",
            "SLR-JDH-401",
            "4.7",
            "22",
            "16",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
            "",
            "",
            "",
            "",
          ],
        ];

        const csv = convertToCsv(headers, sampleRows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="fashion-cart-bulk-upload-template.csv"',
          },
        });
      }

      case "products": {
        const products = await prisma.product.findMany({
          include: {
            category: true,
            variants: true,
            images: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Product ID",
          "Title",
          "Slug",
          "Category",
          "Status",
          "Fabric / Material",
          "Total Variants",
          "Total Stock",
          "Min Price (INR)",
          "Max Price (INR)",
          "Compare At Price",
          "Average Rating",
          "Total Reviews",
          "Created Date",
        ];

        const rows = products.map((p) => {
          const totalStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
          const prices = p.variants.map((v) => Number(v.price));
          const minPrice = prices.length ? Math.min(...prices) : 0;
          const maxPrice = prices.length ? Math.max(...prices) : 0;
          const compareAt = p.variants[0]?.compareAtPrice ? Number(p.variants[0].compareAtPrice) : "";

          return [
            p.id,
            p.name,
            p.slug,
            p.category?.name || "Uncategorized",
            p.status,
            p.fabric || "N/A",
            p.variants.length,
            totalStock,
            minPrice,
            maxPrice,
            compareAt,
            Number(p.averageRating),
            p.totalReviews,
            p.createdAt.toISOString().split("T")[0],
          ];
        });

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-products-${timestamp}.csv"`,
          },
        });
      }

      case "orders": {
        const orders = await prisma.order.findMany({
          include: {
            user: true,
            payment: true,
            items: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Order Number",
          "Order ID",
          "Customer Name",
          "Customer Email",
          "Customer Phone",
          "Status",
          "Payment Method",
          "Payment Status",
          "UTR Number",
          "Total Items",
          "Subtotal (INR)",
          "Discount (INR)",
          "Delivery (INR)",
          "Total Amount (INR)",
          "Carrier Name",
          "Tracking Number",
          "Order Date",
        ];

        const rows = orders.map((o) => [
          o.orderNumber,
          o.id,
          o.user.name,
          o.user.email,
          o.user.phone || "",
          o.status,
          o.paymentMethod,
          o.payment?.status || "N/A",
          o.payment?.utrNumber || "",
          o.items.reduce((sum, it) => sum + it.quantity, 0),
          Number(o.subtotal),
          Number(o.discount),
          Number(o.deliveryCharge),
          Number(o.total),
          o.carrierName || "",
          o.trackingNumber || "",
          o.createdAt.toISOString().replace("T", " ").substring(0, 19),
        ]);

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-orders-${timestamp}.csv"`,
          },
        });
      }

      case "customers": {
        const customers = await prisma.user.findMany({
          include: {
            orders: { select: { total: true } },
            _count: { select: { orders: true, reviews: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Customer ID",
          "Name",
          "Email",
          "Mobile Number",
          "Role",
          "Account Status",
          "Total Orders",
          "Lifetime Spend (INR)",
          "Average Order Value (INR)",
          "Customer Segment",
          "Joined Date",
        ];

        const rows = customers.map((c) => {
          const ltv = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
          const aov = c.orders.length ? Math.round(ltv / c.orders.length) : 0;
          let segment = "New Member";
          if (c.role === "ADMIN") segment = "Administrator";
          else if (ltv >= 10000) segment = "VIP Patron";
          else if (c.orders.length >= 3) segment = "Frequent Shopper";
          else if (c.orders.length >= 1) segment = "Active Buyer";

          return [
            c.id,
            c.name,
            c.email,
            c.phone || "",
            c.role,
            c.isActive ? "Active" : "Blocked",
            c._count.orders,
            ltv,
            aov,
            segment,
            c.createdAt.toISOString().split("T")[0],
          ];
        });

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-customers-${timestamp}.csv"`,
          },
        });
      }

      case "inventory": {
        const variants = await prisma.productVariant.findMany({
          include: {
            product: { include: { category: true } },
          },
          orderBy: [{ product: { name: "asc" } }, { size: "asc" }],
        });

        const headers = [
          "SKU",
          "Product Name",
          "Category",
          "Size",
          "Colour",
          "Selling Price (INR)",
          "Compare At Price (INR)",
          "Stock Quantity",
          "Stock Status",
          "Active",
        ];

        const rows = variants.map((v) => {
          let stockStatus = "In Stock";
          if (v.stockQuantity === 0) stockStatus = "Out of Stock";
          else if (v.stockQuantity <= 5) stockStatus = "Low Stock";

          return [
            v.sku,
            v.product.name,
            v.product.category?.name || "N/A",
            v.size,
            v.colour,
            Number(v.price),
            v.compareAtPrice ? Number(v.compareAtPrice) : "",
            v.stockQuantity,
            stockStatus,
            v.isActive ? "Yes" : "No",
          ];
        });

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-inventory-${timestamp}.csv"`,
          },
        });
      }

      case "coupons": {
        const coupons = await prisma.coupon.findMany({
          include: { _count: { select: { orders: true } } },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Coupon Code",
          "Description",
          "Discount Type",
          "Discount Value",
          "Min Order Amount (INR)",
          "Max Discount (INR)",
          "Usage Limit",
          "Used Count",
          "Status",
          "Start Date",
          "End Date",
        ];

        const rows = coupons.map((cp) => [
          cp.code,
          cp.description || "",
          cp.discountType,
          Number(cp.discountValue),
          cp.minOrderAmount ? Number(cp.minOrderAmount) : "None",
          cp.maxDiscountAmount ? Number(cp.maxDiscountAmount) : "None",
          cp.usageLimit || "Unlimited",
          cp.usedCount,
          cp.isActive ? "Active" : "Disabled",
          cp.startDate.toISOString().split("T")[0],
          cp.endDate ? cp.endDate.toISOString().split("T")[0] : "No Expiry",
        ]);

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-coupons-${timestamp}.csv"`,
          },
        });
      }

      case "reviews": {
        const reviews = await prisma.review.findMany({
          include: { product: true, user: true },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Review ID",
          "Product Name",
          "Customer Name",
          "Customer Email",
          "Rating (Stars)",
          "Review Title",
          "Comment",
          "Fit Sizing Rating",
          "Fabric Quality (1-5)",
          "Color Accuracy",
          "Comfort (1-5)",
          "Value for Money (1-5)",
          "Size Purchased",
          "Occasion Worn",
          "Recommends Product",
          "Verified Buyer",
          "Status",
          "Date",
        ];

        const rows = reviews.map((r) => [
          r.id,
          r.product.name,
          r.user.name,
          r.user.email,
          r.rating,
          r.title || "",
          r.comment,
          r.fitRating || "TRUE_TO_SIZE",
          r.qualityRating || r.rating,
          r.colorAccuracy || "EXACT_MATCH",
          r.comfortRating || r.rating,
          r.valueRating || r.rating,
          r.sizePurchased || "",
          r.occasionWorn || "",
          r.recommend !== false ? "Yes" : "No",
          r.isVerifiedBuyer ? "Yes" : "No",
          r.status,
          r.createdAt.toISOString().split("T")[0],
        ]);

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-reviews-${timestamp}.csv"`,
          },
        });
      }

      case "payments": {
        const payments = await prisma.payment.findMany({
          include: {
            order: { include: { user: true } },
            verifiedBy: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Payment ID",
          "Order Number",
          "Customer Name",
          "Customer Email",
          "Amount (INR)",
          "Method",
          "Payment Status",
          "UTR Number",
          "Submitted Date",
          "Verified Date",
          "Verified By",
          "Rejection Reason",
        ];

        const rows = payments.map((p) => [
          p.id,
          p.order.orderNumber,
          p.order.user.name,
          p.order.user.email,
          Number(p.amount),
          p.method,
          p.status,
          p.utrNumber || "",
          p.submittedAt ? p.submittedAt.toISOString().split("T")[0] : "",
          p.verifiedAt ? p.verifiedAt.toISOString().split("T")[0] : "",
          p.verifiedBy?.name || "",
          p.rejectionReason || "",
        ]);

        const csv = convertToCsv(headers, rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="fashion-cart-payments-${timestamp}.csv"`,
          },
        });
      }

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }
  } catch (error) {
    console.error("CSV Export error:", error);
    return NextResponse.json({ error: "Failed to generate CSV export" }, { status: 500 });
  }
}
