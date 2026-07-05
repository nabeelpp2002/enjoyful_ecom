"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown, SlidersHorizontal, X, Loader2, Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Suspense } from "react";
import { CategoryPromo } from "@/components/sections/CategoryPromo";
import { SeoContent } from "@/components/sections/SeoContent";
import { SEO_CONTENT } from "@/data/seo-content";
import type { Product } from "@/data/products";
import { displayName, pickProductImages } from "@/lib/utils";

interface ApiProduct extends Record<string, unknown> {
    _id: string;
    name: string;
    slug?: string;
    price: number;
    originalPrice?: number;
    discountPct?: number;
    image?: string;
    hoverImage?: string;
    images?: Array<{ url: string } | string>;
    category?: { name: string; slug?: string } | string;
    subcategory?: string;
    productType?: string;
    rating?: number;
    reviews?: number;
    skinType?: string[];
    size?: string;
    productFamily?: string;
    onSale?: boolean;
    bestDeal?: boolean;
    isFeatured?: boolean;
}

function normalizeApi(p: ApiProduct): Product {
    const imgs = (p.images ?? []).map(i => (typeof i === 'string' ? i : i.url)).filter(Boolean);
    const cat = typeof p.category === 'object' && p.category !== null
        ? (p.category as { name: string }).name
        : (p.category as string) ?? '';
    // Prefer the "*21" thumbnail; reuse the single image for hover.
    const { image, hoverImage, images } = pickProductImages(
        imgs.length ? imgs : [p.image, p.hoverImage].filter(Boolean) as string[],
    );
    return {
        id: p._id,
        name: displayName(p.name, p.brand as string),
        slug: p.slug,
        category: cat,
        subcategory: p.subcategory ?? '',
        price: p.price,
        originalPrice: p.originalPrice,
        discountPct: p.discountPct,
        image,
        hoverImage,
        images: images.length ? images : undefined,
        rating: p.rating ?? 0,
        reviews: p.reviews ?? 0,
        description: '',
        productType: p.productType ?? '',
        skinType: p.skinType ?? [],
        benefits: [],
        ingredients: [],
        howToUse: '',
        size: p.size,
        productFamily: p.productFamily,
        onSale: p.onSale ?? false,
        bestDeal: p.bestDeal ?? false,
        isFeatured: p.isFeatured ?? false,
    } as Product;
}

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

// Subcategory options per category (must match seeded product `subcategory` values)
const SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
    Glow: ["Face Wash", "Face Scrub", "Face Mask", "Sunscreen", "Aloe Vera Gel", "Toner"],
    Daily: ["Body Lotion", "Body Cream", "Shower Gel", "Shampoo", "Hair Oil", "Hair Serum", "Intimate Wash"],
    Baby: ["Baby Lotion", "Baby Wash", "Baby Talc", "Baby Rash Cream", "Baby Soap"],
    Fragrances: ["Perfume", "Body Mist", "Roll On", "Deo Stick"],
    "Home Care": ["Kitchen Care", "Bathroom Care", "Floor & Surface Care", "Hand Care", "Laundry Care"],
};

function CategoryPageContent({ params }: { params: Promise<{ category: string }> }) {
    const resolvedParams = use(params);
    // Decode and reconstruct capitalized category from URL path
    const urlCategoryRaw = decodeURIComponent(resolvedParams.category);
    let category = urlCategoryRaw.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Normalize "Shop All", "All", "shop-all" into just "All" for easier logic
    if (urlCategoryRaw.toLowerCase().includes("all")) {
        category = "Shop All";
    }

    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";
    const subcategoryParam = searchParams.get("subcategory") || "";
    const subcategoryOptions = SUBCATEGORIES_BY_CATEGORY[category] ?? [];

    const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useData();
    const [sortBy, setSortBy] = useState("featured");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
    const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
    const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const SKIN_TYPES = ["Dry", "Oily", "Combination", "Normal", "Sensitive"];

    // Server-side filtered/sorted/paginated results
    const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 12;

    // Admin-managed category banner (falls back to static art if none is set)
    const [banner, setBanner] = useState<{ desktopImageUrl?: string; mobileImageUrl?: string } | null>(null);
    useEffect(() => {
        if (category === "Shop All") { setBanner(null); return; }
        fetch("/api/category-banners")
            .then((r) => (r.ok ? r.json() : null))
            .then((body) => {
                const list = body?.data ?? body;
                const match = Array.isArray(list)
                    ? list.find((b: { category?: string }) => b.category === category)
                    : null;
                setBanner(match ?? null);
            })
            .catch(() => setBanner(null));
    }, [category]);

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
    }, [urlCategoryRaw, sortBy, priceRange, selectedSkinTypes, selectedProductTypes, query, subcategoryParam]);

    // Scroll back to the top when the page (pagination) changes so new items start in view.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [page]);

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
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
        if (priceRange[1] < 500) params.set('maxPrice', String(priceRange[1]));
        if (selectedSkinTypes.length > 0) params.set('skinType', selectedSkinTypes.join(','));
        if (selectedProductTypes.length > 0) params.set('productType', selectedProductTypes.join(','));
        if (query) params.set('q', query);

        try {
            const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) {
                setCategoryProducts([]); setTotalPages(1); setTotalCount(0);
                return;
            }
            const body = await res.json();
            const raw: ApiProduct[] = Array.isArray(body?.data) ? body.data : [];
            setCategoryProducts(raw.map(normalizeApi));
            setTotalPages(body?.meta?.totalPages ?? 1);
            setTotalCount(body?.meta?.total ?? raw.length);
        } finally {
            setLoadingProducts(false);
        }
    }, [page, sortBy, priceRange, selectedSkinTypes, selectedProductTypes, query, subcategoryParam, category, urlCategoryRaw]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
    if (subcategoryParam) {
        info = {
            ...info,
            title: `${categoryInfo[category]?.title ?? category} — ${subcategoryParam}`,
            description: `Browse our ${subcategoryParam} collection.`,
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

    const clearAll = useCallback(() => {
        setPriceRange([0, 500]);
        setSelectedSkinTypes([]);
        setSelectedProductTypes([]);
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

    const toggleSkinType = (type: string) => {
        setSelectedSkinTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const handleWishlistToggle = (product: Product) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <div className={`${info.bgColor} min-h-screen transition-colors duration-500`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8 md:mb-12 mt-16 md:mt-18 overflow-hidden shadow-sm border border-black/5 aspect-[4/3] md:aspect-[3/0.9] relative"
            >
                <Image
                    src={banner?.mobileImageUrl || banner?.desktopImageUrl || (category === "Glow" ? "/assets/perfume-for-mobile.png" : category === "Baby" ? "/assets/baby-banner.png" : category === "Daily" ? "/assets/daily-banner.png" : "/assets/categoryAd.jpeg")}
                    alt={`${category} banner`}
                    fill
                    className="object-cover md:hidden"
                />
                <Image
                    src={banner?.desktopImageUrl || (category === "Glow" ? "/assets/glow-banner.jpeg" : category === "Baby" ? "/assets/baby-banner.png" : category === "Daily" ? "/assets/daily-banner.png" : "/assets/categoryAd.jpeg")}
                    alt={`${category} banner`}
                    fill
                    className="object-cover hidden md:block"
                />
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
                    {/* Dismissible subcategory chip */}
                    {!query && subcategoryParam && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center gap-2"
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-purple)] text-white text-sm font-medium">
                                {subcategoryParam}
                                <button
                                    onClick={clearSubcategory}
                                    aria-label="Clear subcategory filter"
                                    className="hover:text-gray-300 transition-colors ml-0.5"
                                >
                                    <X size={13} />
                                </button>
                            </span>
                        </motion.div>
                    )}
                </div>



                {/* Modern Filter Top Bar */}
                <div ref={dropdownRef} className="flex flex-row justify-between items-center gap-2 md:gap-4 mb-6 md:mb-8 z-30 relative">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-1 md:flex-none">
                        {/* Subcategory Dropdown (Hidden on Mobile) — only for real categories */}
                        {subcategoryOptions.length > 0 && (
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-sm font-medium border transition-colors ${openDropdown === 'type' || subcategoryParam ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-gray-100 text-[var(--color-brand-onyx)] border-transparent hover:bg-gray-200'}`}
                                >
                                    {subcategoryParam || 'Category'}
                                    <ChevronDown size={14} className={`transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {openDropdown === 'type' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 mt-3 w-60 bg-white rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 z-50"
                                        >
                                            <button
                                                onClick={() => { setOpenDropdown(null); router.push(categoryUrl()); }}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-sans transition-colors ${!subcategoryParam ? 'bg-[var(--color-brand-sand)] font-semibold text-[var(--color-brand-onyx)]' : 'text-[var(--color-brand-onyx)]/70 hover:bg-gray-50'}`}
                                            >
                                                All {category}
                                            </button>
                                            {subcategoryOptions.map((sub) => (
                                                <button
                                                    key={sub}
                                                    onClick={() => { setOpenDropdown(null); router.push(categoryUrl(sub)); }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-sans transition-colors ${subcategoryParam === sub ? 'bg-[var(--color-brand-onyx)] text-white font-semibold' : 'text-[var(--color-brand-onyx)]/70 hover:bg-gray-50'}`}
                                                >
                                                    {sub}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Price Range Dropdown (Hidden on Mobile) */}
                        <div className="relative hidden md:block">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-sm font-medium border transition-colors ${openDropdown === 'price' || priceRange[0] > 0 || priceRange[1] < 100 ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-gray-100 text-[var(--color-brand-onyx)] border-transparent hover:bg-gray-200'}`}
                            >
                                Price {(priceRange[0] > 0 || priceRange[1] < 500) && `(${priceRange[0]} - ${priceRange[1]} AED)`}
                                <ChevronDown size={14} className={`transition-transform ${openDropdown === 'price' ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {openDropdown === 'price' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 z-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-sans text-xs">AED</span>
                                                <input
                                                    type="number"
                                                    value={priceRange[0]}
                                                    onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                                                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-onyx)]/20"
                                                />
                                            </div>
                                            <span className="text-gray-400">-</span>
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-sans text-xs">AED</span>
                                                <input
                                                    type="number"
                                                    value={priceRange[1]}
                                                    onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                                                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-onyx)]/20"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Skin Type Dropdown (Hidden on Mobile) */}
                        {category === "Glow" && (
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'skin' ? null : 'skin')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-sm font-medium border transition-colors ${openDropdown === 'skin' || selectedSkinTypes.length > 0 ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-gray-100 text-[var(--color-brand-onyx)] border-transparent hover:bg-gray-200'}`}
                                >
                                    Skin Type {selectedSkinTypes.length > 0 && `(${selectedSkinTypes.length})`}
                                    <ChevronDown size={14} className={`transition-transform ${openDropdown === 'skin' ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {openDropdown === 'skin' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 z-50"
                                        >
                                            <div className="space-y-3">
                                                {["Dry", "Oily", "Combination", "Normal", "Sensitive"].map((type) => (
                                                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSkinTypes.includes(type)}
                                                            onChange={() => toggleSkinType(type)}
                                                            className="w-5 h-5 rounded border-gray-300 text-[var(--color-brand-onyx)] focus:ring-[var(--color-brand-onyx)]"
                                                        />
                                                        <span className="font-sans text-sm text-[var(--color-brand-onyx)]">
                                                            {type}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* All Filters / Clear Filters */}
                        <div className="flex items-center gap-2 md:gap-3 md:ml-2 md:border-l border-gray-200 md:pl-4 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => setFiltersOpen(true)}
                                className="flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full font-sans text-xs md:text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-[var(--color-brand-onyx)] flex-1 md:flex-shrink-0"
                            >
                                <SlidersHorizontal size={14} /> All Filters
                            </button>

                            {(selectedProductTypes.length > 0 || selectedSkinTypes.length > 0 || priceRange[0] > 0 || priceRange[1] < 100 || query) && (
                                <button
                                    onClick={clearAll}
                                    className="font-sans text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sort By — custom styled dropdown */}
                    <div className="relative flex-1 md:flex-shrink-0 md:w-auto">
                        <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                            className={`w-full flex items-center justify-between gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full border font-sans text-xs md:text-sm font-medium transition-colors ${openDropdown === 'sort' ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-white text-[var(--color-brand-onyx)] border-gray-200 hover:border-gray-300'}`}
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


                {/* Result count + loading hint */}
                {!loadingProducts && categoryProducts.length > 0 && (
                    <p className="text-sm text-[var(--color-brand-onyx)]/55 mb-4">
                        Showing <span className="font-semibold text-[var(--color-brand-onyx)]">{categoryProducts.length}</span> of {totalCount} products
                    </p>
                )}

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
                                        <h3 className="font-heading font-bold text-xs md:text-[18px] text-[var(--color-brand-onyx)] transition-colors group-hover/link:text-gray-600 leading-tight mb-1 truncate px-1">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <p className="font-sans font-normal text-[11px] md:text-[14px] text-gray-500 mt-0 md:mt-1">
                                        {product.price} AED
                                        {product.size && <span className="text-gray-400"> · {product.size}</span>}
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
                )}

                {/* Pagination */}
                {!loadingProducts && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-[var(--color-brand-onyx)]/15 text-[var(--color-brand-onyx)] hover:border-[var(--color-brand-onyx)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm font-semibold text-[var(--color-brand-onyx)] tabular-nums">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-[var(--color-brand-onyx)] text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
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

            {/* All Filters drawer (bottom sheet on mobile, centered modal on desktop) */}
            <AnimatePresence>
                {filtersOpen && (
                    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setFiltersOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0.5 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0.5 }}
                            transition={{ type: "spring", damping: 32, stiffness: 320 }}
                            className="relative w-full md:max-w-lg bg-white rounded-t-[2rem] md:rounded-[2rem] max-h-[85vh] overflow-y-auto shadow-2xl"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5 border-b border-black/5 z-10">
                                <h2 className="font-heading font-extrabold text-xl text-[var(--color-brand-onyx)]">Filters</h2>
                                <button onClick={() => setFiltersOpen(false)} aria-label="Close"
                                    className="w-9 h-9 rounded-full bg-[var(--color-brand-sand)] flex items-center justify-center text-[var(--color-brand-onyx)]/60 active:scale-95 transition-transform">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-7">
                                {/* Subcategory */}
                                {subcategoryOptions.length > 0 && (
                                    <div>
                                        <h3 className="font-heading font-bold text-sm text-[var(--color-brand-onyx)] mb-3">Type</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => router.push(categoryUrl())}
                                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${!subcategoryParam ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-white text-[var(--color-brand-onyx)]/70 border-gray-200 hover:border-[var(--color-brand-onyx)]/40'}`}
                                            >
                                                All
                                            </button>
                                            {subcategoryOptions.map((sub) => (
                                                <button
                                                    key={sub}
                                                    onClick={() => router.push(categoryUrl(sub))}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${subcategoryParam === sub ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-white text-[var(--color-brand-onyx)]/70 border-gray-200 hover:border-[var(--color-brand-onyx)]/40'}`}
                                                >
                                                    {sub}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Price range */}
                                <div>
                                    <h3 className="font-heading font-bold text-sm text-[var(--color-brand-onyx)] mb-3">Price Range (AED)</h3>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number" min={0} value={priceRange[0]}
                                            onChange={(e) => setPriceRange([Math.max(0, +e.target.value || 0), priceRange[1]])}
                                            placeholder="Min"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-sans focus:outline-none focus:border-[var(--color-brand-purple)]"
                                        />
                                        <span className="text-[var(--color-brand-onyx)]/30">—</span>
                                        <input
                                            type="number" min={0} value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], +e.target.value || 0])}
                                            placeholder="Max"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-sans focus:outline-none focus:border-[var(--color-brand-purple)]"
                                        />
                                    </div>
                                </div>

                                {/* Skin type */}
                                <div>
                                    <h3 className="font-heading font-bold text-sm text-[var(--color-brand-onyx)] mb-3">Skin Type</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {SKIN_TYPES.map((t) => {
                                            const on = selectedSkinTypes.includes(t);
                                            return (
                                                <button
                                                    key={t}
                                                    onClick={() => setSelectedSkinTypes(prev => on ? prev.filter(x => x !== t) : [...prev, t])}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${on ? 'bg-[var(--color-brand-onyx)] text-white border-[var(--color-brand-onyx)]' : 'bg-white text-[var(--color-brand-onyx)]/70 border-gray-200 hover:border-[var(--color-brand-onyx)]/40'}`}
                                                >
                                                    {t}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Footer actions */}
                            <div className="sticky bottom-0 bg-white flex items-center gap-3 px-6 py-4 border-t border-black/5">
                                <button
                                    onClick={() => { clearAll(); }}
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-brand-sand)] flex items-center justify-center">Loading...</div>}>
            <CategoryPageContent params={params} />
        </Suspense>
    );
}
