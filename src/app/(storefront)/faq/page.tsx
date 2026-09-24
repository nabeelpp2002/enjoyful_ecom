"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, HelpCircle, Truck, RefreshCw, ShieldCheck, CreditCard } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import Link from "next/link";
import { FAQ_CATEGORIES as CATEGORIES, FAQ_DATA } from "@/data/faq";

export default function FaqPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const filteredFaqs = FAQ_DATA.filter((item) => {
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || item.a.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen pb-16 sm:pb-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Frequently Asked Questions" }]} />

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-6 mb-10 sm:mb-14"
                >
                    <p className="editorial-label text-xs sm:text-sm text-[var(--color-brand-purple)] tracking-[0.25em] uppercase font-semibold mb-2">
                        Help &amp; Customer Support
                    </p>
                    <h1 className="editorial-title display-md font-extrabold text-3xl sm:text-4xl md:text-[50px] text-[var(--color-brand-onyx)] tracking-tight leading-tight">
                        Frequently Asked Questions
                    </h1>
                    <p className="mt-3 editorial-body text-sm sm:text-base text-[var(--color-brand-onyx)]/75 max-w-xl mx-auto">
                        Find quick answers regarding shipping in the UAE, product formulations, returns, and payment options.
                    </p>
                </motion.div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto mb-8 sm:mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-brand-onyx)]/40" />
                    <input
                        type="text"
                        placeholder="Search for questions (e.g. delivery, ingredients, returns)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm rounded-full border border-white/80 shadow-md text-sm editorial-body outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)] transition-all"
                    />
                </div>

                {/* Quick Info Feature Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-14">
                    <div className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/80 text-center flex flex-col items-center">
                        <Truck className="w-6 h-6 text-[var(--color-brand-purple)] mb-2" />
                        <h3 className="editorial-heading font-bold text-xs sm:text-sm text-[var(--color-brand-onyx)]">UAE Express</h3>
                        <p className="editorial-body text-[11px] text-[var(--color-brand-onyx)]/60">1-2 Day Delivery</p>
                    </div>
                    <div className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/80 text-center flex flex-col items-center">
                        <RefreshCw className="w-6 h-6 text-[var(--color-brand-purple)] mb-2" />
                        <h3 className="editorial-heading font-bold text-xs sm:text-sm text-[var(--color-brand-onyx)]">14-Day Returns</h3>
                        <p className="editorial-body text-[11px] text-[var(--color-brand-onyx)]/60">Hassle-Free Policy</p>
                    </div>
                    <div className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/80 text-center flex flex-col items-center">
                        <ShieldCheck className="w-6 h-6 text-[var(--color-brand-purple)] mb-2" />
                        <h3 className="editorial-heading font-bold text-xs sm:text-sm text-[var(--color-brand-onyx)]">Clean Formulations</h3>
                        <p className="editorial-body text-[11px] text-[var(--color-brand-onyx)]/60">100% Cruelty-Free</p>
                    </div>
                    <div className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/80 text-center flex flex-col items-center">
                        <CreditCard className="w-6 h-6 text-[var(--color-brand-purple)] mb-2" />
                        <h3 className="editorial-heading font-bold text-xs sm:text-sm text-[var(--color-brand-onyx)]">Secure Checkout</h3>
                        <p className="editorial-body text-[11px] text-[var(--color-brand-onyx)]/60">Cards, Apple Pay &amp; COD</p>
                    </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm editorial-body transition-all ${
                                selectedCategory === cat
                                    ? "bg-[var(--color-brand-purple)] text-white shadow-md font-semibold"
                                    : "bg-white/60 text-[var(--color-brand-onyx)]/70 hover:bg-white hover:text-[var(--color-brand-onyx)]"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* FAQ Accordion List */}
                <div className="space-y-3 sm:space-y-4">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-12 bg-white/60 rounded-2xl border border-white">
                            <HelpCircle className="w-10 h-10 text-[var(--color-brand-purple)]/40 mx-auto mb-3" />
                            <p className="editorial-body text-sm text-[var(--color-brand-onyx)]/70">No questions found matching your search criteria.</p>
                        </div>
                    ) : (
                        filteredFaqs.map((faq, idx) => {
                            const isOpen = openIndex === idx;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/80 backdrop-blur-xs rounded-2xl border border-white shadow-xs overflow-hidden"
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                                        className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-left gap-4"
                                    >
                                        <span className="editorial-heading font-bold text-sm sm:text-base text-[var(--color-brand-onyx)]">
                                            {faq.q}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 text-[var(--color-brand-purple)] flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 sm:px-6 sm:pb-6 editorial-body text-xs sm:text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed border-t border-[var(--color-brand-onyx)]/5 pt-3">
                                                    {faq.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Need Help Banner */}
                <div className="mt-12 text-center p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/80">
                    <h3 className="editorial-heading font-bold text-lg sm:text-xl text-[var(--color-brand-onyx)] mb-2">Still have questions?</h3>
                    <p className="editorial-body text-xs sm:text-sm text-[var(--color-brand-onyx)]/70 max-w-md mx-auto mb-5">
                        Our customer care team in Dubai is available to assist you with order inquiries, product recommendations, and routine advice.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--color-brand-onyx)] text-white editorial-body text-xs sm:text-sm font-semibold hover:bg-[var(--color-brand-purple)] transition-colors"
                    >
                        Contact Customer Support
                    </Link>
                </div>
            </div>
        </div>
    );
}
