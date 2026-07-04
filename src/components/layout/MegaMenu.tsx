"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface MegaMenuProps {
    category: string;
    subcategories: string[];
    imageUrl: string;
    isOpen: boolean;
    themeColor?: string;
}

// "Shop All" pseudo-links don't map to a product subcategory — route them sensibly.
const SHOP_ALL_LINKS: Record<string, string> = {
    "Best Sellers": "/category/all?sort=featured",
    "New Arrivals": "/category/all?sort=newest",
    "Sale": "/category/all",
};

function subHref(category: string, sub: string): string {
    const cat = category.toLowerCase();
    if (cat.includes("all")) return SHOP_ALL_LINKS[sub] ?? "/category/all";
    return `/category/${cat}?subcategory=${encodeURIComponent(sub)}`;
}

export function MegaMenu({ category, subcategories, imageUrl, isOpen, themeColor = "bg-white" }: MegaMenuProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`absolute top-full mt-2 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl shadow-xl overflow-hidden z-50 rounded-2xl border border-gray-100 ${themeColor}`}
                >
                    <div className="px-6 md:px-10 py-5 flex gap-8 items-start">
                        {/* Left: Featured 4:3 Image */}
                        <div className="w-[180px] shrink-0">
                            <h3 className="font-heading font-medium text-[11px] tracking-widest uppercase text-gray-400 mb-2.5">
                                Featured
                            </h3>
                            <div className="relative aspect-[4/3] bg-[var(--color-brand-sand)] rounded-xl overflow-hidden shadow-sm">
                                <Image
                                    src={imageUrl}
                                    alt={category}
                                    fill
                                    className="object-cover"
                                    sizes="180px"
                                />
                            </div>
                        </div>

                        {/* Right: Content Grid */}
                        <div className="flex-1 border-l border-gray-100 pl-8">
                            <h3 className="font-heading font-bold text-base text-[var(--color-brand-onyx)] mb-3">
                                Shop {category}
                            </h3>
                            <ul className="columns-2 md:columns-3 gap-8 space-y-2">
                                {subcategories.map((sub, idx) => (
                                    <motion.li
                                        key={sub}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 + 0.1 }}
                                        className="break-inside-avoid shadow-none"
                                    >
                                        <Link
                                            href={subHref(category, sub)}
                                            className="font-sans text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] hover:font-medium transition-all duration-200 text-[13px] block py-0.5"
                                        >
                                            {sub}
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>

                            <Link
                                href={`/category/${category.toLowerCase()}`}
                                className="mt-4 text-[13px] font-sans font-bold text-[var(--color-brand-purple)] hover:text-[var(--color-brand-onyx)] transition-colors inline-flex items-center gap-1 group"
                            >
                                Browse Collection
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
