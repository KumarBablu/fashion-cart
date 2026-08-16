import Link from "next/link";
import Image from "next/image";

const CATEGORY_AVATARS = [
  {
    name: "Ethnic Kurtis",
    slug: "women-kurtis",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80",
    badge: "Trending",
  },
  {
    name: "Silk Sarees",
    slug: "women-kurtis",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=80",
    badge: "Festive",
  },
  {
    name: "Men's Shirts",
    slug: "men-shirts",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=80",
    badge: "Pure Linen",
  },
  {
    name: "Denim Jeans",
    slug: "men-jeans",
    image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400&auto=format&fit=crop&q=80",
    badge: "Stretch",
  },
  {
    name: "Designer Dresses",
    slug: "women-dresses",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80",
    badge: "Anarkalis",
  },
  {
    name: "Kids Wear",
    slug: "kids-wear",
    image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=400&auto=format&fit=crop&q=80",
    badge: "Cotton",
  },
];

export default function CategoryStoryBar() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Shop by Department
        </h3>
        <Link href="/categories" className="text-xs font-bold text-slate-700 hover:text-amber-700 transition-colors">
          All Categories →
        </Link>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2">
        {CATEGORY_AVATARS.map((cat) => (
          <Link
            key={cat.name}
            href={`/shop?category=${cat.slug}`}
            className="flex flex-col items-center gap-2 group shrink-0"
          >
            {/* Story Circle Avatar */}
            <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full p-0.5 border-2 border-slate-200 group-hover:border-amber-600 group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 bg-white">
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="100px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full text-[8px] font-extrabold uppercase bg-slate-900 text-white shadow-xs whitespace-nowrap">
                {cat.badge}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-amber-700 transition-colors text-center max-w-[80px] sm:max-w-[90px] truncate">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
