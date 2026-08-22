import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";

export default async function SecretAdminPortalPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/atelier-studio-7k9x/login");
  }
  redirect("/admin");
}
