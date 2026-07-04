"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Loader2, Info, CheckCircle2, AlertCircle } from "lucide-react";

type Toast = { type: "success" | "error"; msg: string } | null;

export default function SettingsPage() {
    const [showPrices, setShowPrices] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<Toast>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const loadSettings = useCallback(() => {
        return fetch(`/api/settings?_t=${Date.now()}`, { cache: "no-store" })
            .then(r => {
                if (!r.ok) throw new Error("Failed to fetch settings");
                return r.json();
            })
            .then(res => {
                // NestJS wraps responses in { success, data } — unwrap it
                const data = res?.data ?? res;
                if (data && typeof data.showProductPrices === "boolean") {
                    setShowPrices(data.showProductPrices);
                }
            });
    }, []);

    useEffect(() => {
        loadSettings()
            .catch(() => showToast("error", "Failed to load settings."))
            .finally(() => setLoading(false));
    }, [loadSettings]);

    const togglePrices = async () => {
        const newValue = !showPrices;
        setSaving(true);
        try {
            const patchRes = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ showProductPrices: newValue }),
            });
            if (!patchRes.ok) throw new Error("Failed to update");

            // Read the actual saved value directly from the PATCH response — avoids any cache issues
            const patchBody = await patchRes.json();
            // NestJS wraps responses in { success, data } — unwrap it
            const saved = patchBody?.data ?? patchBody;
            const actualValue = typeof saved?.showProductPrices === "boolean" ? saved.showProductPrices : newValue;
            setShowPrices(actualValue);
            showToast("success", `Pricing is now ${actualValue ? "visible" : "hidden"} globally.`);
        } catch (err) {
            console.error(err);
            showToast("error", "Failed to update settings. Please try again.");
            // Re-fetch to restore actual DB value
            await loadSettings().catch(() => {});
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-[var(--color-brand-purple)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium border ${
                            toast.type === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-red-50 border-red-200 text-red-800"
                        }`}
                    >
                        {toast.type === "success"
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-10">
                <h1 className="font-heading text-[32px] text-[#1A1A1B] tracking-tight flex items-center gap-3">
                    <Settings className="w-8 h-8 text-[#1A1A1B]/40" />
                    Store Settings
                </h1>
                <p className="font-sans text-[#1A1A1B]/60 mt-2">
                    Manage global platform configuration and feature flags.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div>
                        <h2 className="font-heading font-bold text-xl text-[#1A1A1B] mb-1">
                            Show Product Prices
                        </h2>
                        <p className="font-sans text-[#1A1A1B]/60 text-sm max-w-lg leading-relaxed">
                            When enabled, prices are visible to all users. When disabled, prices, discounts, and checkout features are globally hidden. Useful when auditing or updating catalog pricing.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                        {saving && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                        <button
                            onClick={togglePrices}
                            disabled={saving}
                            aria-label="Toggle product pricing visibility"
                            className={`relative w-[60px] h-8 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-purple)] disabled:opacity-60 ${
                                showPrices ? "bg-[var(--color-brand-purple)]" : "bg-gray-200"
                            }`}
                        >
                            <motion.span
                                layout
                                className={`inline-block w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${
                                    showPrices ? "translate-x-[30px]" : "translate-x-[4px]"
                                } mt-1`}
                            />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {!showPrices && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 overflow-hidden"
                        >
                            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-semibold mb-1">Pricing is currently hidden.</p>
                                <p className="opacity-80">
                                    Customers cannot see product prices, variant prices, or discounts. The &quot;Add to Cart&quot; and &quot;Order via WhatsApp&quot; buttons have been hidden across the storefront.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
