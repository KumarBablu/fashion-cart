import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const logs = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Customer Email Audit Logs</h1>
          <p className="text-xs text-dim mt-0.5">Real-time record of all registration, order, invoice, and password recovery emails sent to customers.</p>
        </div>
        <Link
          href="/admin/settings"
          className="px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ borderColor: "var(--fc-border)" }}
        >
          ⚙️ Configure SMTP Settings
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <table className="w-full text-left text-xs">
          <thead className="border-b font-bold uppercase tracking-wider text-dim" style={{ backgroundColor: "var(--fc-bg-subtle)", borderColor: "var(--fc-border)" }}>
            <tr>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Delivery Status</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-dim">
                  No email transactions logged yet. When customers register, place orders, or reset passwords, their dispatch logs will appear here.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3.5 font-bold">
                    {log.recipient}
                  </td>
                  <td className="px-4 py-3.5 max-w-xs truncate">
                    {log.subject}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border" style={{ borderColor: "var(--fc-border)" }}>
                      {log.template}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.status === "SENT"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : log.status === "SIMULATED"
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-rose-500/15 text-rose-500"
                      }`}
                    >
                      {log.status === "SIMULATED" ? "Simulated / Logged" : log.status}
                    </span>
                    {log.error && <p className="text-[10px] text-rose-500 mt-0.5">{log.error}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-dim whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
