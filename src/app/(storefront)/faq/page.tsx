"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, HelpCircle, Truck, RefreshCw, ShieldCheck, CreditCard } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import Link from "next/link";

interface FaqItem {
    q: string;
    a: string;
    category: string;
}

const FAQ_DATA: FaqItem[] = [
    // Delivery & Shipping
    { category: "Shipping & Delivery", q: "Where does enJoyful Life deliver?", a: "We deliver across all seven Emirates in the UAE (Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain) as well as select GCC countries." },
    { category: "Shipping & Delivery", q: "How long does shipping take in the UAE?", a: "Standard delivery in Dubai and Abu Dhabi takes 1–2 business days. Delivery to other Emirates typically takes 2–3 business days." },
    { category: "Shipping & Delivery", q: "Is shipping free?", a: "We offer complimentary standard shipping on all UAE orders over AED 200. Orders below AED 200 incur a nominal flat shipping fee of AED 15." },
    { category: "Shipping & Delivery", q: "Can I track my order?", a: "Yes, once your order is dispatched, you will receive an SMS and email notification with your live tracking link." },

    // Products & Usage
    { category: "Products & Usage", q: "Are enJoyful Life products cruelty-free?", a: "Yes, 100%. None of our ingredients or finished products are tested on animals, and we strictly partner with ethically certified suppliers." },
    { category: "Products & Usage", q: "Are your formulas suitable for the UAE climate?", a: "Absolutely. Our textures are formulated specifically for hot, humid climates and air-conditioned interiors — lightweight, non-greasy, fast-absorbing, and non-comedogenic." },
    { category: "Products & Usage", q: "Do your products contain harsh chemicals or parabens?", a: "No. All enJoyful Life products are formulated without parabens, sulfates (SLS/SLES), phthalates, mineral oil, or synthetic dyes." },
    { category: "Products & Usage", q: "How should I store skincare products in a warm climate?", a: "Keep products in a dry place away from direct sunlight and excessive heat. Room temperature (below 25°C) is ideal." },

    // Returns & Refunds
    { category: "Returns & Refunds", q: "What is your return policy?", a: "Under UAE Consumer Protection regulations, we offer a 14-day return window for unopened, sealed products in their original packaging, or if an item arrives damaged/defective." },
    { category: "Returns & Refunds", q: "How do I request a return?", a: "You can request a return by contacting our customer care team via email at support@enjoyfullife.ae or through our Contact Us page with your order details." },
    { category: "Returns & Refunds", q: "When will I receive my refund?", a: "Once your returned items are received and inspected at our warehouse, credit card refunds are processed within 5–7 business days to your original payment method." },

    // Payment & Ordering
    { category: "Payments & Orders", q: "What payment methods do you accept?", a: "We accept Visa, MasterCard, Apple Pay, Google Pay, and Cash on Delivery (COD) across the UAE." },
    { category: "Payments & Orders", q: "Is my payment security guaranteed?", a: "Yes. All online payments are encrypted using 256-bit SSL encryption via PCI-DSS compliant payment gateways." },
    { category: "Payments & Orders", q: "Can I cancel or modify my order after placing it?", a: "Orders are processed quickly. If you need to cancel or modify an order, please contact customer support within 1 hour of placing it." },
];

const CATEGORIES = ["All", "Shipping & Delivery", "Products & Usage", "Returns & Refunds", "Payments & Orders"];

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
                    <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-purple)] tracking-[0.25em] uppercase font-semibold mb-2">
                        Help &amp; Customer Support
                    </p>
                    <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-[50px] text-[var(--color-brand-onyx)] tracking-tight leading-tight">
                        Frequently Asked Questions
                    </h1>
                    <p className="mt-3 font-sans text-sm sm:text-base text-[var(--color-brand-onyx)]/75 max-w-xl mx-auto">
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
                        className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm rounded-full border border-white/80 shadow-md text-sm font-sans outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)] transition-all"
                    />
                </div>

                {/* Quick Info Feature Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-14">
                    <div className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/80 text-center flex flex-col items-center">
                        <Truck className="w-6 h-6 text-[var(--color-brand-purple)] mb-2" />
                        <h3 className="font-heading font-bold text-xs sm:text-sm text-[var(--color-brand-onyx)]">UAE Express</h3>
                        <p className="font-sans text-[11px] text-[var(--color-brand-onyx)]/60">1-2 Day Delivery</p>
                    </div>
                    <div className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/80 text-center flex flex-col items-center">
                        <RefreshCw className="w-6 h-6 text-[var(--color-brand-purple)] mb-2" />
                        <h3 className="font-heading font-bold text-xs sm:text-sm text-[var(--color-brand-onyx)]">14-Day Returns</h3>
                        <p className="font-sans text-[11px] text-[var(--color-brand-onyx)]/60">Hassle-Free Policy</p>
                    </div>
                    <div className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/80 text-center flex flex-col items-center">
                        <ShieldCheck className="w-6 h-6 text-[var(--color-brand-purple)] mb-2" />
                        <h3 className="font-heading font-bold text-xs sm:text-sm text-[var(--color-brand-onyx)]">Clean Formulations</h3>
                        <p className="font-sans text-[11px] text-[var(--color-brand-onyx)]/60">100% Cruelty-Free</p>
                    </div>
                    <div className="p-4 bg-white/60 backdrop-blur-xs rounded-2xl border border-white/80 text-center flex flex-col items-center">
                        <CreditCard className="w-6 h-6 text-[var(--color-brand-purple)] mb-2" />
                        <h3 className="font-heading font-bold text-xs sm:text-sm text-[var(--color-brand-onyx)]">Secure Checkout</h3>
                        <p className="font-sans text-[11px] text-[var(--color-brand-onyx)]/60">Cards, Apple Pay &amp; COD</p>
                    </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-sans transition-all ${
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
                            <p className="font-sans text-sm text-[var(--color-brand-onyx)]/70">No questions found matching your search criteria.</p>
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
                                        <span className="font-heading font-bold text-sm sm:text-base text-[var(--color-brand-onyx)]">
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
                                                <div className="px-5 pb-5 sm:px-6 sm:pb-6 font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed border-t border-[var(--color-brand-onyx)]/5 pt-3">
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
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--color-brand-onyx)] mb-2">Still have questions?</h3>
                    <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/70 max-w-md mx-auto mb-5">
                        Our customer care team in Dubai is available to assist you with order inquiries, product recommendations, and routine advice.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--color-brand-onyx)] text-white font-sans text-xs sm:text-sm font-semibold hover:bg-[var(--color-brand-purple)] transition-colors"
                    >
                        Contact Customer Support
                    </Link>
                </div>
            </div>
        </div>
    );
}
