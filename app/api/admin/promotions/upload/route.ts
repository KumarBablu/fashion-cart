import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { saveImageUpload } from "@/lib/upload";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    try {
      const { relativePath } = await saveImageUpload(file, "products");
      const isDataUri = relativePath.startsWith("data:");
      const publicUrl = isDataUri ? relativePath : `/uploads/${relativePath}`;
      return NextResponse.json({ url: publicUrl });
    } catch (saveErr) {
      console.warn("Falling back to direct Base64 Data URL for promotional image:", saveErr);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mime = file.type || "image/jpeg";
      const base64 = buffer.toString("base64");
      return NextResponse.json({ url: `data:${mime};base64,${base64}` });
    }
  } catch (error: any) {
    console.error("Error in promotional upload route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image file" },
      { status: 500 }
    );
  }
}
