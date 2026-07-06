import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
    title: "Skincare Journal | Enjoyful Life UAE",
    description:
        "The Enjoyful Life Skincare Journal — expert guides on natural skincare, body and hair care, baby care and fragrance for the UAE. Coming soon.",
    alternates: { canonical: "https://enjoyfullife.com/blog" },
};

export default function BlogPage() {
    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Journal" }]} />

                <div className="max-w-2xl mx-auto text-center py-16 md:py-24">
                    <p className="font-sans text-xs font-semibold text-[var(--color-brand-purple)] tracking-widest uppercase mb-4">
                        Skincare Journal
                    </p>
                    <h1 className="font-heading font-bold text-3xl md:text-[44px] text-[var(--color-brand-onyx)] tracking-tight leading-[1.1] mb-5">
                        Expert guides, coming soon
                    </h1>
                    <p className="font-sans text-base text-[var(--color-brand-onyx)]/70 leading-relaxed mb-8">
                        We&apos;re crafting a journal of practical skincare, body care, baby care and fragrance
                        guides — written for life in the UAE. In the meantime, explore our
                        collections or reach out for personalised routine advice.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/category/glow"
                            className="px-6 py-3 rounded-full bg-[var(--color-brand-onyx)] text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            Shop the Collections
                        </Link>
                        <Link
                            href="/contact"
                            className="px-6 py-3 rounded-full border border-[var(--color-brand-onyx)]/15 text-[var(--color-brand-onyx)] font-heading font-bold text-sm hover:border-[var(--color-brand-onyx)]/40 transition-colors"
                        >
                            Ask Our Team
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
