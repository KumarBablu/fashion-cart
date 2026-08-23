"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";

interface OrderEmailReachoutModalProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderStatus: string;
  paymentStatus?: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    size?: string;
    price: number;
  }>;
  store?: "garments" | "jewellery";
  mobileNumber?: string;
}

type TemplateKey = "PAYMENT_REMINDER" | "ATELIER_PROCESSING" | "ADDRESS_VERIFY" | "COURIER_UPDATE" | "CUSTOM";

export default function OrderEmailReachoutModal({
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  orderStatus,
  paymentStatus,
  totalAmount,
  items,
  store = "garments",
  mobileNumber,
}: OrderEmailReachoutModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>("PAYMENT_REMINDER");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [actionText, setActionText] = useState("View Order & Details →");
  const [actionUrl, setActionUrl] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isJewellery = store === "jewellery";
  const atelierTitle = isJewellery ? "Fashion Cart Imperial Jewels Atelier" : "Fashion Cart Haute Couture";

  // Pre-configured Luxury Templates
  const applyTemplate = (key: TemplateKey) => {
    setActiveTemplate(key);
    setStatusMessage(null);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://fashioncartstore.vercel.app";
    const orderLink = `${baseUrl}/account/orders/${orderNumber}`;

    if (key === "PAYMENT_REMINDER") {
      setSubject(`Gentle Reminder: Complete Payment Verification for Order #${orderNumber}`);
      setMessage(
        `Dear ${customerName},\n\nWe have reserved your chosen items for Order #${orderNumber} at our ${atelierTitle}.\n\nTo begin artisan packaging and priority dispatch, we kindly request you to complete your UPI transfer and upload the payment confirmation screenshot or UTR reference.\n\nOnce received, our finance desk will verify and issue your official tax invoice immediately.\n\nThank you for choosing Fashion Cart!`
      );
      setActionText("Upload Payment Proof & View Order →");
      setActionUrl(orderLink);
    } else if (key === "ATELIER_PROCESSING") {
      setSubject(`Atelier Update: We are preparing Order #${orderNumber} for you`);
      setMessage(
        `Dear ${customerName},\n\nWe are delighted to share that your Order #${orderNumber} has entered our atelier for tailoring inspection and luxury gift-box packaging.\n\nEvery piece is undergoing strict 6-point quality assurance to ensure flawless perfection upon arrival at your doorstep.\n\nYou will receive a live express AWB tracking link as soon as your parcel is handed over to our courier partner.\n\nWarm regards,\nFashion Cart Atelier Team`
      );
      setActionText("Track Your Order →");
      setActionUrl(orderLink);
    } else if (key === "ADDRESS_VERIFY") {
      setSubject(`Action Required: Please Confirm Delivery Address for Order #${orderNumber}`);
      setMessage(
        `Dear ${customerName},\n\nBefore handing over Order #${orderNumber} to our express courier network, our dispatch team would like to verify your delivery address and contact details.\n\nIf you have any specific landmark, floor instructions, or an alternate contact number, please reply directly to this email or send a quick note to our WhatsApp concierge desk.\n\nWe look forward to ensuring seamless doorstep delivery!`
      );
      setActionText("Review Order Address →");
      setActionUrl(orderLink);
    } else if (key === "COURIER_UPDATE") {
      setSubject(`Logistics Update for your Fashion Cart Order #${orderNumber}`);
      setMessage(
        `Dear ${customerName},\n\nHere is an update regarding the shipment of your Order #${orderNumber}.\n\nYour parcel is securely packed in tamper-evident luxury casing and is currently in transit with our premium courier partners.\n\nShould you need any assistance during transit, our concierge team is always at your service.`
      );
      setActionText("Track Consignment →");
      setActionUrl(orderLink);
    } else {
      setSubject(`Regarding your Fashion Cart Order #${orderNumber}`);
      setMessage(`Dear ${customerName},\n\n`);
      setActionText("View Order Details →");
      setActionUrl(orderLink);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setStatusMessage(null);
    if (!subject) {
      applyTemplate(paymentStatus === "PENDING" || orderStatus === "PENDING_PAYMENT" ? "PAYMENT_REMINDER" : "ATELIER_PROCESSING");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatusMessage({ type: "error", text: "Please enter both subject and message body." });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reachout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          actionText: actionText.trim() || undefined,
          actionUrl: actionUrl.trim() || undefined,
          store,
          templateType: activeTemplate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setStatusMessage({
        type: "success",
        text: `Email successfully sent to ${customerEmail}! ${data.simulated ? "(Logged in Simulated Mode)" : "🚀"}`,
      });

      setTimeout(() => {
        setIsSending(false);
      }, 800);
    } catch (err: any) {
      setIsSending(false);
      setStatusMessage({ type: "error", text: err?.message || "Failed to dispatch email." });
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-[#141416] bg-[#FDF4D8] hover:bg-[#F9E8B8] border border-[#C59B27]/50 shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        title="Send customized reachout email to customer"
      >
        <span>✉️</span>
        <span>Email Reachout</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl border border-[#E7DFD5] shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#141416] text-white flex items-center justify-between border-b border-[#C59B27]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FAF8F5]/10 border border-[#C59B27]/40 flex items-center justify-center text-sm">
                  ✉️
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    Customer Email Reachout
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5]/15 text-[#F3E5AB]">
                      #{orderNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-white/70">
                    Recipient: <strong className="text-white">{customerName}</strong> ({customerEmail})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Templates Selector */}
            <div className="px-6 pt-4 pb-2 bg-[#FAF8F5] border-b border-[#E7DFD5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#787C87]">
                  ✦ Quick Template Presets:
                </span>
                <div className="flex rounded-lg bg-white border border-[#E7DFD5] p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode("edit")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      viewMode === "edit" ? "bg-[#141416] text-white" : "text-[#787C87] hover:text-[#141416]"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("preview")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      viewMode === "preview" ? "bg-[#141416] text-white" : "text-[#787C87] hover:text-[#141416]"
                    }`}
                  >
                    Visual Preview
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => applyTemplate("PAYMENT_REMINDER")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTemplate === "PAYMENT_REMINDER"
                      ? "bg-[#C59B27] text-white shadow-xs"
                      : "bg-white text-[#141416] border border-[#E7DFD5] hover:border-[#C59B27]"
                  }`}
                >
                  💳 Payment Reminder
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("ATELIER_PROCESSING")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTemplate === "ATELIER_PROCESSING"
                      ? "bg-[#C59B27] text-white shadow-xs"
                      : "bg-white text-[#141416] border border-[#E7DFD5] hover:border-[#C59B27]"
                  }`}
                >
                  🧵 Crafting Note
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("ADDRESS_VERIFY")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTemplate === "ADDRESS_VERIFY"
                      ? "bg-[#C59B27] text-white shadow-xs"
                      : "bg-white text-[#141416] border border-[#E7DFD5] hover:border-[#C59B27]"
                  }`}
                >
                  📍 Address Check
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("COURIER_UPDATE")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTemplate === "COURIER_UPDATE"
                      ? "bg-[#C59B27] text-white shadow-xs"
                      : "bg-white text-[#141416] border border-[#E7DFD5] hover:border-[#C59B27]"
                  }`}
                >
                  🚚 Courier Update
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("CUSTOM")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTemplate === "CUSTOM"
                      ? "bg-[#141416] text-white shadow-xs"
                      : "bg-white text-[#141416] border border-[#E7DFD5] hover:border-[#141416]"
                  }`}
                >
                  ✍️ Custom Note
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {statusMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
                    statusMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{statusMessage.type === "success" ? "✅" : "⚠️"}</span>
                    <span>{statusMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusMessage(null)}
                    className="text-xs font-normal opacity-70 hover:opacity-100"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {viewMode === "edit" ? (
                <form id="reachout-form" onSubmit={handleSend} className="space-y-4">
                  {/* Subject Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#141416] uppercase tracking-wider">
                      Email Subject Line *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Gentle Reminder: Complete Payment for Order #..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E7DFD5] bg-white text-xs text-[#141416] focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  {/* Message Body */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#141416] uppercase tracking-wider">
                        Personalized Message *
                      </label>
                      <span className="text-[11px] text-[#787C87]">
                        Separate paragraphs with blank lines
                      </span>
                    </div>
                    <textarea
                      required
                      rows={8}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your bespoke message to the customer..."
                      className="w-full px-4 py-3 rounded-xl border border-[#E7DFD5] bg-white text-xs text-[#141416] leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  {/* Call-to-Action Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E7DFD5]">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#787C87] uppercase tracking-wider">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={actionText}
                        onChange={(e) => setActionText(e.target.value)}
                        placeholder="View Order Details →"
                        className="w-full px-3 py-2 rounded-lg border border-[#E7DFD5] bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#787C87] uppercase tracking-wider">
                        Button Action Destination
                      </label>
                      <input
                        type="text"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="https://fashioncartstore.vercel.app/account/orders/..."
                        className="w-full px-3 py-2 rounded-lg border border-[#E7DFD5] bg-white text-xs font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </form>
              ) : (
                /* Visual Email Preview */
                <div className="rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] p-5 space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-[#E7DFD5] shadow-xs space-y-3">
                    <div className="border-b border-[#E7DFD5] pb-3 space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF4E2] text-[#8E6C0C] border border-[#C59B27]">
                        ✦ Order #{orderNumber}
                      </span>
                      <h4 className="font-display text-base font-bold text-[#141416]">{subject || "No Subject"}</h4>
                      <p className="text-[11px] text-[#787C87]">From: {atelierTitle} Concierge Team</p>
                    </div>

                    <div className="text-xs text-[#3A3D45] space-y-2 leading-relaxed">
                      <p>Dear <strong>{customerName}</strong>,</p>
                      {message.split("\n\n").map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>

                    {/* Order items snapshot */}
                    {items.length > 0 && (
                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E7DFD5] text-xs space-y-2">
                        <p className="font-bold text-[11px] uppercase tracking-wider text-[#787C87]">
                          📦 Order Items Summary
                        </p>
                        <div className="divide-y divide-[#E7DFD5]">
                          {items.map((item, i) => (
                            <div key={i} className="py-1.5 flex justify-between">
                              <span>{item.name} {item.size && `(${item.size})`} × {item.quantity}</span>
                              <span className="font-mono font-bold">{formatINR(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-[#E7DFD5] flex justify-between font-bold">
                          <span>Total Amount:</span>
                          <span className="text-[#C59B27] font-mono">{formatINR(totalAmount)}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-2">
                      <span className="inline-block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white shadow-xs border border-[#C59B27]">
                        {actionText || "View Order Details →"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E7DFD5] flex items-center justify-between">
              <div className="text-xs text-[#787C87]">
                Sending to <strong className="text-[#141416]">{customerEmail}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#787C87] hover:text-[#141416] hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="reachout-form"
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#141416] hover:bg-[#25262B] text-white shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Email…</span>
                    </>
                  ) : (
                    <>
                      <span>✉️</span>
                      <span>Send Email Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
