"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    ShoppingCart,
    X,
    LayoutGrid,
    Sparkles,
    Baby,
    Sun,
    SprayCan,
    User,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { AuthModal } from "./AuthModal";

const CATEGORIES = [
    { name: "Glow", href: "/category/glow", icon: Sparkles, bg: "bg-[#F0EDF6]" },
    { name: "Baby", href: "/category/baby", icon: Baby, bg: "bg-[#E6F0F9]" },
    { name: "Daily", href: "/category/daily", icon: Sun, bg: "bg-[#FBEBE5]" },
    { name: "Fragrances", href: "/category/fragrances", icon: SprayCan, bg: "bg-[#F5EFF8]" },
    { name: "Home Care", href: "/category/home-care", icon: Home, bg: "bg-[#EAF3EB]" },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { getCartCount, isAuthenticated } = useData();
    const [shopOpen, setShopOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const cartCount = getCartCount();

    const handleProfileClick = () => {
        if (isAuthenticated) router.push("/profile");
        else setAuthModalOpen(true);
    };

    const isCartActive = pathname === "/cart";
    const isProfileActive = pathname === "/profile";

    return (
        <>
            <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-white/95 backdrop-blur-lg border-t border-[var(--color-brand-onyx)]/10 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-16 px-4">
                    {/* Home */}
                    <Link
                        href="/"
                        className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
                    >
                        <Home
                            size={22}
                            strokeWidth={pathname === "/" ? 2 : 1.5}
                            className={pathname === "/" ? "text-[var(--color-brand-purple)]" : "text-[var(--color-brand-onyx)]/60"}
                        />
                        <span className={`text-[10px] font-sans ${pathname === "/" ? "text-[var(--color-brand-purple)] font-semibold" : "text-[var(--color-brand-onyx)]/60"}`}>
                            Home
                        </span>
                    </Link>

                    {/* Shop — opens the categories bottom sheet */}
                    <button
                        onClick={() => setShopOpen(true)}
                        className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
                        aria-label="Open categories"
                    >
                        <LayoutGrid
                            size={22}
                            strokeWidth={shopOpen ? 2 : 1.5}
                            className={shopOpen ? "text-[var(--color-brand-purple)]" : "text-[var(--color-brand-onyx)]/60"}
                        />
                        <span className={`text-[10px] font-sans ${shopOpen ? "text-[var(--color-brand-purple)] font-semibold" : "text-[var(--color-brand-onyx)]/60"}`}>
                            Shop
                        </span>
                    </button>

                    {/* Cart — with live item count */}
                    <Link
                        href="/cart"
                        className="relative flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
                    >
                        <span className="relative">
                            <ShoppingCart
                                size={22}
                                strokeWidth={isCartActive ? 2 : 1.5}
                                className={isCartActive ? "text-[var(--color-brand-purple)]" : "text-[var(--color-brand-onyx)]/60"}
                            />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-brand-purple)] flex items-center justify-center text-[10px] leading-none text-white font-bold">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </span>
                        <span className={`text-[10px] font-sans ${isCartActive ? "text-[var(--color-brand-purple)] font-semibold" : "text-[var(--color-brand-onyx)]/60"}`}>
                            Cart
                        </span>
                    </Link>

                    {/* Profile — full profile page (or auth modal for guests) */}
                    <button
                        onClick={handleProfileClick}
                        className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
                        aria-label="Profile"
                    >
                        <User
                            size={22}
                            strokeWidth={isProfileActive ? 2 : 1.5}
                            className={isProfileActive ? "text-[var(--color-brand-purple)]" : "text-[var(--color-brand-onyx)]/60"}
                        />
                        <span className={`text-[10px] font-sans ${isProfileActive ? "text-[var(--color-brand-purple)] font-semibold" : "text-[var(--color-brand-onyx)]/60"}`}>
                            Profile
                        </span>
                    </button>
                </div>
            </nav>

            {/* Categories bottom sheet */}
            <AnimatePresence>
                {shopOpen && (
                    <div className="fixed inset-0 z-[60] md:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setShopOpen(false)}
                        />
                        {/* Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 320 }}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-heading font-extrabold text-2xl text-[var(--color-brand-onyx)]">Categories</h2>
                                <button
                                    onClick={() => setShopOpen(false)}
                                    aria-label="Close"
                                    className="w-9 h-9 rounded-full bg-[var(--color-brand-sand)] flex items-center justify-center text-[var(--color-brand-onyx)]/60 active:scale-95 transition-transform"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Shop All */}
                            <Link
                                href="/category/all"
                                onClick={() => setShopOpen(false)}
                                className="flex flex-col items-center justify-center gap-1.5 w-full rounded-2xl bg-[var(--color-brand-sand)] py-4 mb-3 active:scale-[0.98] transition-transform"
                            >
                                <LayoutGrid size={24} className="text-[var(--color-brand-onyx)]/70" strokeWidth={1.6} />
                                <span className="font-sans font-medium text-[15px] text-[var(--color-brand-onyx)]">Shop All</span>
                            </Link>

                            {/* Category grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {CATEGORIES.map((cat) => (
                                    <Link
                                        key={cat.href}
                                        href={cat.href}
                                        onClick={() => setShopOpen(false)}
                                        className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl ${cat.bg} py-5 active:scale-[0.98] transition-transform`}
                                    >
                                        <cat.icon size={24} className="text-[var(--color-brand-onyx)]/75" strokeWidth={1.6} />
                                        <span className="font-sans font-medium text-[15px] text-[var(--color-brand-onyx)]">{cat.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
}
