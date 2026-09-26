import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, Leaf, ShieldCheck } from "lucide-react";

export function SkinDeservesSection() {
    return (
        <section className="bg-[#f5f4ef] py-16 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="editorial-section-heading max-w-lg text-[34px] text-[var(--color-brand-onyx)] sm:text-[42px] lg:text-[48px]">
                            Why your skin deserves the best
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 md:pb-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9e2d8] text-[#735a43]">
                            <Heart className="h-4 w-4" strokeWidth={1.6} />
                        </span>
                        <div className="text-left">
                            <p className="editorial-body text-xs font-medium text-[var(--color-brand-onyx)]">Loved by our community</p>
                            <p className="editorial-body mt-0.5 text-[11px] text-[var(--color-brand-onyx)]/55">Made for real, everyday routines</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.18fr_.82fr] lg:grid-rows-2">
                    <article className="group sticky top-[18svh] z-10 h-[440px] overflow-hidden rounded-[1.75rem] shadow-[0_12px_32px_rgba(31,28,24,.08)] sm:h-[570px] md:relative md:top-auto md:z-auto md:h-auto md:min-h-[570px] md:shadow-none lg:row-span-2 lg:min-h-[680px]">
                        <Image src="/assets/skin-deserves-editorial.png" alt="Healthy, naturally radiant skin" fill sizes="(max-width: 1023px) 100vw, 58vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-[0_12px_35px_rgba(0,0,0,.12)] backdrop-blur-sm sm:right-auto sm:max-w-[280px] sm:p-5">
                            <h3 className="editorial-heading text-lg">Proven everyday care</h3>
                            <p className="editorial-body mt-1.5 text-xs leading-relaxed text-[var(--color-brand-onyx)]/60">Thoughtful formulas made to cleanse, comfort, and reveal your natural glow.</p>
                        </div>
                    </article>

                    <article className="sticky top-[18svh] z-20 h-[440px] overflow-hidden rounded-[1.75rem] bg-[#e7e2d8] p-7 shadow-[0_12px_32px_rgba(31,28,24,.08)] sm:h-[570px] sm:p-9 md:relative md:top-auto md:z-auto md:h-auto md:min-h-[310px] md:shadow-none lg:min-h-0">
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[62%] bg-gradient-to-r from-[#e7e2d8] via-[#e7e2d8]/90 to-transparent md:hidden" />
                        <div className="relative z-10 max-w-[48%]">
                            <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#594a37]"><ShieldCheck className="h-4 w-4" /></div>
                            <p className="editorial-label mb-2 text-[10px] text-[var(--color-brand-onyx)]/50">Mindful beauty</p>
                            <h3 className="editorial-section-heading text-3xl text-[var(--color-brand-onyx)] sm:text-4xl">Skin-loving essentials</h3>
                            <p className="editorial-body mt-3 text-xs leading-relaxed text-[var(--color-brand-onyx)]/60">Simple care made for the rituals you return to every day.</p>
                        </div>
                        <Image src="/assets/product-images/walnut-face-scrub/img-1-50.jpeg" alt="Enjoyful Life walnut face scrub" fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 20vw" className="object-cover object-[15%_center] mix-blend-multiply md:object-right" />
                        <Link href="/category/glow" aria-label="Explore glow collection" className="absolute bottom-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-onyx)] text-white transition-transform hover:scale-105"><ArrowUpRight className="h-4 w-4" /></Link>
                    </article>

                    <article className="sticky top-[18svh] z-30 h-[440px] overflow-hidden rounded-[1.75rem] bg-[#33412f] p-7 text-white shadow-[0_12px_32px_rgba(31,28,24,.08)] sm:h-[570px] sm:p-9 md:relative md:top-auto md:z-auto md:h-auto md:min-h-[310px] md:shadow-none lg:min-h-0">
                        <Image src="/assets/about_ingredients.png" alt="Aloe vera and botanical ingredients" fill sizes="(max-width: 1023px) 100vw, 40vw" className="object-cover opacity-35 mix-blend-luminosity" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#293725] via-[#33412f]/90 to-transparent" />
                        <div className="relative z-10 flex h-full max-w-sm flex-col justify-between">
                            <Leaf className="h-8 w-8 text-[#d7e2b8]" strokeWidth={1.3} />
                            <div className="mt-16">
                                <p className="editorial-label mb-2 text-[10px] text-white/55">Powered by nature</p>
                                <h3 className="editorial-section-heading text-4xl sm:text-5xl">100% inspired by natural goodness</h3>
                                <div className="editorial-body mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/70">
                                    <span>Plant-inspired care</span><span>Everyday comfort</span><span>Gentle routines</span>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}
