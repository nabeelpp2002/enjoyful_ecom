"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { displayName } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Package, Search, Loader2, Eye, EyeOff, Upload, Download, ImageOff, Image as LucideImage } from "lucide-react";
import { AdminTableSkeleton } from "@/components/ui/AdminSkeleton";
import Image from "next/image";

interface AdminProduct {
    id: string;
    name: string;
    slug?: string;
    category: string;
    subcategory?: string;
    productType?: string;
    tagline?: string;
    brand?: string;
    price: number;
    originalPrice?: number;
    discountPct?: number;
    description?: string;
    howToUse?: string;
    rating?: number;
    reviews?: number;
    benefits?: string[];
    ingredients?: string[];
    highlights?: string[];
    suitableFor?: string[];
    image?: string;
    images?: string[];
    size?: string;
    productCode?: string;
    skuCode?: string;
    variant?: string;
    unitType?: string;
    mockupStatus?: string;
    productFamily?: string;
    isHidden?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    onSale?: boolean;
    bestDeal?: boolean;
}

type PromoFlag = "isFeatured" | "onSale" | "bestDeal";

const PRODUCTS_CACHE_KEY = "enjoyful-admin-products-cache";

export default function AdminProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedImageStatus, setSelectedImageStatus] = useState<"all" | "has_image" | "missing_image">("all");
    const [toggling, setToggling] = useState<string | null>(null);

    const fetchProducts = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        const res = await fetch("/api/admin/products");
        if (res.status === 401 || res.status === 403) {
            setAuthError(true);
            setLoading(false);
            return;
        }
        if (res.ok) {
            const data: AdminProduct[] = await res.json();
            setProducts(data);
            try { sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data)); } catch {}
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Instant render from cache, then background refresh
        try {
            const cached = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
            if (cached) {
                setProducts(JSON.parse(cached));
                setLoading(false);
                fetchProducts(true);
                return;
            }
        } catch {}
        fetchProducts(false);
    }, [fetchProducts]);

    const handleEditClick = (product: AdminProduct) => {
        try {
            sessionStorage.setItem(`enjoyful-admin-product-${product.id}`, JSON.stringify(product));
        } catch {}
    };

    const handleToggleVisibility = async (product: AdminProduct) => {
        setToggling(product.id);
        setProducts(prev => prev.map(p =>
            p.id === product.id ? { ...p, isHidden: !p.isHidden } : p
        ));
        const res = await fetch(`/api/admin/products/${product.id}/visibility`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isHidden: !product.isHidden }),
        });
        if (!res.ok) {
            setProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, isHidden: product.isHidden } : p
            ));
        }
        setToggling(null);
    };

    // Toggle a promo flag (onSale / bestDeal / isFeatured) — optimistic, reverts on error.
    // MUST go through /api/admin/products/:id which forwards the admin_access_token;
    // the public /api/products/:id uses the customer token and would 403 for admins.
    const handleToggleFlag = async (product: AdminProduct, flag: PromoFlag) => {
        const next = !product[flag];
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, [flag]: next } : p));
        try {
            const res = await fetch(`/api/admin/products/${product.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [flag]: next }),
            });
            if (!res.ok) throw new Error("update failed");
            try { sessionStorage.removeItem(PRODUCTS_CACHE_KEY); } catch {}
        } catch {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, [flag]: !next } : p));
        }
    };

    // Export the products table as a CSV (one row per variant / SKU).
    const handleExportCsv = () => {
        const cols = ["Name", "Category", "Subcategory", "Type", "Size", "Product Code", "SKU Code", "Variant", "Unit Type", "Mockup Status", "Family", "Price", "Original Price", "Discount %", "Status", "Featured", "Sale", "Deal", "Slug"];
        const esc = (v: unknown) => {
            const s = v === null || v === undefined ? "" : String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const rows = products.map(p => [
            p.name, p.category, p.subcategory ?? "", p.productType ?? "", p.size ?? "", p.productCode ?? "", p.skuCode ?? "", p.variant ?? "", p.unitType ?? "", p.mockupStatus ?? "", p.productFamily ?? "",
            p.price, p.originalPrice ?? "", p.discountPct ?? "", p.isHidden ? "Hidden" : "Visible",
            p.isFeatured ? "Yes" : "No", p.onSale ? "Yes" : "No", p.bestDeal ? "Yes" : "No", p.slug ?? "",
        ].map(esc).join(","));
        const csv = [cols.join(","), ...rows].join("\n");
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `enjoyful-products-${products.length}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const q = search.toLowerCase().trim();

    const imageAndSearchFiltered = useMemo(() => {
        return products.filter(p => {
            if (selectedImageStatus !== "all") {
                const hasImg = Boolean((p.images && p.images.length > 0 && p.images[0]) || p.image);
                if (selectedImageStatus === "has_image" && !hasImg) return false;
                if (selectedImageStatus === "missing_image" && hasImg) return false;
            }
            if (q) {
                return (
                    p.name?.toLowerCase().includes(q) ||
                    p.category?.toLowerCase().includes(q) ||
                    p.size?.toLowerCase().includes(q) ||
                    p.productCode?.toLowerCase().includes(q) ||
                    p.productFamily?.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [products, selectedImageStatus, q]);

    const filtered = useMemo(() => {
        return imageAndSearchFiltered.filter(p => {
            if (selectedCategory !== "all" && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
                return false;
            }
            return true;
        });
    }, [imageAndSearchFiltered, selectedCategory]);

    const getImage = (p: AdminProduct) => p.images?.[0] || p.image || null;

    // Group products by productFamily — variants (e.g. 200ml + 500ml of the same product)
    // appear as ONE row with size chips. Products with no family show individually.
    const grouped = useMemo(() => {
        const familyMap = new Map<string, AdminProduct[]>();
        const solo: AdminProduct[] = [];
        filtered.forEach(p => {
            const fam = p.productFamily?.trim();
            if (fam) {
                if (!familyMap.has(fam)) familyMap.set(fam, []);
                familyMap.get(fam)!.push(p);
            } else {
                solo.push(p);
            }
        });
        const rows: { key: string; variants: AdminProduct[] }[] = [];
        familyMap.forEach((variants, fam) => rows.push({ key: fam, variants }));
        solo.forEach(p => rows.push({ key: p.id, variants: [p] }));
        return rows;
    }, [filtered]);

    if (authError) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <Package className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-[#1A1A1B] font-semibold mb-1">Session expired</p>
                <p className="text-[#1A1A1B]/40 text-sm mb-6">Please log in again to continue.</p>
                <button
                    onClick={() => router.push("/admin/login")}
                    className="px-5 py-2.5 rounded-xl bg-[#735697] text-white text-sm font-semibold hover:bg-[#5e4580] transition-colors"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">Products</h1>
                    <p className="text-[#1A1A1B]/40 text-xs mt-0.5">{grouped.length} products · {products.length} variants</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCsv}
                        disabled={products.length === 0}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-black/8 hover:border-[#735697]/40 text-[#1A1A1B] text-sm font-semibold transition-all disabled:opacity-40"
                        title="Export all products as CSV"
                    >
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                    </button>
                    <Link
                        href="/admin/products/bulk-import"
                        prefetch
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-black/8 hover:border-[#735697]/40 text-[#1A1A1B] text-sm font-semibold transition-all"
                        title="Bulk import from JSON or CSV"
                    >
                        <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Bulk Import</span>
                    </Link>
                    <Link
                        href="/admin/products/new"
                        prefetch
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#735697] hover:bg-[#5e4580] hover:scale-[1.02] active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-[0_2px_10px_rgba(115,86,151,0.2)]"
                    >
                        <Plus className="w-4 h-4" /> Add Product
                    </Link>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    <div className="relative w-full sm:w-64 flex-shrink-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1B]/25" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, SKU, size..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-black/8 rounded-xl text-[#1A1A1B] placeholder:text-[#1A1A1B]/25 focus:outline-none focus:border-[#735697]/40 text-sm shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-black/8 rounded-xl p-1 shadow-sm overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setSelectedImageStatus("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedImageStatus === "all"
                                    ? "bg-[#1A1A1B] text-white shadow-sm"
                                    : "text-[#1A1A1B]/60 hover:text-[#1A1A1B]"
                            }`}
                        >
                            All Products
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedImageStatus("has_image")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                selectedImageStatus === "has_image"
                                    ? "bg-[#735697] text-white shadow-sm"
                                    : "text-[#1A1A1B]/60 hover:text-[#735697]"
                            }`}
                        >
                            <LucideImage className="w-3.5 h-3.5" /> Has Image
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedImageStatus("missing_image")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                selectedImageStatus === "missing_image"
                                    ? "bg-red-500 text-white shadow-sm"
                                    : "text-[#1A1A1B]/60 hover:text-red-500"
                            }`}
                        >
                            <ImageOff className="w-3.5 h-3.5" /> Missing Image
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {(["all", "Glow", "Baby", "Daily", "Fragrances", "Home Care"]).map(cat => {
                        const count = cat === "all"
                            ? imageAndSearchFiltered.length
                            : imageAndSearchFiltered.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all flex items-center gap-1.5 ${
                                    selectedCategory.toLowerCase() === cat.toLowerCase()
                                        ? "bg-[#1A1A1B] text-white shadow-sm"
                                        : "bg-white border border-black/8 text-[#1A1A1B]/60 hover:border-[#735697]/40 hover:text-[#735697]"
                                }`}
                            >
                                <span>{cat === "all" ? "All Categories" : cat}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    selectedCategory.toLowerCase() === cat.toLowerCase()
                                        ? "bg-white/20 text-white"
                                        : "bg-[#F9F5F0] text-[#1A1A1B]/40"
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <AdminTableSkeleton rows={6} />
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white border border-black/5 rounded-2xl shadow-sm">
                    <Package className="w-10 h-10 text-[#1A1A1B]/10 mx-auto mb-3" />
                    <p className="text-[#1A1A1B]/30 text-sm">No products found</p>
                </div>
            ) : (
                <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-black/5 bg-[#F9F5F0]/80">
                                <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide">Product</th>
                                <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Category</th>
                                <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden lg:table-cell">SKU</th>
                                <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Size / Variants</th>
                                <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide">Price</th>
                                <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Promo</th>
                                <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/4">
                            {grouped.map(({ key, variants }) => {
                                // Representative: first visible variant, or just first
                                const rep = variants.find(v => !v.isHidden) ?? variants[0];
                                const img = getImage(rep);
                                const isMulti = variants.length > 1;
                                // Base name without brand prefix. For grouped variants, also strip the
                                // trailing size token (e.g. "Jasmin Oil 200ml" → "Jasmin Oil") since the
                                // sizes are shown as chips beside it.
                                let shortName = displayName(rep.name, rep.brand ?? "Enjoyful Life");
                                if (isMulti) {
                                    variants.forEach(v => {
                                        if (v.size) {
                                            shortName = shortName.replace(new RegExp(`\\s*${v.size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").trim();
                                        }
                                    });
                                }
                                const allHidden = variants.every(v => v.isHidden);
                                const someHidden = variants.some(v => v.isHidden);
                                // A product with a family opens the GROUP view (by family slug);
                                // a stand-alone product opens its single view (by id).
                                const fam = rep.productFamily?.trim();
                                const rowHref = fam
                                    ? `/admin/products/group/${encodeURIComponent(fam)}`
                                    : `/admin/products/${rep.id}`;

                                return (
                                    <tr
                                        key={key}
                                        className={`transition-colors ${allHidden ? "bg-[#F9F5F0]/60" : "hover:bg-[#F9F5F0]/50"}`}
                                    >
                                        {/* Product name → opens the group (or single) view */}
                                        <td className="px-5 py-3.5">
                                            <Link
                                                href={rowHref}
                                                onClick={() => handleEditClick(rep)}
                                                prefetch
                                                className="flex items-center gap-3 group"
                                            >
                                                <div className={`w-10 h-10 rounded-lg bg-[#F9F5F0] border border-black/5 flex-shrink-0 overflow-hidden ${allHidden ? "opacity-50" : ""}`}>
                                                    {img ? (
                                                        <Image src={img} alt={shortName} width={40} height={40} className="w-full h-full object-cover" loading="lazy" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-4 h-4 text-[#1A1A1B]/20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`font-medium line-clamp-1 max-w-[160px] group-hover:text-[#735697] transition-colors ${allHidden ? "text-[#1A1A1B]/40" : "text-[#1A1A1B]"}`}>
                                                    {shortName}
                                                </p>
                                            </Link>
                                        </td>

                                        {/* Category */}
                                        <td className="px-5 py-3.5 text-[#1A1A1B]/50 text-sm hidden sm:table-cell">{rep.category}</td>

                                        {/* SKU (rep variant) */}
                                        <td className="px-5 py-3.5 hidden lg:table-cell">
                                            {isMulti ? (
                                                <span className="font-mono text-xs text-[#1A1A1B]/40">{variants.map(v => v.skuCode || v.productCode).filter(Boolean).join(", ") || "—"}</span>
                                            ) : (
                                                <span className="font-mono text-xs text-[#1A1A1B]/60">{rep.skuCode || rep.productCode || "—"}</span>
                                            )}
                                        </td>

                                        {/* Size / variants */}
                                        <td className="px-5 py-3.5 hidden md:table-cell">
                                            {isMulti ? (
                                                // Multiple sizes — show as chips linking to each variant
                                                <div className="flex flex-wrap gap-1.5">
                                                    {variants.map(v => (
                                                        <Link
                                                            key={v.id}
                                                            href={rowHref}
                                                            onClick={() => handleEditClick(v)}
                                                            prefetch
                                                            title={`View ${v.size ?? v.name}`}
                                                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all hover:border-[#735697]/50 hover:text-[#735697] ${
                                                                v.isHidden
                                                                    ? "bg-[#F9F5F0] text-[#1A1A1B]/30 border-black/8"
                                                                    : "bg-[#735697]/8 text-[#735697] border-[#735697]/20"
                                                            }`}
                                                        >
                                                            {v.size ?? "–"}
                                                            {v.isHidden && <span className="ml-0.5 opacity-50">●</span>}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                rep.size ? (
                                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#735697]/8 text-[#735697] border border-[#735697]/20">
                                                        {rep.size}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#1A1A1B]/20 text-xs">–</span>
                                                )
                                            )}
                                        </td>

                                        {/* Price */}
                                        <td className="px-5 py-3.5">
                                            {isMulti ? (
                                                // Show price range across variants
                                                <span className="text-[#1A1A1B] font-semibold text-sm">
                                                    {Math.min(...variants.map(v => v.price))}
                                                    {Math.min(...variants.map(v => v.price)) !== Math.max(...variants.map(v => v.price))
                                                        ? `–${Math.max(...variants.map(v => v.price))}`
                                                        : ""} AED
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-[#1A1A1B] font-semibold">{rep.price} AED</span>
                                                    {rep.discountPct ? (
                                                        <span className="ml-2 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium">
                                                            -{rep.discountPct}%
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </td>

                                        {/* Promo flags — apply to representative (first visible variant) */}
                                        <td className="px-5 py-3.5 hidden lg:table-cell">
                                            <div className="flex items-center gap-1.5">
                                                {([
                                                    ["onSale", "Sale", "bg-red-500"],
                                                    ["bestDeal", "Deal", "bg-[#735697]"],
                                                    ["isFeatured", "Feat", "bg-[#1A1A1B]"],
                                                ] as [PromoFlag, string, string][]).map(([flag, label, color]) => {
                                                    const on = rep[flag] ?? false;
                                                    return (
                                                        <button
                                                            key={flag}
                                                            onClick={() => handleToggleFlag(rep, flag)}
                                                            title={`${on ? "Remove" : "Add"} ${label} badge`}
                                                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${on
                                                                ? `${color} text-white border-transparent`
                                                                : "bg-white text-[#1A1A1B]/40 border-black/10 hover:border-black/25"}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5 hidden md:table-cell">
                                            <button
                                                onClick={() => handleToggleVisibility(rep)}
                                                disabled={toggling === rep.id}
                                                title={rep.isHidden ? "Click to show" : "Click to hide"}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                                    allHidden
                                                        ? "bg-[#F9F5F0] text-[#1A1A1B]/40 border-black/8 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100"
                                                        : someHidden && isMulti
                                                        ? "bg-amber-50 text-amber-600 border-amber-100"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
                                                }`}
                                            >
                                                {toggling === rep.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : allHidden ? (
                                                    <EyeOff className="w-3 h-3" />
                                                ) : (
                                                    <Eye className="w-3 h-3" />
                                                )}
                                                {allHidden ? "Hidden" : someHidden && isMulti ? "Partial" : "Visible"}
                                            </button>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
