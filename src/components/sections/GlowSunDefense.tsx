import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sun } from "lucide-react";

export function GlowSunDefense() {
    return (
        <section aria-labelledby="glow-sun-defense-title" className="bg-[#fffaf9] py-10 sm:py-14 md:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-8">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#f5a8b2] shadow-[0_20px_60px_rgba(134,65,78,.16)] sm:aspect-[16/9] md:rounded-[2.5rem] lg:aspect-[2/1]">
                    <Image
                        src="/assets/glow-sun-defense-mobile.webp"
                        alt="Woman holding Enjoyful Life SPF 50+ sunscreen"
                        fill
                        sizes="(max-width: 639px) 100vw, 1px"
                        className="object-cover object-center sm:hidden"
                    />
                    <Image
                        src="/assets/glow-sun-defense-desktop.webp"
                        alt="Woman holding Enjoyful Life SPF 50+ sunscreen"
                        fill
                        sizes="(min-width: 1280px) 1216px, 100vw"
                        className="hidden object-cover object-center sm:block"
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/5 to-transparent" />

                    <div className="absolute inset-0 flex items-start p-6 sm:items-center sm:p-10 md:p-14 lg:p-16">
                        <div className="flex max-w-[62%] flex-col items-start sm:max-w-[44%] lg:max-w-[40%]">
                            <span className="editorial-label rounded-full bg-[var(--color-brand-onyx)] px-3 py-1.5 text-[9px] tracking-[0.2em] text-white sm:text-[10px]">
                                Glow essential
                            </span>

                            <h2 id="glow-sun-defense-title" className="editorial-section-heading mt-4 text-[38px] leading-[0.92] text-[var(--color-brand-onyx)] sm:text-5xl md:text-6xl lg:text-7xl">
                                Complete Sun Defence
                            </h2>

                            <div className="mt-5 flex items-center gap-2 rounded-full bg-[var(--color-brand-onyx)] px-4 py-2 text-white shadow-sm sm:mt-6">
                                <Sun className="h-4 w-4" strokeWidth={1.8} />
                                <span className="editorial-ui text-xs font-semibold tracking-wide sm:text-sm">SPF 50+</span>
                            </div>

                            <div className="mt-3 hidden items-center gap-2 rounded-full bg-white/60 px-3 py-2 text-[var(--color-brand-onyx)] shadow-sm backdrop-blur-md sm:mt-4 sm:flex sm:px-4">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#bd596d]" strokeWidth={1.8} />
                                <span className="editorial-body text-[10px] font-medium sm:text-xs">Protect &amp; Glow with UV protection</span>
                            </div>

                            <Link
                                href="/category/glow?subcategory=Sunscreen"
                                className="editorial-ui mt-5 hidden items-center gap-2 text-xs font-semibold text-[var(--color-brand-onyx)] underline decoration-black/30 underline-offset-4 transition-colors hover:decoration-black sm:mt-7 sm:inline-flex sm:text-sm"
                            >
                                Shop sunscreen
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 z-10 flex max-w-[58%] flex-col items-start sm:hidden">
                        <div className="flex items-center gap-2 rounded-2xl bg-white/75 px-3 py-2.5 text-[var(--color-brand-onyx)] shadow-sm backdrop-blur-md">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#bd596d]" strokeWidth={1.8} />
                            <span className="editorial-body text-[10px] font-semibold leading-snug">Protect &amp; Glow with UV protection</span>
                        </div>
                        <Link
                            href="/category/glow?subcategory=Sunscreen"
                            className="editorial-ui mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-onyx)] underline decoration-black/30 underline-offset-4"
                        >
                            Shop sunscreen
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
