import { prisma } from "../lib/db";
import nodemailer from "nodemailer";

async function testLiveSmtp() {
  console.log("=== TESTING LIVE GMAIL SMTP CONNECTION ===");

  const settings = await prisma.emailSettings.findFirst();
  console.log("Database Email Settings:", {
    host: settings?.smtpHost,
    port: settings?.smtpPort,
    user: settings?.smtpUser,
    secure: settings?.smtpSecure,
    fromEmail: settings?.fromEmail,
  });

  if (!settings || !settings.smtpUser || !settings.smtpPassword) {
    console.error("❌ SMTP Settings missing in database!");
    return;
  }

  // Test 1: Port 465 SSL
  console.log("\nAttempting connection on Port 465 (SSL)...");
  try {
    const transporter465 = nodemailer.createTransport({
      host: settings.smtpHost || "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword.replace(/\s+/g, ""), // remove spaces if any in app password
      },
    });

    await transporter465.verify();
    console.log("✅ Port 465 Connection Verified Successfully!");

    const testInfo = await transporter465.sendMail({
      from: `"${settings.fromName || "Fashion Cart"}" <${settings.fromEmail || settings.smtpUser}>`,
      to: settings.smtpUser,
      subject: "🧪 [Fashion Cart] Live SMTP System Test",
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #FAF8F5; border-radius: 12px;">
          <h2 style="color: #141416;">Fashion Cart Email System Verified</h2>
          <p>This is a live test verifying that your Gmail SMTP credentials are functioning correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString("en-IN")}</p>
        </div>
      `,
    });
    console.log("✅ Test Email Dispatched Successfully! Message ID:", testInfo.messageId);
    return;
  } catch (err465) {
    console.error("❌ Port 465 SSL Failed:", err465);
  }

  // Test 2: Port 587 STARTTLS fallback
  console.log("\nAttempting connection on Port 587 (STARTTLS fallback)...");
  try {
    const transporter587 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword.replace(/\s+/g, ""),
      },
    });

    await transporter587.verify();
    console.log("✅ Port 587 Connection Verified Successfully!");

    const testInfo = await transporter587.sendMail({
      from: `"${settings.fromName || "Fashion Cart"}" <${settings.fromEmail || settings.smtpUser}>`,
      to: settings.smtpUser,
      subject: "🧪 [Fashion Cart] Live SMTP System Test (Port 587)",
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #FAF8F5; border-radius: 12px;">
          <h2 style="color: #141416;">Fashion Cart Email System Verified (Port 587)</h2>
          <p>Gmail SMTP is active via Port 587.</p>
        </div>
      `,
    });
    console.log("✅ Test Email Dispatched on Port 587! Message ID:", testInfo.messageId);
  } catch (err587) {
    console.error("❌ Port 587 Failed:", err587);
  }
}

testLiveSmtp()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
