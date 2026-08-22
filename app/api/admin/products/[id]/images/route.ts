import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { saveImageUpload, UploadError } from "@/lib/upload";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";

async function findStoreForProduct(productId: string): Promise<"garments" | "jewellery"> {
  const inGarments = await getDb("garments").product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (inGarments) return "garments";
  return "jewellery";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await findStoreForProduct(id);
  const db = getDb(store);

  const contentType = req.headers.get("content-type") || "";

  // 1. Direct Image URL Link (JSON Payload)
  if (contentType.includes("application/json")) {
    try {
      const body = await req.json();
      const rawUrl = body.imageUrl;
      const variantId = body.variantId;
      const sortOrder = Number(body.sortOrder ?? 0);

      if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
        return NextResponse.json({ error: "Please provide a valid image URL link." }, { status: 400 });
      }

      const imageUrl = normalizeImageUrl(rawUrl.trim());

      const image = await db.productImage.create({
        data: {
          productId: id,
          variantId: typeof variantId === "string" && variantId ? variantId : undefined,
          imageUrl,
          sortOrder,
        },
      });

      return NextResponse.json({ image }, { status: 201 });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Failed to add image link." }, { status: 500 });
    }
  }

  // 2. File Upload or FormData Link
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const directUrl = formData.get("imageUrl");
    const variantId = formData.get("variantId");
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    let imageUrl = "";

    if (typeof directUrl === "string" && directUrl.trim()) {
      imageUrl = normalizeImageUrl(directUrl.trim());
    } else if (file instanceof File) {
      const { relativePath } = await saveImageUpload(file, "products");
      imageUrl = relativePath.startsWith("data:") ? relativePath : `/uploads/${relativePath}`;
    } else {
      return NextResponse.json({ error: "Please select an image file or provide an image URL." }, { status: 400 });
    }

    const image = await db.productImage.create({
      data: {
        productId: id,
        variantId: typeof variantId === "string" && variantId ? variantId : undefined,
        imageUrl,
        sortOrder,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (err: any) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to process image upload." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await findStoreForProduct(id);
  const db = getDb(store);

  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required." }, { status: 400 });
    }

    await db.productImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete image." }, { status: 500 });
  }
}
