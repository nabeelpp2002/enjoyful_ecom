"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown, SlidersHorizontal, X, Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { CategoryPromo } from "@/components/sections/CategoryPromo";
import { SeoContent } from "@/components/sections/SeoContent";
import { SEO_CONTENT } from "@/data/seo-content";
import type { Product } from "@/data/products";
import { Price } from "@/components/ui/Price";
import { normalizeApiProduct } from "@/lib/product-normalize";

const SORT_TO_BACKEND: Record<string, string> = {
    featured: 'featured',
    'price-low': 'price_asc',
    'price-high': 'price_desc',
    rating: 'rating',
};

const SORT_OPTIONS: { value: string; label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
];

// Upper bound for the price control (Home Care tops out ~35 AED; skincare is price-on-request).
const PRICE_MAX = 100;

// Top-level categories — shown in the filter drawer when browsing "Shop All".
const TOP_CATEGORIES: { name: string; slug: string }[] = [
    { name: "Glow", slug: "glow" },
    { name: "Daily", slug: "daily" },
    { name: "Baby", slug: "baby" },
    { name: "Fragrances", slug: "fragrances" },
    { name: "Home Care", slug: "home-care" },
];

// Subcategory options per category (must match seeded product `subcategory` values)
const SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
    Glow: ["Face Wash", "Face Scrub", "Face Mask", "Sunscreen", "Aloe Vera Gel", "Toner", "Body Scrub"],
    Daily: ["Body Lotion", "Body Cream", "Shower Gel", "Shampoo", "Hair Oil", "Hair Serum", "Intimate Wash", "Hair Removal"],
    Baby: ["Baby Lotion", "Baby Wash", "Baby Talc", "Baby Rash Cream", "Baby Soap"],
    Fragrances: ["Perfume", "Body Mist", "Roll On", "Deo Stick"],
    "Home Care": ["Kitchen Care", "Bathroom Care", "Floor & Surface Care", "Hand Care", "Laundry Care"],
};

interface CategoryPageClientProps {
    categoryParam: string;
    initialProducts: Product[];
    initialMeta: { total: number; totalPages: number };
    initialRequestKey: string;
    initialBanner?: { desktopImageUrl?: string; mobileImageUrl?: string } | null;
}

export default function CategoryPageClient({
    categoryParam,
    initialProducts,
    initialMeta,
    initialRequestKey,
    initialBanner = null,
}: CategoryPageClientProps) {
    // Decode and reconstruct capitalized category from URL path
    const urlCategoryRaw = decodeURIComponent(categoryParam);
    // URL slugs use hyphens (e.g. "home-care"); normalize to spaces before capitalizing
    // each word so this matches the "Home Care" keys used in categoryInfo/banners/etc.
    let category = urlCategoryRaw.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Normalize "Shop All", "All", "shop-all" into just "All" for easier logic
    if (urlCategoryRaw.toLowerCase().includes("all")) {
        category = "Shop All";
    }

    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";
    const subcategoryParam = searchParams.get("subcategory") || "";
    const subcategoryOptions = SUBCATEGORIES_BY_CATEGORY[category] ?? [];
    // Multi-select: the subcategory param is a comma-separated list of selected types.
    const selectedSubs = subcategoryParam ? subcategoryParam.split(",").map(s => s.trim()).filter(Boolean) : [];

    const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, showProductPrices } = useData();
    const [sortBy, setSortBy] = useState("featured");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX]);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Server-side filtered/sorted results, streamed in via infinite scroll.
    const [categoryProducts, setCategoryProducts] = useState<Product[]>(initialProducts);
    const [loadingProducts, setLoadingProducts] = useState(false); // initial page is server-rendered
    const [loadingMore, setLoadingMore] = useState(false);        // appending further pages
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialMeta.totalPages);
    const [totalCount, setTotalCount] = useState(initialMeta.total);
    const [loadedRequestKey, setLoadedRequestKey] = useState(initialRequestKey);
    const PAGE_SIZE = 16; // 4 × 4 grid on desktop
    const hasMore = page < totalPages;
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Admin-managed category banner (pre-populated with initialBanner for zero-delay rendering)
    const [banner, setBanner] = useState<{ desktopImageUrl?: string; mobileImageUrl?: string } | null>(initialBanner);
    const [bannerLoading, setBannerLoading] = useState(!initialBanner);
    useEffect(() => {
        if (!initialBanner) {
            setBannerLoading(true);
        }
        fetch("/api/category-banners")
            .then((r) => (r.ok ? r.json() : null))
            .then((body) => {
                const list = body?.data ?? body;
                const match = Array.isArray(list)
                    ? list.find((b: { category?: string }) => {
                        const cat = (b.category || "").toLowerCase().replace(/-/g, ' ').trim();
                        const norm = category.toLowerCase().replace(/-/g, ' ').trim();
                        return cat === norm || ((norm === "home care" || norm === "home") && (cat === "home" || cat === "home care"));
                    })
                    : null;
                if (match) setBanner(match);
            })
            .catch(() => {})
            .finally(() => setBannerLoading(false));
    }, [category, initialBanner]);

    // Handle click outside to close dropdowns
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset to page 1 whenever filters/sort/category/query/subcategory change
    useEffect(() => {
        setPage(1);
    }, [urlCategoryRaw, sortBy, priceRange, query, subcategoryParam]);

    const fetchProducts = useCallback(async () => {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(PAGE_SIZE),
            sort: SORT_TO_BACKEND[sortBy] ?? 'featured',
        });
        if (category !== "Shop All") {
            const catSlug = urlCategoryRaw.toLowerCase().replace(/\s+/g, '-');
            params.set('category', catSlug);
        }
        if (subcategoryParam) params.set('subcategory', subcategoryParam);
        if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
        if (priceRange[1] < PRICE_MAX) params.set('maxPrice', String(priceRange[1]));
        if (query) params.set('q', query);

        const requestKey = params.toString();
        const append = page > 1;
        if (!append && requestKey === loadedRequestKey) return;
        if (append) setLoadingMore(true);
        else setLoadingProducts(true);

        try {
            const res = await fetch(`/api/products?${requestKey}`);
            if (!res.ok) {
                if (!append) { setCategoryProducts([]); setTotalPages(1); setTotalCount(0); }
                return;
            }
            const body = await res.json();
            const raw: Record<string, unknown>[] = Array.isArray(body?.data) ? body.data : [];
            const mapped = raw.map(normalizeApiProduct);
            setCategoryProducts(prev => {
                if (!append) return mapped;
                // Append, de-duping by id in case a page boundary overlaps.
                const seen = new Set(prev.map(p => p.id));
                return [...prev, ...mapped.filter(p => !seen.has(p.id))];
            });
            setTotalPages(body?.meta?.totalPages ?? 1);
            setTotalCount(body?.meta?.total ?? raw.length);
            setLoadedRequestKey(requestKey);
        } finally {
            if (append) setLoadingMore(false);
            else setLoadingProducts(false);
        }
    }, [page, sortBy, priceRange, query, subcategoryParam, category, urlCategoryRaw, loadedRequestKey]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // Infinite scroll: load the next page when the sentinel nears the viewport.
    // rootMargin pre-loads ~a couple of rows before the user hits the bottom.
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingProducts && !loadingMore) {
                    setPage(p => p + 1);
                }
            },
            { rootMargin: "600px 0px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasMore, loadingProducts, loadingMore]);

    const categoryInfo: Record<string, { title: string; description: string; bgColor?: string }> = {
        "Shop All": {
            title: "All Products",
            description: "Our complete collection of natural, premium care.",
            bgColor: "bg-[var(--color-brand-sand)]"
        },
        Glow: {
            title: "Glow Collection",
            description: "Skincare to reveal your natural radiance.",
            bgColor: "bg-[#F0EDF6]"
        },
        Baby: {
            title: "Baby Care",
            description: "Gentle, hypoallergenic care for delicate skin.",
            bgColor: "bg-[#E6F0F9]"
        },
        "Home Care": {
            title: "Home Care",
            description: "Curated home fragrance and care.",
            bgColor: "bg-[#EAF3EB]"
        },
        Daily: {
            title: "Daily Rituals",
            description: "Everyday body care and wellness essentials.",
            bgColor: "bg-[#FBEBE5]"
        },
        Fragrances: {
            title: "Fragrances",
            description: "Signature perfumes, mists and roll-ons.",
            bgColor: "bg-[#F5EFF8]"
        },
    };

    let info = categoryInfo[category] || { title: category, description: "Explore our collection.", bgColor: "bg-[var(--color-brand-sand)]" };
    if (selectedSubs.length) {
        const label = selectedSubs.length === 1 ? selectedSubs[0] : `${selectedSubs.length} types`;
        info = {
            ...info,
            title: `${categoryInfo[category]?.title ?? category} — ${label}`,
            description: `Browse our ${selectedSubs.join(", ")} collection.`,
        };
    }
    if (query) {
        info = {
            title: `Search: "${query}"`,
            description: "Here are the products matching your search."
        };
    }

    // Build a category URL preserving (or dropping) the subcategory param
    const categoryUrl = (sub?: string) =>
        sub ? `/category/${encodeURIComponent(urlCategoryRaw)}?subcategory=${encodeURIComponent(sub)}`
            : `/category/${encodeURIComponent(urlCategoryRaw)}`;

    // Toggle one subcategory in/out of the multi-select (updates the comma-separated URL param).
    // Filters apply in place; the drawer stays open so several can be picked in a row.
    const toggleSub = useCallback((sub: string) => {
        const next = selectedSubs.includes(sub)
            ? selectedSubs.filter((s) => s !== sub)
            : [...selectedSubs, sub];
        const qs = next.length ? `?subcategory=${encodeURIComponent(next.join(","))}` : "";
        router.push(`/category/${encodeURIComponent(urlCategoryRaw)}${qs}`, { scroll: false });
    }, [selectedSubs, router, urlCategoryRaw]);

    const clearAll = useCallback(() => {
        setPriceRange([0, PRICE_MAX]);
        setOpenDropdown(null);
        // Also strip q + subcategory from the URL so everything is truly cleared
        if (query || subcategoryParam) {
            router.push(`/category/${encodeURIComponent(urlCategoryRaw)}`);
        }
    }, [query, subcategoryParam, router, urlCategoryRaw]);

    const clearQuery = useCallback(() => {
        router.push(`/category/${encodeURIComponent(urlCategoryRaw)}`);
    }, [router, urlCategoryRaw]);

    const clearSubcategory = useCallback(() => {
        router.push(`/category/${encodeURIComponent(urlCategoryRaw)}`);
    }, [router, urlCategoryRaw]);

    // Price filter only appears where products actually carry a price (Home Care today;
    // skincare is price-on-request). Auto-adapts if prices are added to other categories later.
    const showPriceFilter = showProductPrices && (category === "Home Care" || categoryProducts.some((p) => (p.price ?? 0) > 0));

    // Active-filter count drives the badge on the Filters button.
    const priceActive = priceRange[0] > 0 || priceRange[1] < PRICE_MAX;
    const activeFilterCount = selectedSubs.length + (priceActive ? 1 : 0);

    // Close the drawer on Escape and lock background scroll while it is open.
    useEffect(() => {
        if (!filtersOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [filtersOpen]);

    return (
        <div className={`${info.bgColor} min-h-screen transition-colors duration-500`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8 md:mb-12 mt-16 md:mt-18 overflow-hidden shadow-sm border border-black/5 aspect-[4/3] md:aspect-[3/0.9] relative"
            >
                {bannerLoading && !banner ? (
                    <Skeleton className="absolute inset-0 rounded-none" />
                ) : (
                    <>
                        {(banner?.mobileImageUrl || banner?.desktopImageUrl) ? (
                            <Image
                                src={banner.mobileImageUrl || banner.desktopImageUrl!}
                                alt={`${category} banner`}
                                fill
                                priority
                                sizes="100vw"
                                className="object-cover md:hidden"
                            />
                        ) : (
                            <div className={`absolute inset-0 md:hidden flex items-center justify-center ${info.bgColor}`}>
                                <span className="font-heading text-xl font-bold text-[var(--color-brand-onyx)]/70 px-6 text-center">{info.title}</span>
                            </div>
                        )}
                        {banner?.desktopImageUrl ? (
                            <Image
                                src={banner.desktopImageUrl}
                                alt={`${category} banner`}
                                fill
                                priority
                                sizes="100vw"
                                className="object-cover hidden md:block"
                            />
                        ) : (
                            <div className={`absolute inset-0 hidden md:flex items-center justify-center ${info.bgColor}`}>
                                <span className="font-heading text-3xl font-bold text-[var(--color-brand-onyx)]/70">{info.title}</span>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
                {/* Category Ad Banner */}

                {/* Page Header */}
                <div className="mb-6 md:mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-2 md:mb-2.5 font-heading text-xl md:text-2xl text-[var(--color-brand-onyx)] tracking-tight"
                    >
                        {info.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-sans text-sm md:text-base text-[var(--color-brand-onyx)]/60 max-w-[600px] leading-relaxed"
                    >
                        {info.description}
                    </motion.p>
                    {/* Dismissible search query chip */}
                    {query && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center gap-2"
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-onyx)] text-white text-sm font-medium">
                                <Search size={13} />
                                &ldquo;{query}&rdquo;
                                <button
                                    onClick={clearQuery}
                                    aria-label="Clear search"
                                    className="hover:text-gray-300 transition-colors ml-0.5"
                                >
                                    <X size={13} />
                                </button>
                            </span>
                        </motion.div>
                    )}
                    {/* Dismissible subcategory chips (one per selected type) */}
                    {!query && selectedSubs.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex flex-wrap items-center gap-2"
                        >
                            {selectedSubs.map((sub) => (
                                <span key={sub} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-purple)] text-white text-sm font-medium">
                                    {sub}
                                    <button
                                        onClick={() => toggleSub(sub)}
                                        aria-label={`Remove ${sub} filter`}
                                        className="hover:text-gray-300 transition-colors ml-0.5"
                                    >
                                        <X size={13} />
                                    </button>
                                </span>
                            ))}
                            {selectedSubs.length > 1 && (
                                <button
                                    onClick={clearSubcategory}
                                    className="text-sm font-medium text-[var(--color-brand-onyx)]/45 hover:text-red-500 transition-colors ml-1"
                                >
                                    Clear
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>



                {/* Controls: Filters button + count (left) · Sort (right) */}
                <div ref={dropdownRef} className="flex flex-row justify-between items-center gap-3 mb-6 md:mb-8 z-30 relative">
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Filters — opens a left sidebar on desktop, a bottom sheet on mobile */}
                        <button
                            type="button"
                            onClick={() => setFiltersOpen(true)}
                            className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full font-sans text-xs md:text-sm font-semibold border transition-colors ${activeFilterCount > 0 ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-white text-[var(--color-brand-onyx)] border-gray-200 hover:border-gray-300'}`}
                        >
                            <SlidersHorizontal size={15} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-brand-purple)] text-white text-[10px] font-bold leading-none">{activeFilterCount}</span>
                            )}
                        </button>
                        <p className="hidden sm:block text-sm text-[var(--color-brand-onyx)]/55 whitespace-nowrap">
                            {loadingProducts ? 'Loading…' : (<><span className="font-semibold text-[var(--color-brand-onyx)]">{totalCount}</span> {totalCount === 1 ? 'product' : 'products'}</>)}
                        </p>
                    </div>

                    {/* Sort */}
                    <div className="relative flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                            className={`flex items-center justify-between gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full border font-sans text-xs md:text-sm font-medium transition-colors ${openDropdown === 'sort' ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-white text-[var(--color-brand-onyx)] border-gray-200 hover:border-gray-300'}`}
                        >
                            <span className="whitespace-nowrap">Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Featured'}</span>
                            <ChevronDown size={14} className={`transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {openDropdown === 'sort' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-56 z-40 bg-white rounded-2xl shadow-[0_8px_30px_rgba(26,26,27,0.12)] border border-black/5 p-1.5 origin-top-right"
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => { setSortBy(opt.value); setOpenDropdown(null); }}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-sans text-sm font-medium transition-colors ${sortBy === opt.value ? 'bg-[var(--color-brand-onyx)] text-white' : 'text-[var(--color-brand-onyx)]/70 hover:bg-[var(--color-brand-sand)]'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>


                {/* (result count now lives in the controls row above) */}

                {/* Product Grid */}
                {loadingProducts ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-[1.5rem] p-3 shadow-sm">
                                <div className="aspect-[3/4] md:pt-[100%] md:aspect-auto rounded-[1.25rem] bg-gray-100 animate-pulse" />
                                <div className="mt-4 h-4 bg-gray-100 rounded animate-pulse" />
                                <div className="mt-2 h-3 w-1/2 mx-auto bg-gray-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
                    {categoryProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial="initial"
                            whileHover="hover"
                            className="group h-full"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: Math.min(index, 7) * 0.05 }}
                                className="flex flex-col h-full bg-white rounded-[1.5rem] p-3 shadow-sm relative"
                            >
                                {/* Product Image Card Container */}
                                <div className="relative aspect-[3/4] md:pt-[100%] md:aspect-auto rounded-[1.25rem] bg-gray-50 flex-shrink-0 group/image">
                                    {/* Top Area Overlays */}
                                    <div className="absolute top-2 md:top-4 inset-x-2 md:inset-x-4 z-30 flex justify-between items-start pointer-events-none">
                                        {/* Promo badges (stacked, top-left) */}
                                        <div className="flex flex-col items-start gap-1">
                                            {product.discountPct && product.discountPct > 0 ? (
                                                <span className="bg-[#F6DE7F] text-[var(--color-brand-onyx)] font-bold text-[9px] md:text-[11px] px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-sm whitespace-nowrap">{product.discountPct}% OFF</span>
                                            ) : null}
                                            {product.onSale && (
                                                <span className="bg-red-500 text-white font-bold text-[9px] md:text-[11px] px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-sm">SALE</span>
                                            )}
                                            {product.isFeatured && (
                                                <span className="bg-[var(--color-brand-onyx)] text-white font-bold text-[9px] md:text-[11px] px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-sm">FEATURED</span>
                                            )}
                                        </div>
                                        {/* Wishlist Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (isInWishlist(product.id)) {
                                                    removeFromWishlist(product.id);
                                                } else {
                                                    addToWishlist(product);
                                                }
                                            }}
                                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[var(--color-brand-onyx)] hover:bg-white hover:text-red-500 transition-colors shadow-none md:shadow-sm pointer-events-auto"
                                            aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                        >
                                            <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`} />
                                        </button>
                                    </div>

                                    {/* Image Wrapper */}
                                    <Link href={`/product/${product.productFamily || product.slug || product.id}`} className="block absolute inset-0 cursor-pointer overflow-hidden rounded-[1.25rem]">
                                        <div className="relative w-full h-full">
                                            {/* Primary Image */}
                                            <Image
                                                src={product.image || '/assets/placeholder.png'}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                priority={index < 4}
                                            />

                                            {/* Secondary Hover Image (Slide Up) */}
                                            <motion.div
                                                variants={{
                                                    initial: { y: "100%" },
                                                    hover: { y: 0 }
                                                }}
                                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                className="absolute inset-0 z-10 bg-gray-50"
                                            >
                                                <Image
                                                    src={product.hoverImage || product.image || '/assets/placeholder.png'}
                                                    alt={`${product.name} alternate view`}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                    className="object-cover"
                                                />
                                            </motion.div>
                                        </div>
                                    </Link>

                                    {/* Arch Cutout Overlapping the bottom edge */}
                                    <div className="absolute -bottom-6 md:-bottom-8 w-full z-20 flex justify-center pointer-events-none">
                                        <div className="relative bg-white w-[90%] md:w-[85%] h-10 md:h-[3.5rem] rounded-[1.5rem] flex items-center justify-around px-2 md:px-4 pointer-events-auto shadow-none md:shadow-none">
                                            {/* Left Action Button (View) */}
                                            <Link href={`/product/${product.productFamily || product.slug || product.id}`} className="text-[var(--color-brand-onyx)] hover:text-gray-500 transition-colors p-1 md:p-2">
                                                <motion.div whileHover={{ scale: 1.05 }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] md:w-[24px] md:h-[24px]">
                                                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                </motion.div>
                                            </Link>

                                            {/* Right Action Button (Add to Cart) */}
                                            <button onClick={() => addToCart(product)} className="text-[var(--color-brand-onyx)] hover:text-gray-500 transition-colors p-1 md:p-2">
                                                <motion.div whileHover={{ scale: 1.05 }}>
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px] md:w-[26px] md:h-[26px]">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                </motion.div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Info Below Image */}
                                <div className="pt-8 md:pt-10 pb-1 md:pb-2 px-1 text-center bg-white flex flex-col items-center flex-grow justify-start z-10 relative">
                                    <Link href={`/product/${product.productFamily || product.slug || product.id}`} className="block group/link w-full">
                                        <h3 className="font-heading font-bold text-xs md:text-[18px] text-[var(--color-brand-onyx)] transition-colors group-hover/link:text-gray-600 leading-tight mb-2 md:mb-3 truncate px-1">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    {showProductPrices && (
                                        <Price
                                            amount={product.price}
                                            originalAmount={product.originalPrice}
                                            className="justify-center gap-1 md:gap-1.5"
                                            amountClassName="font-heading font-extrabold text-[18px] md:text-[22px] text-[var(--color-brand-onyx)] tracking-tight leading-none"
                                            currencyClassName="font-sans font-semibold text-[11px] md:text-[13px] text-[var(--color-brand-onyx)]/70 uppercase leading-none"
                                            originalClassName="font-sans font-medium text-[11px] md:text-[13px] text-[var(--color-brand-onyx)]/30 leading-none ml-1"
                                        />
                                    )}
                                    {product.size && (
                                        <span className="font-sans text-[10px] md:text-[12px] text-[var(--color-brand-onyx)]/50 mt-1 md:mt-1.5">{product.size}</span>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
                )}

                {/* Infinite scroll: skeleton row shown while the next page loads */}
                {loadingMore && (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 mt-8 sm:mt-12">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-[1.5rem] p-3 shadow-sm">
                                <div className="aspect-[3/4] md:pt-[100%] md:aspect-auto rounded-[1.25rem] bg-gray-100 animate-pulse" />
                                <div className="mt-4 h-4 bg-gray-100 rounded animate-pulse" />
                                <div className="mt-2 h-3 w-1/2 mx-auto bg-gray-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Sentinel — observed by IntersectionObserver to auto-load the next page */}
                {!loadingProducts && hasMore && (
                    <div ref={sentinelRef} aria-hidden className="h-px w-full" />
                )}

                {/* End-of-results marker once everything is loaded */}
                {!loadingProducts && !loadingMore && !hasMore && categoryProducts.length > 0 && (
                    <p className="text-center text-sm text-[var(--color-brand-onyx)]/40 mt-12">
                        You&apos;ve reached the end — {totalCount} product{totalCount === 1 ? "" : "s"}.
                    </p>
                )}

                {!loadingProducts && categoryProducts.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center justify-center py-24 px-6 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-[var(--color-brand-purple)]/8 flex items-center justify-center mb-5">
                            <SlidersHorizontal className="w-8 h-8 text-[var(--color-brand-purple)]/60" />
                        </div>
                        <h3 className="font-heading text-2xl text-[var(--color-brand-onyx)] mb-2">
                            No products match your filters
                        </h3>
                        <p className="font-sans text-sm text-[var(--color-brand-onyx)]/55 max-w-md mb-6">
                            Try widening the price range, removing a filter, or browse the full collection.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={() => { clearAll(); setSortBy("featured"); }}
                                className="px-5 py-2.5 rounded-full bg-[var(--color-brand-purple)] text-white font-heading font-semibold text-sm hover:bg-[#5e4580] transition-colors shadow-[0_4px_14px_rgba(115,86,151,0.25)]"
                            >
                                Clear all filters
                            </button>
                            <Link
                                href="/category/all"
                                className="px-5 py-2.5 rounded-full bg-white border border-[var(--color-brand-onyx)]/15 text-[var(--color-brand-onyx)] font-heading font-semibold text-sm hover:border-[var(--color-brand-onyx)]/40 transition-colors"
                            >
                                Browse all products
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>

            <CategoryPromo category={category} />

            {/* SEO content + FAQ (keyed by category; nothing renders for "Shop All") */}
            <SeoContent data={SEO_CONTENT[category.toLowerCase()]} />

            {/* ── Filter drawer: left sidebar on desktop, bottom sheet on mobile ── */}
            {/* Backdrop */}
            <div
                aria-hidden
                onClick={() => setFiltersOpen(false)}
                className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${filtersOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            />
            {/* Panel — slides up from bottom on mobile, in from the left on desktop */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
                className={`fixed z-[70] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out will-change-transform
                    inset-x-0 bottom-0 max-h-[82vh] rounded-t-[1.75rem]
                    md:inset-y-0 md:left-0 md:right-auto md:bottom-auto md:h-full md:w-[360px] md:max-h-none md:rounded-none md:rounded-r-[1.75rem]
                    ${filtersOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:-translate-x-full"}`}
            >
                {/* Mobile grab handle */}
                <div className="md:hidden pt-3 flex justify-center">
                    <span className="h-1.5 w-10 rounded-full bg-gray-300" />
                </div>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 md:py-5 border-b border-black/5">
                    <h2 className="font-heading font-extrabold text-lg md:text-xl text-[var(--color-brand-onyx)]">Filters</h2>
                    <button
                        onClick={() => setFiltersOpen(false)}
                        aria-label="Close filters"
                        className="w-9 h-9 rounded-full bg-[var(--color-brand-sand)] flex items-center justify-center text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-onyx)] active:scale-95 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
                    {category === "Shop All" ? (
                        /* Shop All → choose a category */
                        <div>
                            <h3 className="font-heading font-bold text-sm text-[var(--color-brand-onyx)] mb-3">Category</h3>
                            <div className="flex flex-col gap-1">
                                {TOP_CATEGORIES.map((c) => (
                                    <button
                                        key={c.slug}
                                        onClick={() => { setFiltersOpen(false); router.push(`/category/${c.slug}`); }}
                                        className="flex items-center justify-between text-left px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-brand-onyx)]/80 hover:bg-[var(--color-brand-sand)] transition-colors"
                                    >
                                        {c.name}
                                        <ChevronDown size={16} className="-rotate-90 text-[var(--color-brand-onyx)]/30" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : subcategoryOptions.length > 0 && (
                        /* Category → choose a type (subcategory) */
                        <div>
                            <h3 className="font-heading font-bold text-sm text-[var(--color-brand-onyx)] mb-3">Type</h3>
                            <p className="text-xs text-[var(--color-brand-onyx)]/45 mb-3 -mt-1">Pick one or more — results update as you go.</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => router.push(categoryUrl(), { scroll: false })}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${selectedSubs.length === 0 ? "bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]" : "bg-white text-[var(--color-brand-onyx)]/70 border-gray-200 hover:border-[var(--color-brand-onyx)]/40"}`}
                                >
                                    All {category}
                                </button>
                                {subcategoryOptions.map((sub) => {
                                    const on = selectedSubs.includes(sub);
                                    return (
                                        <button
                                            key={sub}
                                            onClick={() => toggleSub(sub)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${on ? "bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]" : "bg-white text-[var(--color-brand-onyx)]/70 border-gray-200 hover:border-[var(--color-brand-onyx)]/40"}`}
                                        >
                                            {sub}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Price — only where products actually carry a price */}
                    {showPriceFilter && (
                        <div>
                            <h3 className="font-heading font-bold text-sm text-[var(--color-brand-onyx)] mb-3">Price (AED)</h3>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number" min={0} value={priceRange[0]} placeholder="Min"
                                    onChange={(e) => setPriceRange([Math.max(0, +e.target.value || 0), priceRange[1]])}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-brand-purple)]"
                                />
                                <span className="text-[var(--color-brand-onyx)]/30">–</span>
                                <input
                                    type="number" min={0} value={priceRange[1]} placeholder="Max"
                                    onChange={(e) => setPriceRange([priceRange[0], +e.target.value || 0])}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-brand-purple)]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-black/5 px-6 py-4 flex items-center gap-3">
                    <button
                        onClick={clearAll}
                        className="px-5 py-3 rounded-full border border-gray-200 text-[var(--color-brand-onyx)]/60 font-heading font-bold text-sm hover:border-[var(--color-brand-onyx)]/30 transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setFiltersOpen(false)}
                        className="flex-1 px-5 py-3 rounded-full bg-[var(--color-brand-onyx)] text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        Show {totalCount} {totalCount === 1 ? "product" : "products"}
                    </button>
                </div>
            </div>

        </div>
    );
}
