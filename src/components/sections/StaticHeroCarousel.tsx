import Image from "next/image";
import Link from "next/link";

/** The homepage hero intentionally promotes only the Glow collection. */
export function StaticHeroCarousel() {
    return (
        <section className="relative w-full overflow-hidden bg-[#dff2ff] aspect-[941/1672] md:h-[min(110vh,1200px)] md:aspect-auto">
            <Link
                href="/category/glow"
                aria-label="Shop Enjoyful Life Glow Collection"
                className="relative block h-full w-full"
            >
                <div className="relative h-full w-full md:hidden">
                    <Image
                        src="/assets/glow-carousel-1-mobile.webp"
                        alt="Enjoyful Life Glow Collection"
                        fill
                        priority
                        fetchPriority="high"
                        unoptimized
                        sizes="100vw"
                        className="object-cover"
                    />
                </div>
                <div className="relative hidden h-full w-full md:block">
                    <Image
                        src="/assets/glow-carousel-1-desktop.webp"
                        alt="Enjoyful Life Glow Collection"
                        fill
                        priority
                        fetchPriority="high"
                        unoptimized
                        sizes="100vw"
                        className="object-cover object-center"
                    />
                </div>
            </Link>
        </section>
    );
}
