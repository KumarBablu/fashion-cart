import { prisma } from "../lib/db";

async function main() {
  const settings = await prisma.emailSettings.findFirst();
  console.log("Current EmailSettings in DB:", {
    fromEmail: settings?.fromEmail,
    notifyAdminEmail: settings?.notifyAdminEmail,
    smtpHost: settings?.smtpHost,
    smtpPort: settings?.smtpPort,
    smtpUser: settings?.smtpUser,
    smtpSecure: settings?.smtpSecure,
    hasPassword: !!settings?.smtpPassword,
  });

  const logs = await prisma.emailLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  console.log("\nLatest 5 Email Logs:");
  logs.forEach((log) => {
    console.log(`- [${log.createdAt.toISOString()}] Status: ${log.status} | To: ${log.recipient} | Subject: ${log.subject} | Error: ${log.error || "None"}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
