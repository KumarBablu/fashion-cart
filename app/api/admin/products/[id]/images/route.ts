import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { saveImageUpload, UploadError } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file");
  const variantId = formData.get("variantId");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const { relativePath } = await saveImageUpload(file, "products");
    const imageUrl = relativePath.startsWith("data:") ? relativePath : `/uploads/${relativePath}`;

    const image = await prisma.productImage.create({
      data: {
        productId: id,
        variantId: typeof variantId === "string" && variantId ? variantId : undefined,
        imageUrl,
        sortOrder,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
