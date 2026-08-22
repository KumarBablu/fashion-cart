import Link from "next/link";

interface StoreClosedNoticeProps {
  store: "garments" | "jewellery";
  closedMessage?: string;
  customTitle?: string;
}

export default function StoreClosedNotice({
  store,
  closedMessage,
  customTitle,
}: StoreClosedNoticeProps) {
  const isJewellery = store === "jewellery";
  const defaultMessage = isJewellery
    ? "Our Imperial Jewellery Maison is temporarily undergoing seasonal catalog curation. We will reopen shortly!"
    : "Our Haute Couture Garments Boutique is temporarily undergoing catalog maintenance. We will reopen shortly!";

  const activeAlternateStore = isJewellery ? "garments" : "jewellery";
  const alternateStoreName = isJewellery ? "Explore Haute Couture Garments" : "Explore Imperial Jewellery";
  const alternateStoreLink = isJewellery ? "/garments" : "/jewellery";
  const alternateStoreIcon = isJewellery ? "👗" : "💍";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div
        className={`max-w-xl w-full rounded-3xl p-8 sm:p-12 text-center border shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 ${
          isJewellery
            ? "bg-[#061A14] text-white border-[#D4AF37]/50 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            : "bg-white text-[#141416] border-[#E7DFD5] shadow-[0_20px_60px_rgba(20,20,22,0.08)]"
        }`}
      >
        {/* Animated Store Icon Badge */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner border ${
            isJewellery
              ? "bg-[#0D2C22] border-[#D4AF37]/40 text-[#F3E5AB]"
              : "bg-[#FAF8F5] border-[#E7DFD5] text-[#141416]"
          }`}
        >
          {isJewellery ? "💍" : "👗"}
        </div>

        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
              isJewellery
                ? "bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40"
                : "bg-amber-100 text-amber-900 border border-amber-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Store Temporarily Inactive</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            {customTitle || (isJewellery ? "Imperial Jewellery Maison Closed" : "Garments Boutique Closed")}
          </h2>

          <p
            className={`text-xs sm:text-sm leading-relaxed max-w-md mx-auto pt-1 ${
              isJewellery ? "text-[#FAF8F5]/80" : "text-[#787C87]"
            }`}
          >
            {closedMessage || defaultMessage}
          </p>
        </div>

        {/* Informative Note for past orders */}
        <div
          className={`p-3.5 rounded-2xl text-xs space-y-1 ${
            isJewellery ? "bg-[#0D2C22]/80 border border-[#D4AF37]/20 text-[#F3E5AB]/90" : "bg-[#FAF8F5] border border-[#E7DFD5] text-[#4B4E56]"
          }`}
        >
          <p className="font-bold flex items-center justify-center gap-1.5">
            <span>📦</span> Looking for a previously placed order?
          </p>
          <p className="text-[11px] opacity-80">
            All your placed orders and tracking updates remain fully active and accessible in your customer account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={alternateStoreLink}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isJewellery
                ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#061A14] hover:brightness-110"
                : "bg-[#141416] text-white hover:bg-[#25262B]"
            }`}
          >
            <span>{alternateStoreIcon}</span>
            <span>{alternateStoreName} →</span>
          </Link>

          <Link
            href="/account"
            className={`w-full sm:w-auto px-5 py-3.5 rounded-full text-xs font-semibold border transition-all hover:bg-black/5 flex items-center justify-center gap-1.5 ${
              isJewellery ? "border-[#D4AF37]/40 text-[#F3E5AB] hover:bg-[#0D2C22]" : "border-[#E7DFD5] text-[#141416]"
            }`}
          >
            <span>📄</span>
            <span>View My Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
