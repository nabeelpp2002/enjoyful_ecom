"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { usePathname } from "next/navigation";

const footerLinks = [
    { label: "Play & Discover", href: "/404" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Shop", href: "/category/all" },
    { label: "Contact", href: "/contact" },
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Terms", href: "/terms-of-service" },
    { label: "Privacy", href: "/privacy-policy" },
];

export function Footer() {
    const pathname = usePathname();
    const mobileVisibility = pathname === "/" ? "block" : "hidden md:block";

    return (
        <footer data-site-footer className={`${mobileVisibility} relative isolate min-h-[800px] overflow-hidden bg-[#fafaf8] md:min-h-[900px]`}>
            <Image
                src="/assets/footer-products-mobile.webp"
                alt="Enjoyful Life products in a bright garden"
                fill
                sizes="100vw"
                className="-z-30 object-cover object-center md:hidden"
                style={{
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%)",
                    maskImage: "linear-gradient(to bottom, transparent 0%, black 20%)",
                }}
            />
            <Image
                src="/assets/footer-products-v5.webp"
                alt="Enjoyful Life products in a bright garden"
                fill
                sizes="100vw"
                className="-z-30 hidden object-cover object-[center_48%] md:block"
                style={{
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%)",
                    maskImage: "linear-gradient(to bottom, transparent 0%, black 20%)",
                }}
            />
            <div className="absolute inset-x-0 bottom-0 -z-20 h-[32%] bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

            <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-16 text-center sm:pt-20 md:pt-24">
                <p className="editorial-label text-[10px] tracking-[0.26em] text-[var(--color-brand-onyx)]/60">Enjoyful Life</p>
                <h2 className="editorial-section-heading mt-4 max-w-2xl text-4xl text-[var(--color-brand-onyx)] sm:text-5xl md:text-6xl">
                    Everyday care, made to feel joyful.
                </h2>
                <p className="editorial-body mt-4 max-w-lg text-sm text-[var(--color-brand-onyx)]/65 md:text-base">
                    Thoughtful essentials for skin, home, and the little routines that make life better.
                </p>

                <form className="mt-8 flex w-full max-w-[650px] items-center gap-2 rounded-[1.35rem] bg-[#48564b]/90 p-2.5 shadow-[0_18px_45px_rgba(38,49,39,.28)] backdrop-blur-md" onSubmit={(event) => event.preventDefault()}>
                    <div className="hidden shrink-0 items-center gap-2 px-2 text-left text-white sm:flex">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                            <Image src="/favicon-32x32.png" alt="" width={22} height={22} />
                        </span>
                        <span className="editorial-body text-[11px] font-semibold leading-tight">Enjoyful<br />Life</span>
                    </div>
                    <label htmlFor="footer-email" className="sr-only">Email address</label>
                    <input id="footer-email" type="email" placeholder="Enter your email" className="editorial-body min-w-0 flex-1 rounded-xl bg-white/12 px-4 py-3 text-sm text-white outline-none placeholder:text-white/55 focus:bg-white/18" />
                    <button type="submit" className="editorial-body shrink-0 rounded-xl bg-[var(--color-brand-mustard)] px-5 py-3 text-sm font-semibold text-[var(--color-brand-onyx)] transition-transform hover:scale-[1.02] sm:px-7">Subscribe</button>
                </form>
            </div>

            <div className="absolute inset-x-0 bottom-24 px-5 text-center text-white md:bottom-28">
                <p className="editorial-body text-xs text-white/80">Clean care for every part of life</p>
                <p className="editorial-section-heading mt-1 text-4xl drop-shadow-md md:text-5xl">Enjoyful Life</p>
            </div>

            <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-white md:px-10 md:pb-7">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/25 pt-4 md:flex-row">
                    <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                        {footerLinks.map((link) => (
                            <Link key={link.label} href={link.href} className="editorial-body text-xs font-medium text-white/75 transition-colors hover:text-white">{link.label}</Link>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                        <a href="https://instagram.com/enjoyfullife" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
                        <a href="https://facebook.com/enjoyfullife" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
                        <a href="https://youtube.com/enjoyfullife" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube className="h-4 w-4" /></a>
                        <p className="editorial-body text-xs text-white/65">© {new Date().getFullYear()} Enjoyful Life</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
