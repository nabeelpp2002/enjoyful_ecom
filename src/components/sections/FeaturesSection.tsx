import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function FeaturesSection() {
    return (
        <section className="bg-[#f7f0e5] py-14 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-8">
                <div className="mx-auto mb-9 flex max-w-6xl flex-col items-start gap-5 text-left sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
                    <h2 className="editorial-section-heading text-[38px] leading-[0.94] text-[#2d1913] sm:text-5xl lg:text-[58px]">
                        <span className="block">Why Choose</span>
                        <span className="block">Enjoyful Life</span>
                    </h2>
                    <Link
                        href="/category/all"
                        className="editorial-ui inline-flex shrink-0 items-center gap-2 rounded-full bg-[#2d1913] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                    >
                        Explore All Products
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="mx-auto grid max-w-6xl auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4 lg:auto-rows-[210px] lg:grid-cols-3">
                    <article className="flex flex-col items-center justify-center rounded-[1.5rem] bg-[#71331f] p-4 text-center text-white sm:p-7">
                        <h3 className="editorial-heading text-base font-semibold leading-tight sm:text-2xl">Natural ingredients</h3>
                        <p className="editorial-body mt-2 max-w-[220px] text-[9px] leading-relaxed text-white/70 sm:text-xs">
                            Skin-loving ingredients selected for thoughtful everyday care.
                        </p>
                    </article>

                    <article className="flex flex-col items-center justify-center rounded-[1.5rem] bg-[#f29a08] p-4 text-center text-[#3e2118] sm:p-7">
                        <h3 className="editorial-heading text-base font-semibold leading-tight sm:text-2xl">Eco-friendly packaging</h3>
                        <p className="editorial-body mt-2 max-w-[220px] text-[9px] leading-relaxed text-[#3e2118]/65 sm:text-xs">
                            Considered choices that care for you and our planet.
                        </p>
                    </article>

                    <article className="group relative row-span-2 overflow-hidden rounded-[1.5rem] bg-[#f36f7d]">
                        <Image
                            src="/assets/why-skin-sunscreen-hand.webp"
                            alt="Enjoyful Life SPF 50+ sunscreen held against a coral background"
                            fill
                            sizes="(max-width: 1023px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                        />
                    </article>

                    <article className="group relative row-span-2 overflow-hidden rounded-[1.5rem] bg-[#178ecc]">
                        <Image
                            src="/assets/why-skin-blue-hands.webp"
                            alt="Enjoyful Life Glow products held against a bright blue sky"
                            fill
                            sizes="(max-width: 1023px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                        />
                    </article>

                    <article className="group relative overflow-hidden rounded-[1.5rem] bg-[#d7855d]">
                        <Image
                            src="/assets/why-skin-glow-group.webp"
                            alt="Enjoyful Life products with citrus and walnut ingredients"
                            fill
                            sizes="(max-width: 1023px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                        />
                    </article>

                    <article className="flex flex-col items-center justify-center rounded-[1.5rem] bg-[#ef6e79] p-4 text-center text-white sm:p-7">
                        <h3 className="editorial-heading text-base font-semibold leading-tight sm:text-2xl">Cruelty-free. Premium quality.</h3>
                        <p className="editorial-body mt-2 max-w-[220px] text-[9px] leading-relaxed text-white/75 sm:text-xs">
                            Kind formulas, carefully crafted for routines you can trust.
                        </p>
                    </article>

                    <article className="group relative col-span-2 overflow-hidden rounded-[1.5rem] bg-[#efb1b2] lg:col-span-1">
                        <Image
                            src="/assets/why-skin-glow-flatlay.webp"
                            alt="Enjoyful Life products arranged on a blush background"
                            fill
                            sizes="(max-width: 1023px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                        />
                    </article>
                </div>

            </div>
        </section>
    );
}
