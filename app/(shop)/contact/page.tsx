"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { success } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          orderNumber: orderNumber.trim() || undefined,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Could not send your message.");
        return;
      }

      setSubmitted(true);
      success("Message Sent! ✉️", "We have emailed you a confirmation receipt.");
    } catch {
      setError("Network error while submitting your inquiry.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto space-y-3 pb-8">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20">
          24/7 Dedicated Support
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          How Can We Assist You Today?
        </h1>
        <p className="text-xs sm:text-sm text-dim leading-relaxed">
          Have an inquiry about sizing, custom tailoring, tracking status, or bulk orders? Send us a message and our customer care team will respond promptly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="p-6 rounded-3xl border space-y-4 card-theme"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            <h2 className="font-display text-lg font-bold">Contact Channels</h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <p className="font-bold">Email Support Desk</p>
                  <a href="mailto:Fashioncart.support@gmail.com" className="text-dim hover:text-primary transition-colors font-medium">
                    Fashioncart.support@gmail.com
                  </a>
                  <p className="text-[10px] text-dim mt-0.5">Average response time: &lt; 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <p className="font-bold">WhatsApp Concierge Desk</p>
                  <WhatsAppConciergeButton
                    className="text-[#C59B27] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer text-xs text-left"
                    customMessage="Hi Fashion Cart Concierge, I have an inquiry and would like personal assistance."
                  >
                    +91 97710 39201 ↗
                  </WhatsAppConciergeButton>
                  <p className="text-[10px] text-dim mt-0.5">Instant chat &amp; exchange assistance</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-bold">Registered Office &amp; Logistics Hub</p>
                  <p className="text-dim leading-relaxed">
                    Fashion Cart Premium Outlet<br />
                    Sonar Toli, City: Siwan, State: Bihar, PIN: 841226
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="font-bold">Operating Hours</p>
                  <p className="text-dim">Monday – Sunday: 10:00 AM – 9:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grievance Redressal Desk (Mandatory under Consumer Protection E-Commerce Rules, 2020) */}
          <div
            className="p-6 rounded-3xl border space-y-2 card-theme"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚖️</span>
              <p className="font-bold text-xs uppercase tracking-wider text-primary">Grievance Redressal Officer</p>
            </div>
            <p className="text-xs text-dim leading-relaxed">
              In accordance with the Information Technology Act 2000 and Consumer Protection (E-Commerce) Rules 2020:
            </p>
            <div className="text-[11px] text-dim space-y-1 pt-1 bg-black/5 dark:bg-white/5 p-3 rounded-xl">
              <p><strong>Designation:</strong> Head of Grievance Redressal &amp; Compliance</p>
              <p><strong>Entity:</strong> Fashion Cart</p>
              <p><strong>Address:</strong> Sonar Toli, Siwan, Bihar - 841226, India</p>
              <p><strong>Email:</strong> <a href="mailto:Fashioncart.support@gmail.com" className="text-primary underline">Fashioncart.support@gmail.com</a></p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold pt-0.5">
                ✓ Acknowledgment within 48 hours · Resolution within 30 days
              </p>
            </div>
          </div>

          <div
            className="p-6 rounded-3xl border space-y-2 card-theme"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            <p className="font-bold text-xs uppercase tracking-wider text-primary">📦 Need Fast Order Tracking?</p>
            <p className="text-xs text-dim leading-relaxed">
              You can track live dispatch timelines, courier AWB numbers, and download official tax invoices directly in your account.
            </p>
            <div className="pt-1">
              <Link href="/account" className="text-xs font-bold text-[#C59B27] hover:underline">
                Go to Order Tracking →
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div
            className="p-6 sm:p-8 rounded-3xl border shadow-xl card-theme"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            {submitted ? (
              <div className="text-center py-10 space-y-4 animate-in fade-in duration-300">
                <div className="text-5xl">🎉</div>
                <h2 className="font-display text-2xl font-bold">Message Received!</h2>
                <p className="text-xs text-dim max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. We have dispatched an email confirmation receipt to <strong>{email}</strong>. Our team will get back to you shortly.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setSubject("");
                      setOrderNumber("");
                      setMessage("");
                    }}
                    className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: "var(--fc-primary)" }}
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
                      style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
                      style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Size Exchange Inquiry"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
                      style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                      Order Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. FC-2026-1029"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none focus:border-primary transition-all"
                      style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                    Your Message / Detailed Query *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help? Please share all relevant details..."
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
                    style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                  />
                </div>

                {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--fc-primary)" }}
                >
                  {loading ? "Sending Inquiry & Emailing Receipt…" : "Send Message & Email Me Receipt →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
