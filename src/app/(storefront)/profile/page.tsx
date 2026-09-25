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
    ArrowLeft,
    ShieldCheck,
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
    const [avatarFailed, setAvatarFailed] = useState(false);

    // Guests can't have a profile — prompt them to sign in.
    if (!isAuthenticated) {
        return (
            <>
                <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-24">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-brand-purple)]/12 flex items-center justify-center mb-4">
                        <UserIcon className="w-7 h-7 text-[var(--color-brand-purple)]" strokeWidth={1.6} />
                    </div>
                    <h1 className="editorial-title display-md font-bold text-2xl text-[var(--color-brand-onyx)] mb-1">Your profile</h1>
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
    const showAvatar = Boolean(user?.avatarUrl) && !avatarFailed;

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
        <div className="min-h-[calc(100dvh-5rem)] bg-[radial-gradient(circle_at_top_right,rgba(224,205,238,0.72),transparent_38%),linear-gradient(180deg,#fbf8fd_0%,#f6f1f9_100%)] pb-28 md:min-h-0 md:bg-none md:pb-20">
            {/* Mobile profile card */}
            <div className="mx-auto max-w-md px-5 pt-5 md:hidden">
                <div className="mb-5 flex items-center gap-3">
                    <button type="button" onClick={() => router.back()} aria-label="Go back" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-brand-onyx)] shadow-[0_4px_16px_rgba(26,26,27,0.06)] active:scale-95">
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </button>
                    <h1 className="editorial-section-heading text-2xl text-[var(--color-brand-onyx)]">Profile</h1>
                </div>

                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white px-6 py-7 text-center shadow-[0_16px_45px_rgba(115,86,151,0.10)]">
                    <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-[var(--color-brand-purple)]/8" />
                    <div className="relative mx-auto mb-4 w-fit">
                        <div className="h-24 w-24 rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(115,86,151,0.18)]">
                            {showAvatar ? (
                                <img src={user?.avatarUrl} alt={`${fullName} profile`} referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--color-brand-purple)]/12">
                                    <span className="editorial-heading text-4xl text-[var(--color-brand-purple)]">{initial}</span>
                                </div>
                            )}
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500">
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </span>
                    </div>
                    <h2 className="editorial-section-heading text-2xl text-[var(--color-brand-onyx)]">{fullName}</h2>
                    {user?.email && <p className="mt-1 truncate text-sm text-[var(--color-brand-onyx)]/50">{user.email}</p>}
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-purple)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-purple)]">
                        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} /> Verified account
                    </div>
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
                                {showAvatar ? (
                                    <img
                                        src={user?.avatarUrl}
                                        alt={`${fullName} profile`}
                                        referrerPolicy="no-referrer"
                                        onError={() => setAvatarFailed(true)}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-white/95 flex items-center justify-center">
                                        <span className="editorial-heading font-bold text-4xl text-[var(--color-brand-purple)]">{initial}</span>
                                    </div>
                                )}
                            </div>
                            <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-white flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="editorial-title display-md [font-weight:500!important] text-3xl text-white truncate">{fullName}</h1>
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
            <div className="mx-5 mt-5 grid max-w-md grid-cols-1 gap-0 overflow-hidden rounded-[1.5rem] border border-[var(--color-brand-onyx)]/5 bg-white shadow-[0_10px_32px_rgba(115,86,151,0.07)] md:mx-auto md:mt-6 md:max-w-5xl md:grid-cols-2 md:gap-4 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:px-6 md:shadow-none">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const inner = (
                        <>
                            <span className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[var(--color-brand-purple)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-brand-purple)]/15 transition-colors">
                                <Icon className="w-5 h-5 text-[var(--color-brand-purple)]" strokeWidth={1.7} />
                            </span>
                            <span className="editorial-subtitle text-[15px] text-[var(--color-brand-onyx)]">{item.label}</span>
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
                    const cls = "group flex w-full items-center gap-3 border-b border-[var(--color-brand-onyx)]/5 bg-white px-4 py-3.5 text-left transition-all last:border-b-0 hover:bg-[var(--color-brand-purple)]/[0.025] active:bg-[var(--color-brand-purple)]/[0.05] md:rounded-2xl md:border md:border-[var(--color-brand-onyx)]/8 md:px-5 md:py-4 md:shadow-[0_2px_12px_rgba(26,26,27,0.04)] md:hover:border-[var(--color-brand-purple)]/25 md:hover:shadow-[0_8px_24px_rgba(115,86,151,0.12)]";
                    return item.href ? (
                        <Link key={item.label} href={item.href} className={cls}>{inner}</Link>
                    ) : (
                        <button key={item.label} onClick={item.onClick} className={cls}>{inner}</button>
                    );
                })}
            </div>

            {/* Logout (mobile only — desktop has it in the hero) */}
            <div className="mx-auto mt-4 max-w-md px-5 md:hidden">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[1.25rem] border border-[var(--color-brand-onyx)]/5 bg-white px-4 py-3.5 text-left text-[15px] text-[var(--color-brand-onyx)]/60 shadow-[0_8px_24px_rgba(115,86,151,0.05)] transition-colors hover:text-red-600"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                        <LogOut size={18} strokeWidth={1.8} />
                    </span>
                    <span className="editorial-subtitle">Logout</span>
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
                                <h2 className="editorial-section-heading text-xl text-[var(--color-brand-onyx)]">Share your feedback</h2>
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
