"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ─── Cart SVG ──────────────────────────────────────────────────────────────
function CartIllustration() {
    return (
        <svg
            viewBox="0 0 200 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="w-full h-full"
        >
            <circle cx="100" cy="100" r="72" fill="#EDE8F5" />
            <rect x="58" y="72" width="78" height="52" rx="8" fill="white" stroke="#735697" strokeWidth="2.5" />
            <line x1="58" y1="88" x2="136" y2="88" stroke="#735697" strokeWidth="1.5" strokeOpacity="0.35" />
            <line x1="58" y1="104" x2="136" y2="104" strokeWidth="1.5" stroke="#735697" strokeOpacity="0.35" />
            <line x1="84" y1="72" x2="84" y2="124" stroke="#735697" strokeWidth="1.5" strokeOpacity="0.35" />
            <line x1="110" y1="72" x2="110" y2="124" stroke="#735697" strokeWidth="1.5" strokeOpacity="0.35" />
            <path d="M68 72 Q68 58 84 58 L116 58 Q132 58 132 72" stroke="#735697" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <line x1="44" y1="60" x2="68" y2="72" stroke="#735697" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="38" cy="57" r="5" fill="#735697" fillOpacity="0.2" stroke="#735697" strokeWidth="2" />
            <circle cx="74" cy="130" r="7" fill="white" stroke="#735697" strokeWidth="2.5" />
            <circle cx="120" cy="130" r="7" fill="white" stroke="#735697" strokeWidth="2.5" />
            <circle cx="74" cy="130" r="2.5" fill="#735697" />
            <circle cx="120" cy="130" r="2.5" fill="#735697" />
            <rect x="88" y="78" width="28" height="20" rx="4" fill="#F4B449" />
            <path d="M96 83 Q100 79 104 83" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <line x1="96" y1="90" x2="104" y2="90" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="94" y1="93" x2="106" y2="93" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="148" cy="68" r="3" fill="#735697" fillOpacity="0.4" />
            <circle cx="55" cy="62" r="2" fill="#F4B449" fillOpacity="0.6" />
            <circle cx="152" cy="112" r="2" fill="#F4B449" fillOpacity="0.5" />
            <circle cx="46" cy="100" r="2.5" fill="#735697" fillOpacity="0.3" />
        </svg>
    );
}

// ─── Wishlist SVG ──────────────────────────────────────────────────────────
function WishlistIllustration() {
    return (
        <svg
            viewBox="0 0 200 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="w-full h-full"
        >
            <circle cx="100" cy="95" r="72" fill="#EDE8F5" />
            <rect x="60" y="55" width="80" height="90" rx="10" fill="white" stroke="#735697" strokeWidth="2.5" />
            <rect x="84" y="48" width="32" height="16" rx="5" fill="white" stroke="#735697" strokeWidth="2.5" />
            <circle cx="100" cy="56" r="3.5" fill="#735697" fillOpacity="0.25" stroke="#735697" strokeWidth="1.5" />
            <path
                d="M100 85 C100 85 86 76 86 68 C86 63.5 89.5 60 94 60 C97 60 99.5 61.8 100 63 C100.5 61.8 103 60 106 60 C110.5 60 114 63.5 114 68 C114 76 100 85 100 85Z"
                fill="#735697"
                stroke="#735697"
                strokeWidth="0.5"
            />
            <line x1="72" y1="96" x2="128" y2="96" stroke="#735697" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
            <line x1="72" y1="106" x2="120" y2="106" stroke="#735697" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
            <line x1="72" y1="116" x2="114" y2="116" stroke="#735697" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
            <line x1="72" y1="126" x2="108" y2="126" stroke="#735697" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round" />
            <circle cx="68" cy="96" r="3" fill="#F4B449" />
            <circle cx="68" cy="106" r="3" fill="#F4B449" fillOpacity="0.6" />
            <circle cx="68" cy="116" r="3" fill="#F4B449" fillOpacity="0.4" />
            <circle cx="68" cy="126" r="3" fill="#F4B449" fillOpacity="0.25" />
            <circle cx="148" cy="68" r="3" fill="#735697" fillOpacity="0.35" />
            <circle cx="54" cy="72" r="2" fill="#F4B449" fillOpacity="0.6" />
            <circle cx="152" cy="110" r="2" fill="#F4B449" fillOpacity="0.5" />
            <circle cx="48" cy="105" r="2.5" fill="#735697" fillOpacity="0.25" />
        </svg>
    );
}

// ─── Shared EmptyState component ───────────────────────────────────────────
interface EmptyStateProps {
    variant: "cart" | "wishlist";
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
}

export function EmptyState({ variant, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center justify-center text-center px-4 py-12 sm:py-20"
        >
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="w-44 h-44 sm:w-52 sm:h-52 mb-6"
            >
                {variant === "cart" ? <CartIllustration /> : <WishlistIllustration />}
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="font-heading font-bold text-xl sm:text-2xl text-[var(--color-brand-onyx)] tracking-tight mb-2"
            >
                {title}
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28 }}
                className="font-sans text-sm text-[var(--color-brand-onyx)]/55 max-w-[260px] leading-relaxed mb-8"
            >
                {description}
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.36 }}
            >
                <Link href={ctaHref}>
                    <motion.span
                        whileHover={{ y: -2, boxShadow: "0 12px 28px rgba(244,180,73,0.35)" }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-block px-8 py-3.5 rounded-full bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] font-heading font-bold text-sm sm:text-base shadow-[0_6px_18px_rgba(244,180,73,0.25)] transition-shadow"
                    >
                        {ctaLabel}
                    </motion.span>
                </Link>
            </motion.div>
        </motion.div>
    );
}
