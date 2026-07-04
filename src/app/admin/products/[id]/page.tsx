"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft, Pencil, Eye, EyeOff, Package,
    Tag, Layers, BarChart2, ExternalLink, Download, Trash2, Loader2,
} from "lucide-react";
import { displayName } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    slug?: string;
    category: string | { name: string };
    subcategory?: string;
    productType?: string;
    tagline?: string;
    brand?: string;
    size?: string;
    productCode?: string;
    productFamily?: string;
    price: number;
    originalPrice?: number;
    discountPct?: number;
    currency?: string;
    description?: string;
    howToUse?: string;
    rating?: number;
    reviews?: number;
    isFeatured?: boolean;
    onSale?: boolean;
    bestDeal?: boolean;
    isHidden?: boolean;
    isActive?: boolean;
    benefits?: string[];
    ingredients?: string[];
    highlights?: string[];
    images?: Array<{ url: string } | string>;
    image?: string;
}

function extractCategory(cat: unknown): string {
    if (!cat) return "—";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object" && cat !== null && "name" in cat) return String((cat as { name: string }).name);
    return "—";
}

function getImageUrl(img: { url: string } | string | undefined): string {
    if (!img) return "";
    if (typeof img === "string") return img;
    return img.url;
}

const row = "flex items-center justify-between py-2.5 border-b border-black/4 last:border-0";
const label = "text-xs text-[#1A1A1B]/40 font-medium";
const value = "text-sm text-[#1A1A1B] font-semibold text-right";

interface Variant {
    id: string;
    size?: string;
    productCode?: string;
    price: number;
    originalPrice?: number;
    discountPct?: number;
    isHidden?: boolean;
    image?: string;
    images?: Array<{ url: string } | string>;
}

export default function AdminProductViewPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(0);
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        // Try session cache first
        try {
            const cached = sessionStorage.getItem(`enjoyful-admin-product-${id}`);
            if (cached) { setProduct(JSON.parse(cached)); setLoading(false); }
        } catch {}

        fetch(`/api/admin/products/${id}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    const p = data.data ?? data;
                    setProduct(p);
                    try { sessionStorage.setItem(`enjoyful-admin-product-${id}`, JSON.stringify(p)); } catch {}

                    // Load sibling variants in the same product family (admin list = all, incl. hidden)
                    const fam = (p.productFamily as string | undefined)?.trim();
                    if (fam) {
                        fetch(`/api/admin/products`)
                            .then(r => r.ok ? r.json() : [])
                            .then((list: (Variant & { productFamily?: string })[]) => {
                                const sibs = (Array.isArray(list) ? list : [])
                                    .filter(v => v.productFamily?.trim() === fam)
                                    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
                                setVariants(sibs);
                            })
                            .catch(() => {});
                    }
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleToggleVisibility = async () => {
        if (!product) return;
        setToggling(true);
        const next = !product.isHidden;
        setProduct(p => p ? { ...p, isHidden: next } : p);
        await fetch(`/api/admin/products/${id}/visibility`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isHidden: next }),
        });
        setToggling(false);
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-48 bg-black/5 rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-1 bg-white rounded-2xl h-72 border border-black/5" />
                    <div className="lg:col-span-2 bg-white rounded-2xl h-72 border border-black/5" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20">
                <Package className="w-10 h-10 text-[#1A1A1B]/10 mx-auto mb-3" />
                <p className="text-[#1A1A1B]/30 text-sm">Product not found</p>
                <Link href="/admin/products" className="mt-4 inline-block text-[#735697] text-sm hover:underline">← Back to Products</Link>
            </div>
        );
    }

    // Gallery shows images from the current SKU first, then every sibling variant
    // in the family (deduped) — so the group's full image set is visible here.
    const images: string[] = [];
    const pushImg = (u: string) => { if (u && !images.includes(u)) images.push(u); };
    if (product.image) pushImg(product.image);
    (product.images ?? []).map(getImageUrl).forEach(pushImg);
    if (variants.length > 1) {
        variants.forEach(v => {
            if (v.id === id) return; // current SKU already added first
            if (v.image) pushImg(v.image);
            (v.images ?? []).map(getImageUrl).forEach(pushImg);
        });
    }
    const mainImg = images[selectedImg] || images[0] || null;
    let shortName = displayName(product.name, product.brand ?? "Enjoyful Life");
    // When there are sibling sizes, drop the trailing size from the title (sizes show in the variants table)
    if (variants.length > 1) {
        variants.forEach(v => {
            if (v.size) {
                shortName = shortName.replace(new RegExp(`\\s*${v.size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").trim();
            }
        });
    }
    const categoryName = extractCategory(product.category);
    const isHidden = product.isHidden ?? false;
    const hasDiscount = product.discountPct && product.discountPct > 0;
    const hasOriginal = product.originalPrice && product.originalPrice > product.price;

    const handleDelete = async () => {
        if (!product || !confirm(`Delete "${shortName}"? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
            if (res.ok) {
                try { sessionStorage.removeItem("enjoyful-admin-products-cache"); } catch {}
                router.push("/admin/products");
            } else {
                setDeleting(false);
            }
        } catch {
            setDeleting(false);
        }
    };

    // Delete every SKU in this product family (all sizes) in one action.
    const handleDeleteGroup = async () => {
        if (!product) return;
        const ids = variants.length > 1 ? variants.map(v => v.id) : [id];
        if (!confirm(`Delete the entire "${shortName}" group — all ${ids.length} size${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            const results = await Promise.all(
                ids.map(vid => fetch(`/api/admin/products/${vid}`, { method: "DELETE" }).then(r => r.ok).catch(() => false)),
            );
            if (results.some(Boolean)) {
                try { sessionStorage.removeItem("enjoyful-admin-products-cache"); } catch {}
                router.push("/admin/products");
            } else {
                setDeleting(false);
            }
        } catch {
            setDeleting(false);
        }
    };

    // Export the full product details as a downloadable JSON file (matches the bulk-import shape).
    const handleExport = () => {
        if (!product) return;
        const fileBase = (product.slug || product.productCode || shortName || "product")
            .toString().trim().replace(/\s+/g, "-").toLowerCase();
        const blob = new Blob([JSON.stringify(product, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileBase}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/admin/products")}
                        className="text-[#1A1A1B]/30 hover:text-[#735697] transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">{shortName}</h1>
                        <p className="text-[#1A1A1B]/40 text-xs mt-0.5">
                            {product.productCode && <span className="mr-2 font-mono">#{product.productCode}</span>}
                            {categoryName}{product.subcategory ? ` · ${product.subcategory}` : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleVisibility}
                        disabled={toggling}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            isHidden
                                ? "bg-[#F9F5F0] text-[#1A1A1B]/40 border-black/8 hover:bg-amber-50 hover:text-amber-600"
                                : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-500"
                        }`}
                    >
                        {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {isHidden ? "Hidden" : "Visible"}
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border bg-white border-black/8 text-[#1A1A1B] hover:border-[#735697]/40 hover:text-[#735697] transition-all"
                        title="Download product details as JSON"
                    >
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                    <Link
                        href={`/admin/products/${id}/edit`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#735697] text-white text-xs font-semibold hover:bg-[#5e4580] transition-all shadow-sm"
                    >
                        <Pencil className="w-3.5 h-3.5" /> Edit Product
                    </Link>
                    {product.slug && (
                        <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer"
                            title="View on storefront"
                            className="p-2 rounded-xl text-[#1A1A1B]/30 hover:text-emerald-600 hover:bg-emerald-50 border border-black/8 transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                    {variants.length > 1 ? (
                        <button
                            onClick={handleDeleteGroup}
                            disabled={deleting}
                            title={`Delete all ${variants.length} sizes`}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border bg-white border-black/8 text-[#1A1A1B]/60 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Delete Group
                        </button>
                    ) : (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            title="Delete product"
                            className="p-2 rounded-xl text-[#1A1A1B]/30 hover:text-red-500 hover:bg-red-50 border border-black/8 transition-all disabled:opacity-50"
                        >
                            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: Images */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
                        {mainImg ? (
                            <div className="relative aspect-square">
                                <Image src={mainImg} alt={shortName} fill className="object-cover" />
                                {isHidden && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg">Hidden from store</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="aspect-square flex items-center justify-center">
                                <Package className="w-12 h-12 text-[#1A1A1B]/10" />
                            </div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {images.map((img, i) => (
                                <button key={i} onClick={() => setSelectedImg(i)}
                                    className={`relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                                        selectedImg === i ? "border-[#735697]" : "border-transparent hover:border-[#735697]/30"
                                    }`}>
                                    <Image src={img} alt="" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Core Details */}
                    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-xs font-semibold text-[#1A1A1B]/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Basic Info
                        </h2>
                        <div>
                            <div className={row}>
                                <span className={label}>Product Name</span>
                                <span className={value}>{shortName}</span>
                            </div>
                            <div className={row}>
                                <span className={label}>Full Name (in DB)</span>
                                <span className="text-xs text-[#1A1A1B]/40 text-right max-w-[60%] line-clamp-1">{product.name}</span>
                            </div>
                            {product.tagline && (
                                <div className={row}>
                                    <span className={label}>Tagline</span>
                                    <span className={value}>{product.tagline}</span>
                                </div>
                            )}
                            <div className={row}>
                                <span className={label}>Brand</span>
                                <span className={value}>{product.brand ?? "—"}</span>
                            </div>
                            <div className={row}>
                                <span className={label}>Category</span>
                                <span className={value}>{categoryName}</span>
                            </div>
                            {product.subcategory && (
                                <div className={row}>
                                    <span className={label}>Subcategory</span>
                                    <span className={value}>{product.subcategory}</span>
                                </div>
                            )}
                            {product.productType && (
                                <div className={row}>
                                    <span className={label}>Product Type</span>
                                    <span className={value}>{product.productType}</span>
                                </div>
                            )}
                            <div className={row}>
                                <span className={label}>Status</span>
                                <div className="flex gap-1.5">
                                    {product.isFeatured && <span className="px-2 py-0.5 bg-[#1A1A1B] text-white text-[10px] font-bold rounded-md">FEATURED</span>}
                                    {product.onSale && <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md">SALE</span>}
                                    {product.bestDeal && <span className="px-2 py-0.5 bg-[#735697] text-white text-[10px] font-bold rounded-md">BEST DEAL</span>}
                                    {!product.isFeatured && !product.onSale && !product.bestDeal && <span className="text-xs text-[#1A1A1B]/30">No badges</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SKU & Variants */}
                    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-semibold text-[#1A1A1B]/40 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" />
                                {variants.length > 1 ? `Variants (${variants.length} sizes)` : "Product Code & Size"}
                            </h2>
                            {product.productFamily && (
                                <span className="text-[10px] font-mono text-[#735697] bg-[#735697]/8 px-2 py-0.5 rounded-md">
                                    {product.productFamily}
                                </span>
                            )}
                        </div>

                        {variants.length > 1 ? (
                            // All sizes of this product — each is its own SKU/price
                            <div className="overflow-x-auto -mx-1">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-black/5 text-left">
                                            <th className="py-2 px-1 text-[10px] font-medium text-[#1A1A1B]/40 uppercase tracking-wide">Size</th>
                                            <th className="py-2 px-1 text-[10px] font-medium text-[#1A1A1B]/40 uppercase tracking-wide">SKU</th>
                                            <th className="py-2 px-1 text-[10px] font-medium text-[#1A1A1B]/40 uppercase tracking-wide text-right">Price</th>
                                            <th className="py-2 px-1 text-[10px] font-medium text-[#1A1A1B]/40 uppercase tracking-wide text-center">Status</th>
                                            <th className="py-2 px-1"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/4">
                                        {variants.map(v => {
                                            const isCurrent = v.id === id;
                                            return (
                                                <tr key={v.id} className={isCurrent ? "bg-[#735697]/5" : ""}>
                                                    <td className="py-2.5 px-1">
                                                        <span className="px-2 py-0.5 bg-[#735697]/10 text-[#735697] text-xs font-semibold rounded-lg">
                                                            {v.size || "—"}
                                                        </span>
                                                        {isCurrent && <span className="ml-1.5 text-[10px] text-[#1A1A1B]/30">(viewing)</span>}
                                                    </td>
                                                    <td className="py-2.5 px-1 font-mono text-xs text-[#1A1A1B]/60">{v.productCode || "—"}</td>
                                                    <td className="py-2.5 px-1 text-right">
                                                        <span className="font-semibold text-[#1A1A1B]">{v.price} AED</span>
                                                        {v.discountPct ? (
                                                            <span className="ml-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">-{v.discountPct}%</span>
                                                        ) : null}
                                                    </td>
                                                    <td className="py-2.5 px-1 text-center">
                                                        {v.isHidden
                                                            ? <span className="text-[10px] text-[#1A1A1B]/40">Hidden</span>
                                                            : <span className="text-[10px] text-emerald-600">Visible</span>}
                                                    </td>
                                                    <td className="py-2.5 px-1 text-right">
                                                        <Link href={`/admin/products/${v.id}/edit`}
                                                            className="inline-flex p-1.5 rounded-lg text-[#1A1A1B]/30 hover:text-[#735697] hover:bg-[#735697]/8 transition-all"
                                                            title={`Edit ${v.size ?? "variant"}`}>
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div>
                                <div className={row}>
                                    <span className={label}>Product Code / SKU</span>
                                    <span className={`${value} font-mono`}>{product.productCode || "—"}</span>
                                </div>
                                <div className={row}>
                                    <span className={label}>Size</span>
                                    {product.size ? (
                                        <span className="px-2.5 py-0.5 bg-[#735697]/10 text-[#735697] text-xs font-semibold rounded-lg">{product.size}</span>
                                    ) : (
                                        <span className="text-xs text-[#1A1A1B]/30">—</span>
                                    )}
                                </div>
                                <div className={row}>
                                    <span className={label}>Product Family (variant group)</span>
                                    <span className={`${value} font-mono text-[#735697]`}>{product.productFamily || "—"}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-xs font-semibold text-[#1A1A1B]/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5" /> Pricing
                        </h2>
                        <div>
                            <div className={row}>
                                <span className={label}>Sale Price</span>
                                <span className="text-lg font-bold text-[#1A1A1B]">
                                    {product.price} <span className="text-sm font-semibold text-[#1A1A1B]/50">{product.currency ?? "AED"}</span>
                                </span>
                            </div>
                            {hasOriginal && (
                                <div className={row}>
                                    <span className={label}>Original Price</span>
                                    <span className="text-sm text-[#1A1A1B]/40 line-through">{product.originalPrice} {product.currency ?? "AED"}</span>
                                </div>
                            )}
                            {hasDiscount && (
                                <div className={row}>
                                    <span className={label}>Discount</span>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-md">{product.discountPct}% OFF</span>
                                </div>
                            )}
                            {product.reviews !== undefined && (
                                <div className={row}>
                                    <span className={label}>Reviews</span>
                                    <span className={value}>★ {product.rating?.toFixed(1) ?? "—"} ({product.reviews} reviews)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                            <h2 className="text-xs font-semibold text-[#1A1A1B]/40 uppercase tracking-wider mb-3">Description</h2>
                            <p className="text-sm text-[#1A1A1B]/70 leading-relaxed">{product.description}</p>
                        </div>
                    )}

                    {/* Benefits */}
                    {product.benefits && product.benefits.length > 0 && (
                        <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                            <h2 className="text-xs font-semibold text-[#1A1A1B]/40 uppercase tracking-wider mb-3">Key Benefits</h2>
                            <ul className="space-y-1.5">
                                {product.benefits.map((b, i) => (
                                    <li key={i} className="text-sm text-[#1A1A1B]/70 flex gap-2">
                                        <span className="text-[#735697] font-bold mt-0.5">•</span> {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Edit CTA */}
                    <Link
                        href={`/admin/products/${id}/edit`}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#735697] text-white font-semibold text-sm hover:bg-[#5e4580] transition-all shadow-sm"
                    >
                        <Pencil className="w-4 h-4" /> Edit This Product
                    </Link>
                </div>
            </div>
        </div>
    );
}
