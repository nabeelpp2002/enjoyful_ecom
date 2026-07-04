"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft, Pencil, Eye, EyeOff, Package,
    Tag, Layers, BarChart2, ExternalLink, Plus, Trash2, Loader2,
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
    rating?: number;
    reviews?: number;
    isFeatured?: boolean;
    onSale?: boolean;
    bestDeal?: boolean;
    isHidden?: boolean;
    benefits?: string[];
    images?: Array<{ url: string } | string>;
    image?: string;
}

function catName(cat: unknown): string {
    if (!cat) return "—";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object" && cat !== null && "name" in cat) return String((cat as { name: string }).name);
    return "—";
}
function imgUrl(img: { url: string } | string | undefined): string {
    if (!img) return "";
    return typeof img === "string" ? img : img.url;
}
function stripSizes(name: string, sizes: (string | undefined)[]): string {
    let n = name;
    sizes.forEach(s => {
        if (s) n = n.replace(new RegExp(`\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").trim();
    });
    return n;
}

const row = "flex items-center justify-between py-2.5 border-b border-black/4 last:border-0";
const label = "text-xs text-[#1A1A1B]/40 font-medium";
const value = "text-sm text-[#1A1A1B] font-semibold text-right";

export default function ProductGroupPage() {
    const { family } = useParams<{ family: string }>();
    const router = useRouter();
    const [variants, setVariants] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(0);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fam = decodeURIComponent(family);
        const pick = (list: Product[]) =>
            (Array.isArray(list) ? list : [])
                .filter(p => (p.productFamily ?? "").trim() === fam)
                .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

        // Instant render from the list cache the products page already populated…
        try {
            const cached = sessionStorage.getItem("enjoyful-admin-products-cache");
            if (cached) { setVariants(pick(JSON.parse(cached))); setLoading(false); }
        } catch {}

        // …then refresh in the background.
        fetch(`/api/admin/products`)
            .then(r => r.ok ? r.json() : [])
            .then((list: Product[]) => setVariants(pick(list)))
            .finally(() => setLoading(false));
    }, [family]);

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

    if (variants.length === 0) {
        return (
            <div className="text-center py-20">
                <Package className="w-10 h-10 text-[#1A1A1B]/10 mx-auto mb-3" />
                <p className="text-[#1A1A1B]/30 text-sm">No products in this family</p>
                <Link href="/admin/products" className="mt-4 inline-block text-[#735697] text-sm hover:underline">← Back to Products</Link>
            </div>
        );
    }

    // Representative = first visible variant (or first). Shared info comes from it.
    const rep = variants.find(v => !v.isHidden) ?? variants[0];
    const sizes = variants.map(v => v.size);
    const familyName = stripSizes(displayName(rep.name, rep.brand ?? "Enjoyful Life"), sizes);
    // Gallery shows every image across all sizes in the family (deduped) — the
    // representative's images first, then any extra photos from the other sizes.
    const images: string[] = [];
    const pushImg = (u: string) => { if (u && !images.includes(u)) images.push(u); };
    if (rep.image) pushImg(rep.image);
    (rep.images ?? []).map(imgUrl).forEach(pushImg);
    variants.forEach(v => {
        if (v.id === rep.id) return; // rep already added first
        if (v.image) pushImg(v.image);
        (v.images ?? []).map(imgUrl).forEach(pushImg);
    });
    const mainImg = images[selectedImg] || images[0] || null;

    const prices = variants.map(v => v.price ?? 0);
    const priceLabel = Math.min(...prices) === Math.max(...prices)
        ? `${Math.min(...prices)} AED`
        : `${Math.min(...prices)}–${Math.max(...prices)} AED`;
    const allHidden = variants.every(v => v.isHidden);

    // "Add Size" → open the new-product form pre-filled with this family's shared info.
    const handleAddSize = () => {
        const prefill = {
            name: familyName,                       // base name; admin appends the new size
            brand: rep.brand,
            category: catName(rep.category),
            subcategory: rep.subcategory,
            productType: rep.productType,
            description: rep.description,
            productFamily: rep.productFamily,
            benefits: rep.benefits,
        };
        try { sessionStorage.setItem("enjoyful-admin-new-prefill", JSON.stringify(prefill)); } catch {}
        router.push("/admin/products/new?prefill=1");
    };

    // Delete the whole family — every size in one action.
    const handleDeleteGroup = async () => {
        const ids = variants.map(v => v.id);
        if (!confirm(`Delete the entire "${familyName}" group — all ${ids.length} size${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
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

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/admin/products")}
                        className="text-[#1A1A1B]/30 hover:text-[#735697] transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">{familyName}</h1>
                        <p className="text-[#1A1A1B]/40 text-xs mt-0.5">
                            <span className="font-mono text-[#735697]">{rep.productFamily}</span>
                            {" · "}{catName(rep.category)}{rep.subcategory ? ` · ${rep.subcategory}` : ""}
                            {" · "}{variants.length} size{variants.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAddSize}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/8 hover:border-[#735697]/40 text-[#1A1A1B] text-xs font-semibold transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Size
                    </button>
                    <Link
                        href={`/admin/products/${rep.id}/edit`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#735697] text-white text-xs font-semibold hover:bg-[#5e4580] transition-all shadow-sm"
                    >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                    {rep.slug && (
                        <a href={`/product/${rep.slug}`} target="_blank" rel="noopener noreferrer"
                            title="View on storefront"
                            className="p-2 rounded-xl text-[#1A1A1B]/30 hover:text-emerald-600 hover:bg-emerald-50 border border-black/8 transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                    <button
                        onClick={handleDeleteGroup}
                        disabled={deleting}
                        title={`Delete all ${variants.length} size${variants.length > 1 ? "s" : ""}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border bg-white border-black/8 text-[#1A1A1B]/60 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Delete Group
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: images */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
                        {mainImg ? (
                            <div className="relative aspect-square">
                                <Image src={mainImg} alt={familyName} fill className="object-cover" />
                                {allHidden && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg">All sizes hidden</span>
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

                {/* Right: info */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Shared basic info */}
                    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-xs font-semibold text-[#1A1A1B]/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Shared Details
                            <span className="ml-auto normal-case font-normal text-[10px] text-[#1A1A1B]/30">applies to all sizes</span>
                        </h2>
                        <div>
                            <div className={row}><span className={label}>Product</span><span className={value}>{familyName}</span></div>
                            <div className={row}><span className={label}>Brand</span><span className={value}>{rep.brand ?? "—"}</span></div>
                            <div className={row}><span className={label}>Category</span><span className={value}>{catName(rep.category)}</span></div>
                            {rep.subcategory && <div className={row}><span className={label}>Subcategory</span><span className={value}>{rep.subcategory}</span></div>}
                            {rep.productType && <div className={row}><span className={label}>Product Type</span><span className={value}>{rep.productType}</span></div>}
                        </div>
                        {rep.description && <p className="text-sm text-[#1A1A1B]/60 leading-relaxed mt-3 pt-3 border-t border-black/4">{rep.description}</p>}
                    </div>

                    {/* Variants table */}
                    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-semibold text-[#1A1A1B]/40 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" /> Sizes &amp; Variants
                            </h2>
                            <button onClick={handleAddSize}
                                className="flex items-center gap-1 text-[11px] font-semibold text-[#735697] hover:text-[#5e4580]">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>
                        <div className="overflow-x-auto -mx-1">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-black/5 text-left">
                                        <th className="py-2 px-1 text-[10px] font-medium text-[#1A1A1B]/40 uppercase">Size</th>
                                        <th className="py-2 px-1 text-[10px] font-medium text-[#1A1A1B]/40 uppercase">SKU</th>
                                        <th className="py-2 px-1 text-[10px] font-medium text-[#1A1A1B]/40 uppercase text-right">Price</th>
                                        <th className="py-2 px-1 text-[10px] font-medium text-[#1A1A1B]/40 uppercase text-center">Status</th>
                                        <th className="py-2 px-1"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/4">
                                    {variants.map(v => (
                                        <tr key={v.id} className="hover:bg-[#F9F5F0]/40 transition-colors">
                                            <td className="py-2.5 px-1">
                                                <span className="px-2 py-0.5 bg-[#735697]/10 text-[#735697] text-xs font-semibold rounded-lg">{v.size || "—"}</span>
                                            </td>
                                            <td className="py-2.5 px-1 font-mono text-xs text-[#1A1A1B]/60">{v.productCode || "—"}</td>
                                            <td className="py-2.5 px-1 text-right">
                                                <span className="font-semibold text-[#1A1A1B]">{v.price} AED</span>
                                                {v.originalPrice && v.originalPrice > v.price ? (
                                                    <span className="ml-1.5 text-[10px] text-[#1A1A1B]/30 line-through">{v.originalPrice}</span>
                                                ) : null}
                                                {v.discountPct ? (
                                                    <span className="ml-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">-{v.discountPct}%</span>
                                                ) : null}
                                            </td>
                                            <td className="py-2.5 px-1 text-center">
                                                {v.isHidden
                                                    ? <span className="inline-flex items-center gap-1 text-[10px] text-[#1A1A1B]/40"><EyeOff className="w-3 h-3" />Hidden</span>
                                                    : <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600"><Eye className="w-3 h-3" />Visible</span>}
                                            </td>
                                            <td className="py-2.5 px-1 text-right">
                                                <Link href={`/admin/products/${v.id}/edit`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#735697]/8 text-[#735697] text-xs font-semibold hover:bg-[#735697] hover:text-white transition-all"
                                                    title={`Edit ${v.size ?? "variant"}`}>
                                                    <Pencil className="w-3 h-3" /> Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Family-level summary */}
                    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-xs font-semibold text-[#1A1A1B]/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5" /> Summary
                        </h2>
                        <div>
                            <div className={row}><span className={label}>Price Range</span><span className={value}>{priceLabel}</span></div>
                            <div className={row}><span className={label}>Total Variants</span><span className={value}>{variants.length}</span></div>
                            <div className={row}>
                                <span className={label}>Badges</span>
                                <div className="flex gap-1.5">
                                    {rep.isFeatured && <span className="px-2 py-0.5 bg-[#1A1A1B] text-white text-[10px] font-bold rounded-md">FEATURED</span>}
                                    {rep.onSale && <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md">SALE</span>}
                                    {rep.bestDeal && <span className="px-2 py-0.5 bg-[#735697] text-white text-[10px] font-bold rounded-md">BEST DEAL</span>}
                                    {!rep.isFeatured && !rep.onSale && !rep.bestDeal && <span className="text-xs text-[#1A1A1B]/30">None</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
