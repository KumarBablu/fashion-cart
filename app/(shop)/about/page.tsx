import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About Fashion Cart — Premium Outlet & Fine Apparel",
  description: "Discover the heritage of Fashion Cart — blending timeless Indian craftsmanship with modern architectural silhouettes, certified pure fabrics, and premium everyday fashion.",
};

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Editorial Hero Banner */}
      <section className="relative bg-gradient-to-b from-[#F4EFEA] via-[#FAF8F5] to-[#F4EFEA] border-b border-[#E7DFD5] py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-widest text-[#8E6C0C]">
            <span>✦ The Fashion Cart Heritage</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#141416] leading-tight">
            Crafting Everyday Luxury.<br />
            <span className="text-[#C59B27]">Tailored for Confidence.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#4B4E56] max-w-2xl mx-auto leading-relaxed">
            Born out of a deep reverence for fine textiles and precision tailoring, Fashion Cart bridges the heritage of Indian master weavers with contemporary global silhouettes.
          </p>
        </div>
      </section>

      {/* Brand Philosophy & Story Grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">Our Origins</span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#141416] leading-tight">
              Where Ancient Loom Artistry Meets Modern Design
            </h2>
            <p className="text-xs sm:text-sm text-[#4B4E56] leading-relaxed">
              Founded with the vision to make authentic artisanal luxury accessible without unnecessary markups, Fashion Cart collaborates directly with certified master weavers in Varanasi, Chanderi, Surat, and Jaipur.
            </p>
            <p className="text-xs sm:text-sm text-[#4B4E56] leading-relaxed">
              Every garment in our catalog—from hand-embroidered velvet kurta sets to breathable 100% French linen shirts—is crafted with obsessive attention to seam strength, drape, and skin-friendly softness.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5]">
                <p className="text-2xl font-black text-[#141416]">100%</p>
                <p className="text-xs font-semibold text-[#141416] mt-0.5">Certified Pure Fabrics</p>
                <p className="text-[10px] text-[#787C87]">Mulberry silk, French linen, combed cotton</p>
              </div>
              <div className="p-4 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5]">
                <p className="text-2xl font-black text-[#141416]">6-Point</p>
                <p className="text-xs font-semibold text-[#141416] mt-0.5">Quality Inspection</p>
                <p className="text-[10px] text-[#787C87]">Hand-checked before every dispatch</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-[#E7DFD5]">
            <Image
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1000&auto=format&fit=crop&q=80"
              alt="Fashion Cart Master Tailoring Outlet"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/60 via-transparent to-transparent" />
            <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase bg-white text-[#141416] shadow-sm">
              ✨ Premium Outlet Craftsmanship
            </span>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Excellence */}
      <section className="bg-[#141416] text-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">The Fashion Cart Standard</span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold">What Sets Our Garments Apart</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-3xl">🌿</span>
              <h3 className="font-bold text-base text-white">Pure Natural Textiles</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                We strictly ban low-grade synthetic polyesters in our premium lines. Expect only breathable, organic, skin-pampering natural fibers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-3xl">✂️</span>
              <h3 className="font-bold text-base text-white">Precision Architectural Fit</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Calibrated across Indian standard body measurements for comfortable ease around shoulders, chest, and hips without bunching.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-3xl">🤝</span>
              <h3 className="font-bold text-base text-white">Fair Artisan Wages</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                We work directly with craft clusters, ensuring fair livelihood wages and preserving centuries-old zari, gota patti, and weaving heritage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-3xl">🛡️</span>
              <h3 className="font-bold text-base text-white">Transparent &amp; Certified</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Every purchase includes automated GST tax invoices, live courier tracking, free doorstep exchanges, and verified UPI security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Showroom & Atelier Logistics Hub */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl border border-[#E7DFD5] bg-[#F4EFEA] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FBF4E2] text-[#8E6C0C] border border-[#C59B27]/40">
              📍 Registered Office &amp; Outlet Hub
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141416]">
              Experience Fashion Cart in Siwan, Bihar
            </h2>
            <p className="text-xs sm:text-sm text-[#4B4E56] leading-relaxed">
              Visit our flagship boutique outlet to experience fabric textures in person, get personalized sizing consultations, or pick up custom tailored festival edits.
            </p>
            <div className="space-y-1.5 text-xs text-[#141416] font-medium">
              <p>📍 <strong>Registered Address:</strong> Sonar Toli, City: Siwan, State: Bihar, PIN: 841226</p>
              <p>⏰ <strong>Timings:</strong> Monday to Sunday: 10:00 AM – 9:00 PM IST</p>
              <p>📞 <strong>Direct Concierge:</strong> +91 9771039201</p>
              <p>✉️ <strong>Support Email:</strong> Fashioncart.support@gmail.com</p>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors shadow-sm"
              >
                Shop the Online Catalog →
              </Link>
              <a
                href="https://wa.me/919771039201?text=Hello%20Fashion%20Cart!%20I%20would%20like%20to%20book%20a%20showroom%20styling%20appointment."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-[#141416] border border-[#C59B27] bg-[#C59B27]/10 hover:bg-[#C59B27]/20 transition-colors flex items-center gap-1.5"
              >
                <span>💬</span> Book Styling Appointment
              </a>
            </div>
          </div>

          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md border border-[#E7DFD5]">
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80"
              alt="Fashion Cart Showroom Interior"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
