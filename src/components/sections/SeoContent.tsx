"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SeoBlock } from "@/data/seo-content";

/**
 * Redesigned SEO content section for homepage optimization.
 *
 * UX Strategy:
 * - Show only the first paragraph as intro with "Learn More" CTA to About page
 * - Display only 3 key FAQ questions on homepage; link to full FAQ on Contact page
 * - All content remains in DOM for crawler indexing and structured data
 * - Hidden content is accessible but visually concealed for better mobile UX
 *
 * SEO Preservation:
 * - Full FAQ data in structured JSON-LD schema
 * - All hidden content in HTML (role="doc-note" marks content as supplementary)
 * - Maintains internal link equity through CTA links
 */
export function SeoContent({ data }: { data?: SeoBlock }) {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const FAQ_PREVIEW_COUNT = 3;

    if (!data) return null;

    const previewFaqs = data.faqs?.slice(0, FAQ_PREVIEW_COUNT) ?? [];
    const hasMoreFaqs = (data.faqs?.length ?? 0) > FAQ_PREVIEW_COUNT;

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
        <section className="w-full py-12 md:py-20 bg-gradient-to-b from-white to-[#fafaf8]" aria-label="About this collection">
            <div className="max-w-7xl mx-auto px-6 md:px-8">

                {/* Two-Column Layout: About Left + FAQ Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                    {/* LEFT COLUMN: Editorial Intro */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-heading font-bold text-2xl md:text-3xl lg:text-[32px] text-[var(--color-brand-onyx)] tracking-tight leading-[1.2] mb-6">
                            {data.heading}
                        </h2>

                        {/* First paragraph visible */}
                        {data.paragraphs && data.paragraphs.length > 0 && (
                            <p className="font-sans text-[15px] md:text-base text-[var(--color-brand-onyx)]/75 leading-relaxed mb-8">
                                {data.paragraphs[0]}
                            </p>
                        )}

                        {/* Hidden paragraphs for SEO - crawler can read but not visible */}
                        {data.paragraphs && data.paragraphs.length > 1 && (
                            <div className="sr-only" role="doc-note">
                                {data.paragraphs.slice(1).map((p, i) => (
                                    <p key={i} className="mb-4">
                                        {p}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Learn More CTA */}
                        <Link
                            href="/about"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-brand-onyx)] text-white font-sans font-medium text-sm hover:bg-[var(--color-brand-purple)] transition-colors duration-200 group"
                        >
                            Learn Our Story
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* RIGHT COLUMN: FAQ Preview Section */}
                    {data.faqs && data.faqs.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            >
                            <div className="flex items-center justify-between mb-6 lg:mb-8">
                                <h3 className="font-heading font-bold text-xl md:text-2xl text-[var(--color-brand-onyx)] tracking-tight">
                                    Quick Questions
                                </h3>
                                {hasMoreFaqs && (
                                    <Link
                                        href="/contact"
                                        className="hidden md:block font-sans text-xs lg:text-sm text-[var(--color-brand-purple)] hover:text-[var(--color-brand-purple)]/80 transition-colors font-medium whitespace-nowrap"
                                    >
                                        View All →
                                    </Link>
                                )}
                            </div>

                            {/* Preview FAQs - Visible */}
                            <div className="space-y-3">
                            {previewFaqs.map((f, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl overflow-hidden bg-white shadow-sm border border-[var(--color-brand-onyx)]/5 hover:shadow-md transition-shadow"
                                >
                                    <button
                                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                                        className="w-full px-5 py-4 md:py-5 flex justify-between items-start gap-4 text-left focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)] focus:ring-offset-2 rounded-xl"
                                        aria-expanded={faqOpen === i}
                                    >
                                        <span className="font-heading font-semibold text-[15px] md:text-base text-[var(--color-brand-onyx)] flex-1 leading-snug">
                                            {f.q}
                                        </span>
                                        {faqOpen === i ? (
                                            <ChevronUp size={18} className="text-[var(--color-brand-purple)] flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <ChevronDown size={18} className="text-[var(--color-brand-onyx)]/40 flex-shrink-0 mt-0.5" />
                                        )}
                                    </button>
                                    <AnimatePresence>
                                        {faqOpen === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="px-5 pb-4 md:pb-5"
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

                            {/* Hidden FAQs for SEO - In DOM but not visible */}
                            {data.faqs.length > FAQ_PREVIEW_COUNT && (
                                <div className="sr-only" role="doc-note">
                                    <div>
                                        {data.faqs.slice(FAQ_PREVIEW_COUNT).map((f, i) => (
                                            <div key={FAQ_PREVIEW_COUNT + i} className="mb-6">
                                                <h4 className="font-heading font-semibold mb-2">{f.q}</h4>
                                                <p className="text-[var(--color-brand-onyx)]/65">{f.a}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* View All CTA - Mobile */}
                            {hasMoreFaqs && (
                                <div className="mt-8 md:hidden text-center">
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--color-brand-onyx)]/20 text-[var(--color-brand-onyx)] font-sans font-medium text-sm hover:border-[var(--color-brand-purple)] hover:text-[var(--color-brand-purple)] transition-all duration-200 group"
                                    >
                                        Explore All Questions
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* FAQ JSON-LD Schema - All FAQs indexed */}
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
