import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { profileUpdateSchema } from "@/lib/validation/schemas";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { sendPasswordChangedEmail, sendProfileUpdatedEmail } from "@/lib/email/service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          addresses: true,
        },
      },
    },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid profile data" }, { status: 400 });
    }

    const { name, email, phone, currentPassword, newPassword } = parsed.data;

    // Check if email changed and is taken by another user
    if (email !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail && existingEmail.id !== user.id) {
        return NextResponse.json({ error: "Email is already in use by another account." }, { status: 400 });
      }
    }

    // Check if phone changed and is taken
    if (phone && phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone && existingPhone.id !== user.id) {
        return NextResponse.json({ error: "Phone number is already associated with another account." }, { status: 400 });
      }
    }

    const updateData: { name: string; email: string; phone?: string | null; passwordHash?: string } = {
      name,
      email,
      phone: phone || null,
    };

    // If changing password, verify old password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
      }

      const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const isValid = await verifyPassword(currentPassword, fullUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Current password was incorrect." }, { status: 400 });
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    // Dispatch notification emails
    if (newPassword) {
      sendPasswordChangedEmail({ name: updated.name, email: updated.email }).catch((e) => {
        console.error("Password changed email error:", e);
      });
    } else {
      sendProfileUpdatedEmail({
        name: updated.name,
        email: updated.email,
        changesSummary: "Account name, email, or contact number details modified",
      }).catch((e) => {
        console.error("Profile updated email error:", e);
      });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
