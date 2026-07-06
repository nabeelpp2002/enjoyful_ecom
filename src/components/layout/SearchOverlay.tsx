"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { track } from "@/lib/analytics";
import { displayName } from "@/lib/utils";
import { useData } from "@/context/DataContext";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    discountPct?: number;
    image: string;
    category: string;
    subcategory?: string;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const { showProductPrices } = useData();
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const abortRef = useRef<AbortController | null>(null);
    const lastTrackedRef = useRef("");

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    // Debounced fetch — fires 150ms after the user stops typing
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/products/quick-search?q=${encodeURIComponent(q)}`, {
                    signal: ctrl.signal,
                });
                if (res.ok) {
                    const data: SearchResult[] = await res.json();
                    setResults(data);
                }
            } catch (err) {
                if ((err as Error).name !== "AbortError") setResults([]);
            } finally {
                setLoading(false);
            }
        }, 150);

        return () => {
            clearTimeout(timer);
            ctrl.abort();
        };
    }, [query]);

    // Track a search event once per "settled" query (after user stops typing for 800ms)
    useEffect(() => {
        const q = query.trim();
        if (!q || q === lastTrackedRef.current) return;
        const timer = setTimeout(() => {
            track({ type: "search", query: q, metadata: { resultCount: results.length } });
            lastTrackedRef.current = q;
        }, 800);
        return () => clearTimeout(timer);
    }, [query, results.length]);

    const goToResult = useCallback((r: SearchResult) => {
        track({ type: "product_click", productId: r.id, productName: r.name, metadata: { source: "search" } });
        router.push(`/product/${r.slug ?? r.id}`);
        onClose();
    }, [router, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (q) router.push(`/category/all?q=${encodeURIComponent(q)}`);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, y: -15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="fixed top-[80px] lg:top-[90px] left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl z-50 bg-white rounded-3xl shadow-[0_12px_40px_rgba(26,26,27,0.16)] border border-gray-100 overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="flex items-center px-6 py-3 border-b border-gray-100">
                            <Search size={22} className="text-[var(--color-brand-onyx)]/50 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search products, brands, or categories..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="flex-1 text-lg lg:text-xl font-sans text-[var(--color-brand-onyx)] placeholder-gray-400 bg-transparent border-none outline-none px-4 py-2"
                            />
                            {loading && <Loader2 className="w-5 h-5 text-[#735697] animate-spin mr-2" />}
                            {query && !loading && (
                                <button
                                    type="button"
                                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                                    className="text-gray-400 hover:text-[var(--color-brand-onyx)] transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </form>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {!query.trim() ? (
                                <div className="px-6 py-10 text-center text-[#1A1A1B]/40 text-sm">
                                    Start typing to search the catalogue
                                </div>
                            ) : results.length === 0 && !loading ? (
                                <div className="px-6 py-10 text-center">
                                    <Package className="w-8 h-8 text-[#1A1A1B]/15 mx-auto mb-2" />
                                    <p className="text-[#1A1A1B]/40 text-sm">No products match &quot;{query}&quot;</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {results.map(r => (
                                        <li key={r.id}>
                                            <button
                                                onClick={() => goToResult(r)}
                                                className="w-full px-6 py-3 flex items-center gap-4 hover:bg-[#F9F5F0]/60 transition-colors text-left"
                                            >
                                                <div className="w-14 h-14 rounded-xl bg-[#F9F5F0] flex-shrink-0 overflow-hidden">
                                                    {r.image ? (
                                                        <Image src={r.image} alt={r.name} width={56} height={56} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[#1A1A1B]/20">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[#1A1A1B] truncate">{displayName(r.name)}</p>
                                                    <p className="text-xs text-[#1A1A1B]/40 mt-0.5">
                                                        {r.category}{r.subcategory ? ` · ${r.subcategory}` : ""}
                                                    </p>
                                                </div>
                                                {showProductPrices && (
                                                    <div className="flex flex-col items-end flex-shrink-0 gap-1">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-heading font-extrabold text-[#1A1A1B] text-sm">{r.price}</span>
                                                            <span className="font-sans font-semibold text-xs text-[#1A1A1B]/70">AED</span>
                                                        </div>
                                                        {r.originalPrice && r.originalPrice > r.price && (
                                                            <span className="text-xs text-[#1A1A1B]/30 line-through">
                                                                {r.originalPrice} AED
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                    <li className="px-6 py-3 bg-[#F9F5F0]/40 border-t border-gray-100">
                                        <button
                                            onClick={handleSubmit as unknown as () => void}
                                            className="w-full text-sm text-[#735697] font-medium hover:text-[#5e4580] transition-colors"
                                        >
                                            View all results for &quot;{query}&quot; →
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
