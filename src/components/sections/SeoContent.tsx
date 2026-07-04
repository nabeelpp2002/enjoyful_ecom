"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import type { SeoBlock } from "@/data/seo-content";

/**
 * Reusable SEO content section rendered ABOVE the footer.
 * Purely additive — uses existing brand tokens, typography, container width and the
 * same accordion pattern as the product page. Adds no new design language.
 *
 * Content text is server-rendered (client components are SSR'd in Next.js), so the
 * copy + FAQ questions/answers are in the initial HTML for crawlers. The accordion
 * only hydrates the open/close interaction.
 */
export function SeoContent({ data }: { data?: SeoBlock }) {
    const [open, setOpen] = useState<number | null>(0);
    if (!data) return null;

    const faqJsonLd =
        data.faqs && data.faqs.length > 0
            ? {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: data.faqs.map((f) => ({
                      "@type": "Question",
                      name: f.q,
                      acceptedAnswer: { "@type": "Answer", text: f.a },
                  })),
              }
            : null;

    return (
        <section className="w-full py-14 md:py-20" aria-label="About this collection">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Editorial content block */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="font-heading font-bold text-2xl md:text-[32px] text-[var(--color-brand-onyx)] tracking-tight leading-[1.15] mb-4">
                        {data.heading}
                    </h2>
                    <div className="space-y-4">
                        {data.paragraphs.map((p, i) => (
                            <p
                                key={i}
                                className="font-sans text-[15px] md:text-base text-[var(--color-brand-onyx)]/70 leading-relaxed"
                            >
                                {p}
                            </p>
                        ))}
                    </div>
                </motion.div>

                {/* Contextual internal links */}
                {data.links && data.links.length > 0 && (
                    <div className="mt-8">
                        <p className="font-sans text-xs font-semibold text-[var(--color-brand-onyx)]/45 uppercase tracking-widest mb-3">
                            Explore more
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                            {data.links.map((l, i) => (
                                <Link
                                    key={i}
                                    href={l.href}
                                    className="px-4 py-2 rounded-full border border-[var(--color-brand-onyx)]/12 font-sans text-sm font-medium text-[var(--color-brand-onyx)]/70 hover:border-[var(--color-brand-purple)]/40 hover:text-[var(--color-brand-purple)] transition-all duration-200"
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* FAQ accordion (matches the product-page accordion pattern) */}
                {data.faqs && data.faqs.length > 0 && (
                    <div className="mt-12 md:mt-16">
                        <h3 className="font-heading font-bold text-xl md:text-2xl text-[var(--color-brand-onyx)] tracking-tight mb-5">
                            Frequently Asked Questions
                        </h3>
                        <div className="space-y-3">
                            {data.faqs.map((f, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl overflow-hidden bg-white shadow-sm border border-[var(--color-brand-onyx)]/5"
                                >
                                    <button
                                        onClick={() => setOpen(open === i ? null : i)}
                                        className="w-full px-5 py-4 flex justify-between items-center gap-4 text-left focus:outline-none"
                                        aria-expanded={open === i}
                                    >
                                        <span className="font-heading font-semibold text-[15px] md:text-base text-[var(--color-brand-onyx)]">
                                            {f.q}
                                        </span>
                                        {open === i ? (
                                            <ChevronUp size={18} className="text-[var(--color-brand-purple)] flex-shrink-0" />
                                        ) : (
                                            <ChevronDown size={18} className="text-[var(--color-brand-purple)] flex-shrink-0" />
                                        )}
                                    </button>
                                    <AnimatePresence>
                                        {open === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="px-5 pb-4"
                                            >
                                                <p className="font-sans text-sm md:text-[15px] text-[var(--color-brand-onyx)]/65 leading-relaxed">
                                                    {f.a}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {faqJsonLd && (
                    <script
                        type="application/ld+json"
                        suppressHydrationWarning
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                    />
                )}
            </div>
        </section>
    );
}
