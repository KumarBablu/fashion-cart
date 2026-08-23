import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getStoresControl } from "@/lib/stores";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const revalidate = 60;

export const metadata = {
  title: "Fashion Cart — The Private Luxury Portals | Couture Garments & Imperial Jewels",
  description: "Curators of Indian Luxury & Modern Style. Step into our dedicated maisons of artisanal garments or handcrafted 24K micro-plated artificial fine jewellery.",
};

export default async function StoreGatewayLandingPage() {
  const storesControl = await getStoresControl();
  const isGarmentsActive = storesControl.garments.isActive;
  const isJewelleryActive = storesControl.jewellery.isActive;

  // If only 1 store is active, seamlessly take the user directly to the active store
  if (isGarmentsActive && !isJewelleryActive) {
    redirect("/garments");
  }
  if (!isGarmentsActive && isJewelleryActive) {
    redirect("/jewellery");
  }

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between bg-[#FAF8F5] overflow-hidden selection:bg-[#C59B27] selection:text-white">
      
      {/* ====================================================================
          👑 FULL CINEMATIC LUXURY HERO BANNER BEHIND HEADLINE
          ==================================================================== */}
      <section className="relative w-full overflow-hidden bg-[#0C0F0E] text-white pt-12 pb-24 sm:pt-16 sm:pb-32 lg:pt-20 lg:pb-36 border-b border-[#C59B27]/20">
        
        {/* Cinematic Background Atmosphere Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1920&auto=format&fit=crop&q=90"
            alt="Luxury Atelier Background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30 scale-105"
          />
          {/* Multi-layered Vignette & Dark Velvet Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C0F0E]/80 via-[#0C0F0E]/60 to-[#0C0F0E] opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.18),transparent_70%)]" />
        </div>

        {/* Content Over Banner */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          
          {/* Luxury Monogram Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141416]/80 backdrop-blur-md text-[#F3E5AB] text-[11px] font-extrabold uppercase tracking-[0.28em] border border-[#D4AF37]/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <span className="text-[#D4AF37] text-xs">✦</span>
            <span>Private Luxury Portals • Est. 2026</span>
            <span className="text-[#D4AF37] text-xs">✦</span>
          </div>

          {/* Majestic Main Headline */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-[4rem] font-bold text-white tracking-tight leading-[1.08] drop-shadow-md">
              Two Iconic Maisons.
            </h1>
            <p className="font-display italic font-serif text-3xl sm:text-5xl lg:text-[4rem] font-normal gold-text-shimmer leading-[1.08] drop-shadow-md">
              One Singular Destination.
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm lg:text-base text-[#FAF8F5]/85 max-w-2xl mx-auto leading-relaxed pt-1 drop-shadow-sm font-normal">
            An invitation to bespoke craftsmanship. Select an exclusive maison below to immerse yourself in artisanal haute couture or handcrafted 24K micro-plated fine artificial jewellery.
          </p>

        </div>
      </section>

      {/* ====================================================================
          👑 2 FULLY-CLICKABLE LUXURY BOUTIQUE DOORS (LAYERED OVER BANNER)
          ==================================================================== */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-16 sm:-mt-20 lg:-mt-24 pb-12 sm:pb-16 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          
          {/* ====================================================================
              MAISON 1: L'ATELIER HAUTE COUTURE (GARMENTS) — 100% CLICKABLE CARD
              ==================================================================== */}
          <Link
            href="/garments"
            prefetch={true}
            className="group relative rounded-3xl overflow-hidden border-2 border-[#E7DFD5] hover:border-[#C59B27] bg-white shadow-xl hover:shadow-[0_25px_60px_rgba(20,20,22,0.18)] transition-all duration-500 flex flex-col justify-between cursor-pointer transform hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-[#C59B27] luxury-card-hover animate-luxury-up"
            aria-label="Enter Haute Couture Garments Boutique"
          >
            {/* Visual Header with Micro-Zoom */}
            <div className="relative h-80 sm:h-[26rem] w-full overflow-hidden bg-[#141416]">
              <Image
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=85"
                alt="Haute Couture Garments & Ethnic Apparel"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top opacity-90 group-hover:scale-106 transition-transform duration-700 ease-out"
              />
              
              {/* Luxury Gradient Framing */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/45 to-black/20" />
              
              {/* Floating Top Badge */}
              <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#141416] text-[10px] font-black uppercase tracking-[0.2em] border border-white/60 shadow-md flex items-center gap-2">
                  <span className="text-xs">👗</span>
                  <span>Maison I • Haute Couture</span>
                </span>
              </div>

              {/* Bottom Intro Text */}
              <div className="absolute bottom-5 left-6 right-6 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#C59B27]">
                  Apparel &amp; Sartorial Tailoring
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                  The Garments Collection
                </h2>
                <p className="text-xs text-[#FAF8F5]/85 leading-relaxed line-clamp-2">
                  Pure Varanasi Mulberry Silks, Handcrafted Zardozi Velvet Anarkalis, Structured French Linen &amp; Sartorial Menswear.
                </p>
              </div>
            </div>

            {/* Bottom Content Area */}
            <div className="p-6 sm:p-8 bg-white space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Curated Highlights */}
              <div className="space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#787C87]">
                  Curated In This Maison:
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#141416]">
                  <span className="bg-[#FAF8F5] px-3.5 py-1.5 rounded-xl border border-[#E7DFD5] group-hover:border-[#C59B27]/40 transition-colors">
                    🥻 Pure Silk Sarees
                  </span>
                  <span className="bg-[#FAF8F5] px-3.5 py-1.5 rounded-xl border border-[#E7DFD5] group-hover:border-[#C59B27]/40 transition-colors">
                    👗 Velvet Anarkalis
                  </span>
                  <span className="bg-[#FAF8F5] px-3.5 py-1.5 rounded-xl border border-[#E7DFD5] group-hover:border-[#C59B27]/40 transition-colors">
                    👔 French Linen Shirts
                  </span>
                  <span className="bg-[#FAF8F5] px-3.5 py-1.5 rounded-xl border border-[#E7DFD5] group-hover:border-[#C59B27]/40 transition-colors">
                    ✨ Gala Silk Gowns
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-[#E7DFD5] flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-[#141416]">
                    Over 120+ Curated Outfits
                  </span>
                  <span className="text-[10px] text-[#787C87]">
                    Hand-finished artisan tailoring
                  </span>
                </div>

                <div className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#141416] group-hover:bg-[#C59B27] text-white group-hover:text-[#141416] text-xs font-extrabold uppercase tracking-wider transition-all duration-300 shadow-md group-hover:shadow-xl shrink-0">
                  <span>Enter Garments Atelier</span>
                  <span className="transform group-hover:translate-x-1.5 transition-transform duration-300 text-sm">
                    →
                  </span>
                </div>
              </div>

            </div>
          </Link>

          {/* ====================================================================
              MAISON 2: L'IMPERIAL FINE JEWELS (JEWELLERY) — 100% CLICKABLE CARD
              ==================================================================== */}
          <Link
            href="/jewellery"
            prefetch={true}
            className="group relative rounded-3xl overflow-hidden border-2 border-[#D4AF37]/50 hover:border-[#D4AF37] bg-[#FCFAF6] shadow-xl hover:shadow-[0_25px_60px_rgba(6,26,20,0.22)] transition-all duration-500 flex flex-col justify-between cursor-pointer transform hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] luxury-card-hover animate-luxury-up"
            style={{ animationDelay: "100ms" }}
            aria-label="Enter Imperial Fine Jewellery Atelier"
          >
            {/* Visual Header with Micro-Zoom */}
            <div className="relative h-80 sm:h-[26rem] w-full overflow-hidden bg-[#061A14]">
              <Image
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=85"
                alt="Imperial Handcrafted 24K Fine Artificial Jewellery"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center opacity-90 group-hover:scale-106 transition-transform duration-700 ease-out"
              />
              
              {/* Luxury Gradient Framing */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#061A14] via-[#061A14]/55 to-black/30" />
              
              {/* Floating Top Badge */}
              <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#061A14] text-[10px] font-black uppercase tracking-[0.2em] border border-[#F3E5AB]/50 shadow-md flex items-center gap-2">
                  <span className="text-xs">💍</span>
                  <span>Maison II • Imperial Jewels</span>
                </span>
              </div>

              {/* Bottom Intro Text */}
              <div className="absolute bottom-5 left-6 right-6 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37]">
                  24K Micro-Plated Splendour
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F3E5AB] tracking-tight leading-tight">
                  The Jewellery Atelier
                </h2>
                <p className="text-xs text-[#FAF8F5]/85 leading-relaxed line-clamp-2">
                  Uncut Kundan Chokers, Polki Bridal Sets, Antique Temple Haar, Bahubali Jhumkas &amp; Brilliant CZ Solitaires.
                </p>
              </div>
            </div>

            {/* Bottom Content Area */}
            <div className="p-6 sm:p-8 bg-[#FCFAF6] space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Curated Highlights */}
              <div className="space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8C6B08]">
                  Curated In This Maison:
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#061A14]">
                  <span className="bg-[#FDF4D8] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/35 group-hover:border-[#D4AF37] transition-colors">
                    👑 Bridal Kundan Sets
                  </span>
                  <span className="bg-[#FDF4D8] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/35 group-hover:border-[#D4AF37] transition-colors">
                    ✨ Royal Jhumkas
                  </span>
                  <span className="bg-[#FDF4D8] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/35 group-hover:border-[#D4AF37] transition-colors">
                    💍 Openable Kadas
                  </span>
                  <span className="bg-[#FDF4D8] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/35 group-hover:border-[#D4AF37] transition-colors">
                    💎 CZ Solitaire Rings
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-[#E8DECE] flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-[#061A14]">
                    24K Gold Micron Plating
                  </span>
                  <span className="text-[10px] text-[#8C6B08]">
                    Anti-tarnish &amp; skin-friendly alloy
                  </span>
                </div>

                <div className="gold-jewellery-btn inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md group-hover:shadow-xl shrink-0">
                  <span>Enter Jewels Atelier</span>
                  <span className="transform group-hover:translate-x-1.5 transition-transform duration-300 text-sm">
                    →
                  </span>
                </div>
              </div>

            </div>
          </Link>

        </div>
      </section>

      {/* Trust Badges Footer Bar */}
      <footer className="border-t border-[#E7DFD5] bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#787C87]">
          <p>© {new Date().getFullYear()} Fashion Cart. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[#141416] transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy-policy" className="hover:text-[#141416] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-[#141416] transition-colors">
              Concierge Contact
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
