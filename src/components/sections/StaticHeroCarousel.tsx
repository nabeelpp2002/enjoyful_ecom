import Image from "next/image";
import Link from "next/link";

/** The homepage hero intentionally promotes only the Glow collection. */
export function StaticHeroCarousel() {
    return (
        <section className="relative w-full overflow-hidden bg-[#dff2ff] aspect-[941/1672] md:h-[min(110vh,1200px)] md:aspect-auto">
            <Link
                href="/category/glow"
                aria-label="Shop Enjoyful Life Glow Collection"
                className="group relative block h-full w-full"
            >
                <div className="relative h-full w-full md:hidden">
                    <Image
                        src="/assets/glow-hero-hd-mobile.webp"
                        alt="Enjoyful Life Glow Collection"
                        fill
                        priority
                        fetchPriority="high"
                        unoptimized
                        sizes="100vw"
                        className="object-cover transition-transform duration-1000 group-hover:scale-[1.01]"
                    />
                </div>
                <div className="relative hidden h-full w-full md:block">
                    <Image
                        src="/assets/glow-hero-hd-desktop.webp"
                        alt="Enjoyful Life Glow Collection"
                        fill
                        priority
                        fetchPriority="high"
                        unoptimized
                        sizes="100vw"
                        className="object-cover object-top transition-transform duration-1000 group-hover:scale-[1.01]"
                    />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#f2bd47]/65 via-transparent to-transparent md:bg-gradient-to-r md:from-white/55 md:via-white/10 md:to-transparent" />

                <div className="absolute inset-0 z-10 mx-auto flex w-full max-w-7xl items-end px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:items-center md:px-10 md:pb-0">
                    <div className="max-w-[72%] text-[#402216] md:max-w-md lg:max-w-lg">
                        <p className="editorial-label hidden text-[10px] tracking-[0.24em] text-[#8c4c31] md:block md:text-xs">Glow Collection</p>
                        <h1 className="editorial-section-heading text-[38px] leading-[0.92] sm:text-5xl md:mt-3 md:text-6xl lg:text-7xl">
                            Fresh Skin.<br />Natural Glow.
                        </h1>
                        <p className="editorial-body mt-4 hidden max-w-md text-sm leading-relaxed text-[#402216]/70 sm:block md:text-base">
                            Cleanse, polish, and protect with brightening essentials made for everyday radiance.
                        </p>
                        <span className="editorial-ui mt-5 inline-flex rounded-full bg-[#402216] px-5 py-3 text-xs font-semibold text-white shadow-lg transition-transform group-hover:scale-[1.03] md:mt-7 md:px-7 md:text-sm">
                            Shop the Glow Collection
                        </span>
                    </div>
                </div>
            </Link>
        </section>
    );
}
