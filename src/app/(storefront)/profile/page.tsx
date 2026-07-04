"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package,
    Heart,
    MessageSquare,
    Mail,
    Info,
    LogOut,
    ChevronRight,
    Check,
    X,
    User as UserIcon,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { AuthModal } from "@/components/layout/AuthModal";
import { FeedbackForm } from "@/components/profile/FeedbackForm";

export default function ProfilePage() {
    const router = useRouter();
    const { isAuthenticated, user, logout, wishlist } = useData();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    // Guests can't have a profile — prompt them to sign in.
    if (!isAuthenticated) {
        return (
            <>
                <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-24">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-brand-purple)]/12 flex items-center justify-center mb-4">
                        <UserIcon className="w-7 h-7 text-[var(--color-brand-purple)]" strokeWidth={1.6} />
                    </div>
                    <h1 className="font-heading font-bold text-2xl text-[var(--color-brand-onyx)] mb-1">Your profile</h1>
                    <p className="text-[var(--color-brand-onyx)]/50 text-sm mb-6 max-w-xs">Sign in to see your orders, wishlist and account details.</p>
                    <button
                        onClick={() => setAuthModalOpen(true)}
                        className="px-7 py-3 rounded-full bg-[var(--color-brand-purple)] text-white font-semibold text-sm active:scale-95 transition-transform"
                    >
                        Sign in
                    </button>
                </div>
                <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            </>
        );
    }

    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "My Account";
    const initial = (user?.firstName || user?.email || "?").charAt(0).toUpperCase();

    const menuItems = [
        { label: "My Orders", icon: Package, href: "/orders" },
        { label: "My Wishlist", icon: Heart, href: "/wishlist", badge: wishlist.length || undefined },
        { label: "Give Feedback", icon: MessageSquare, onClick: () => setFeedbackOpen(true) },
        { label: "Contact Us", icon: Mail, href: "/contact" },
        { label: "About Us", icon: Info, href: "/about" },
    ];

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <div className="pb-28 md:pb-20">
            {/* ───────── Mobile hero (curved) ───────── */}
            <div className="md:hidden">
                <div className="relative">
                    <div className="h-44 bg-[var(--color-brand-purple)] rounded-b-[2.5rem]" />
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-lg">
                                <div className="w-full h-full rounded-full bg-[var(--color-brand-purple)]/12 flex items-center justify-center">
                                    <span className="font-heading font-bold text-4xl text-[var(--color-brand-purple)]">{initial}</span>
                                </div>
                            </div>
                            <span className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-white flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </span>
                        </div>
                    </div>
                </div>
                <div className="pt-16 text-center px-6">
                    <h1 className="font-heading font-extrabold text-2xl text-[var(--color-brand-onyx)]">{fullName}</h1>
                    {user?.email && <p className="text-[var(--color-brand-onyx)]/50 text-sm mt-0.5">{user.email}</p>}
                </div>
            </div>

            {/* ───────── Desktop hero (banner card) ───────── */}
            <div className="hidden md:block max-w-5xl mx-auto px-6 pt-10">
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#735697] via-[#7d61a3] to-[#9e83bd] px-10 py-9 shadow-[0_24px_60px_-20px_rgba(115,86,151,0.55)]">
                    {/* decorative blurred orbs */}
                    <div className="pointer-events-none absolute -top-20 -right-12 w-64 h-64 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-24 right-40 w-44 h-44 rounded-full bg-white/[0.07]" />
                    <div className="relative flex items-center gap-6">
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg">
                                <div className="w-full h-full rounded-full bg-white/95 flex items-center justify-center">
                                    <span className="font-heading font-bold text-4xl text-[var(--color-brand-purple)]">{initial}</span>
                                </div>
                            </div>
                            <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-white flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-heading font-extrabold text-3xl text-white truncate">{fullName}</h1>
                            {user?.email && <p className="text-white/75 text-sm mt-1 truncate">{user.email}</p>}
                            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active account
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-auto self-start inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 backdrop-blur-sm transition-colors"
                        >
                            <LogOut size={16} strokeWidth={1.8} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* ───────── Menu (1-col mobile · 2-col desktop) ───────── */}
            <div className="max-w-md md:max-w-5xl mx-auto px-5 md:px-6 mt-8 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const inner = (
                        <>
                            <span className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[var(--color-brand-purple)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-brand-purple)]/15 transition-colors">
                                <Icon className="w-5 h-5 text-[var(--color-brand-purple)]" strokeWidth={1.7} />
                            </span>
                            <span className="font-sans font-medium text-[15px] text-[var(--color-brand-onyx)]">{item.label}</span>
                            <span className="ml-auto flex items-center gap-2">
                                {item.badge ? (
                                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] text-white font-bold">
                                        {item.badge}
                                    </span>
                                ) : null}
                                <ChevronRight className="w-4 h-4 text-[var(--color-brand-onyx)]/30 group-hover:text-[var(--color-brand-purple)] group-hover:translate-x-0.5 transition-all" />
                            </span>
                        </>
                    );
                    const cls = "group flex items-center gap-3 w-full rounded-2xl bg-white border border-[var(--color-brand-onyx)]/8 px-4 py-3.5 md:px-5 md:py-4 shadow-[0_2px_12px_rgba(26,26,27,0.04)] hover:shadow-[0_8px_24px_rgba(115,86,151,0.12)] hover:border-[var(--color-brand-purple)]/25 active:scale-[0.99] transition-all text-left";
                    return item.href ? (
                        <Link key={item.label} href={item.href} className={cls}>{inner}</Link>
                    ) : (
                        <button key={item.label} onClick={item.onClick} className={cls}>{inner}</button>
                    );
                })}
            </div>

            {/* Logout (mobile only — desktop has it in the hero) */}
            <div className="md:hidden max-w-md mx-auto px-5 mt-8">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-[var(--color-brand-onyx)]/60 font-sans font-semibold text-[15px] hover:text-red-600 transition-colors"
                >
                    <LogOut size={18} strokeWidth={1.8} />
                    Logout
                </button>
            </div>

            {/* Feedback modal */}
            <AnimatePresence>
                {feedbackOpen && (
                    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setFeedbackOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0.6 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0.6 }}
                            transition={{ type: "spring", damping: 30, stiffness: 320 }}
                            className="relative w-full md:max-w-md bg-white rounded-t-[2rem] md:rounded-[1.5rem] px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:mx-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-heading font-extrabold text-xl text-[var(--color-brand-onyx)]">Share your feedback</h2>
                                <button
                                    onClick={() => setFeedbackOpen(false)}
                                    aria-label="Close"
                                    className="w-9 h-9 rounded-full bg-[var(--color-brand-sand)] flex items-center justify-center text-[var(--color-brand-onyx)]/60 active:scale-95 transition-transform"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <FeedbackForm />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
