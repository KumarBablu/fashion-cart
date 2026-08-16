import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import ProfileForm from "@/components/account/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const fullProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!fullProfile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Profile & Settings</h2>
        <p className="text-xs text-dim mt-1">Manage your account information and login security.</p>
      </div>

      <ProfileForm initialProfile={fullProfile} />
    </div>
  );
}
