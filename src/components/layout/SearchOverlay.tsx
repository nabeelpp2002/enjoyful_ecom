"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowUpLeft, Loader2, Package, Search, TrendingUp, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { displayName } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { Price } from "@/components/ui/Price";

interface SearchOverlayProps { isOpen: boolean; onClose: () => void; }
interface SearchResult {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    subcategory?: string;
}

type SearchDestination = "product" | "results";

function SearchNavigationSkeleton({ destination }: { destination: SearchDestination }) {
    if (destination === "product") {
        return (
            <div className="flex h-full flex-col bg-[#fbf8f4] animate-pulse" aria-label="Loading product">
                <div className="flex h-20 items-center justify-between bg-white px-5 pt-[env(safe-area-inset-top)]">
                    <div className="h-10 w-10 rounded-full bg-black/[0.07]" />
                    <div className="h-7 w-24 rounded-lg bg-black/[0.07]" />
                    <div className="h-10 w-10 rounded-full bg-black/[0.07]" />
                </div>
                <div className="mx-4 mt-4 aspect-square rounded-3xl bg-black/[0.07]" />
                <div className="mt-4 flex gap-3 px-4">
                    {[0, 1, 2].map(item => <div key={item} className="h-16 w-16 rounded-xl bg-black/[0.07]" />)}
                </div>
                <div className="space-y-3 px-4 pt-7">
                    <div className="h-3 w-28 rounded bg-[#735697]/15" />
                    <div className="h-8 w-3/4 rounded-lg bg-black/[0.08]" />
                    <div className="h-4 w-1/3 rounded bg-black/[0.06]" />
                </div>
                <div className="mt-auto flex items-center gap-5 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
                    <div className="h-10 w-20 rounded-lg bg-black/[0.07]" />
                    <div className="h-12 flex-1 rounded-2xl bg-[#f7ac16]/35" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden bg-white animate-pulse" aria-label="Loading search results">
            <div className="h-20 border-b border-black/5 bg-white pt-[env(safe-area-inset-top)]" />
            <div className="px-4 pt-7">
                <div className="h-8 w-2/3 rounded-lg bg-black/[0.08]" />
                <div className="mt-3 h-4 w-4/5 rounded bg-black/[0.05]" />
                <div className="mt-5 h-9 w-32 rounded-full bg-[#735697]/12" />
                <div className="mt-7 flex justify-between">
                    <div className="h-9 w-20 rounded-full bg-black/[0.06]" />
                    <div className="h-9 w-28 rounded-full bg-black/[0.06]" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map(item => (
                        <div key={item}>
                            <div className="aspect-[3/4] rounded-2xl bg-black/[0.07]" />
                            <div className="mt-3 h-4 w-4/5 rounded bg-black/[0.07]" />
                            <div className="mt-2 h-3 w-1/2 rounded bg-black/[0.05]" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const TRENDING = ["Face Wash", "Body Mist", "Baby Care", "Shampoo", "Home Care", "Sunscreen"];
const PROMOS = [
    { href: "/category/glow", image: "/assets/glow-carousel-1-desktop.webp", alt: "Shop the Glow collection" },
    { href: "/category/fragrances", image: "/assets/fragrance-carousel-2-desktop-v4.webp", alt: "Shop the Fragrances collection" },
];

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [instantClose, setInstantClose] = useState(false);
    const [destination, setDestination] = useState<SearchDestination | null>(null);
    const { showProductPrices } = useData();
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const routeSearchParams = useSearchParams();
    const routeQuery = routeSearchParams.toString();
    const routeKey = routeQuery ? `${pathname}?${routeQuery}` : pathname;
    const navigationOriginRef = useRef<string | null>(null);
    const lastTrackedRef = useRef("");

    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setResults([]);
            setInstantClose(false);
            setDestination(null);
            navigationOriginRef.current = null;
            return;
        }
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = oldOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        const q = query.trim();
        if (!q) { setResults([]); setLoading(false); return; }
        const controller = new AbortController();
        setLoading(true);
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(`/api/products/quick-search?q=${encodeURIComponent(q)}&limit=20`, { signal: controller.signal });
                setResults(response.ok ? await response.json() : []);
            } catch (error) {
                if ((error as Error).name !== "AbortError") setResults([]);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 220);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [query]);

    useEffect(() => {
        const q = query.trim();
        if (!q || q === lastTrackedRef.current) return;
        const timer = window.setTimeout(() => {
            track({ type: "search", query: q, metadata: { resultCount: results.length } });
            lastTrackedRef.current = q;
        }, 800);
        return () => window.clearTimeout(timer);
    }, [query, results.length]);

    // Keep this screen over the previous page until the requested route has
    // committed. Closing it immediately exposes stale, unfiltered products.
    useEffect(() => {
        if (!isOpen || !navigationOriginRef.current) return;
        if (routeKey !== navigationOriginRef.current) {
            navigationOriginRef.current = null;
            onClose();
        }
    }, [isOpen, onClose, routeKey]);

    const navigateFromSearch = useCallback((href: string, nextDestination: SearchDestination) => {
        if (href === routeKey) {
            onClose();
            return;
        }
        navigationOriginRef.current = routeKey;
        setDestination(nextDestination);
        setInstantClose(true);
        router.push(href);
    }, [onClose, routeKey, router]);

    const goToResult = useCallback((result: SearchResult) => {
        track({ type: "product_click", productId: result.id, productName: result.name, metadata: { source: "mobile_search" } });
        navigateFromSearch(`/product/${result.slug || result.id}`, "product");
    }, [navigateFromSearch]);

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        const q = query.trim();
        if (!q) return;
        track({ type: "search", query: q, metadata: { resultCount: results.length, source: "mobile_search_screen" } });
        navigateFromSearch(`/category/all?q=${encodeURIComponent(q)}`, "results");
    };

    const chooseTrending = (term: string) => {
        setQuery(term);
        inputRef.current?.focus();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={instantClose ? { opacity: 0 } : { x: "100%" }}
                    transition={instantClose ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[100] flex flex-col bg-white md:hidden"
                >
                    {instantClose && destination && (
                        <div className="absolute inset-0 z-50 bg-white">
                            <SearchNavigationSkeleton destination={destination} />
                        </div>
                    )}
                    <div className="px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)]">
                        <form onSubmit={submitSearch} className="flex h-14 items-center gap-2 rounded-2xl border border-black/10 bg-white px-2 shadow-sm">
                            <button type="button" onClick={onClose} aria-label="Back" className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--color-brand-onyx)]"><ArrowLeft size={23} /></button>
                            <Search size={19} className="shrink-0 text-black/35" />
                            <input ref={inputRef} type="search" inputMode="search" enterKeyHint="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products" className="editorial-body min-w-0 flex-1 bg-transparent text-base text-[var(--color-brand-onyx)] outline-none placeholder:text-black/35" />
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin text-[var(--color-brand-purple)]" /> : query && <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search" className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-black/40"><X size={16} /></button>}
                        </form>
                    </div>

                    <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
                        {!query.trim() ? (
                            <div className="pt-5">
                                <h2 className="editorial-subtitle text-xl font-semibold text-[var(--color-brand-onyx)]">Trending searches</h2>
                                <div className="mt-4 flex flex-wrap gap-2.5">
                                    {TRENDING.map(term => <button key={term} type="button" onClick={() => chooseTrending(term)} className="editorial-body flex items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm text-[var(--color-brand-onyx)] shadow-sm"><TrendingUp size={15} />{term}</button>)}
                                </div>
                                <div className="mt-8 space-y-4">
                                    {PROMOS.map(promo => <Link key={promo.href} href={promo.href} onClick={onClose} className="relative block aspect-[16/5] overflow-hidden rounded-2xl bg-[var(--color-brand-sand)]"><Image src={promo.image} alt={promo.alt} fill sizes="calc(100vw - 2rem)" className="object-cover" /></Link>)}
                                </div>
                            </div>
                        ) : !loading && results.length === 0 ? (
                            <div className="py-16 text-center"><Package className="mx-auto h-9 w-9 text-black/15" /><p className="editorial-body mt-3 text-sm text-black/45">No products match &quot;{query}&quot;</p></div>
                        ) : (
                            <div className="pt-2">
                                <p className="editorial-subtitle py-3 text-sm font-semibold text-[var(--color-brand-onyx)]">Search results for “{query}”</p>
                                <ul className="divide-y divide-black/5">
                                    {results.map(result => (
                                        <li key={result.id}>
                                            <button type="button" onClick={() => goToResult(result)} className="flex w-full items-center gap-3 py-3.5 text-left active:bg-black/[0.025]">
                                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-brand-sand)]">{result.image ? <Image src={result.image} alt={result.name} fill sizes="56px" className="object-cover" /> : <Package className="absolute inset-0 m-auto h-5 w-5 text-black/20" />}</div>
                                                <div className="min-w-0 flex-1"><p className="editorial-subtitle truncate text-[15px] font-semibold text-[var(--color-brand-onyx)]">{displayName(result.name)}</p><p className="editorial-body mt-0.5 truncate text-xs text-black/40">{result.category}{result.subcategory ? ` · ${result.subcategory}` : ""}</p></div>
                                                {showProductPrices && <Price amount={result.price} originalAmount={result.originalPrice} layout="stacked" reserveSpace={false} className="shrink-0" amountClassName="editorial-number text-sm font-semibold" currencyClassName="text-[10px] text-black/45" originalClassName="text-[10px] text-black/30" />}
                                                <ArrowUpLeft size={18} className="shrink-0 rotate-90 text-black/35" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {!loading && results.length > 0 && (
                                    <button type="button" onClick={() => submitSearch({ preventDefault() {} } as React.FormEvent)} className="editorial-ui mt-4 w-full rounded-xl bg-[var(--color-brand-purple)] px-4 py-3 text-sm font-medium text-white">
                                        View all results for “{query}”
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
