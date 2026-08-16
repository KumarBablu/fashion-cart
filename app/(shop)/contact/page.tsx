"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";

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
                  <p className="font-bold">Email Support</p>
                  <a href="mailto:support@fashioncart.shop" className="text-dim hover:text-primary transition-colors">
                    support@fashioncart.shop
                  </a>
                  <p className="text-[10px] text-dim mt-0.5">Average response time: &lt; 4 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <p className="font-bold">WhatsApp Direct</p>
                  <a
                    href="https://wa.me/919876543210?text=Hi%20Fashion%20Cart%20Team%2C%20I%20have%20an%20inquiry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    +91 98765 43210 ↗
                  </a>
                  <p className="text-[10px] text-dim mt-0.5">Instant chat assistance</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-bold">Design Studio &amp; Boutique</p>
                  <p className="text-dim leading-relaxed">
                    Fashion Cart Luxury Atelier<br />
                    100 Feet Road, Indiranagar, Bengaluru, Karnataka - 560038
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="font-bold">Working Hours</p>
                  <p className="text-dim">Monday – Saturday: 9:00 AM – 8:00 PM IST</p>
                </div>
              </div>
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
              <Link href="/account" className="text-xs font-bold text-primary hover:underline">
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
