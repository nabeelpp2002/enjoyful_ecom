"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, X, Plus, Loader2, ArrowLeft, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ImageEditor } from "@/components/admin/ImageEditor";

type BuyProvider = "amazon" | "talabat" | "carrefour";
type ExternalBuyLink = { url: string; visible: boolean };
type ExternalBuyLinks = Record<BuyProvider, ExternalBuyLink>;

const PROVIDER_META: Record<BuyProvider, { label: string; placeholder: string; color: string; icon: string }> = {
    amazon: { label: "Amazon", placeholder: "https://www.amazon.ae/dp/...", color: "#FF9900", icon: "🛒" },
    talabat: { label: "Talabat", placeholder: "https://www.talabat.com/ae/...", color: "#FF5A00", icon: "🍔" },
    carrefour: { label: "Carrefour", placeholder: "https://www.carrefouruae.com/...", color: "#0E5AA7", icon: "🏬" },
};

const EMPTY_EXTERNAL: ExternalBuyLinks = {
    amazon: { url: "", visible: true },
    talabat: { url: "", visible: true },
    carrefour: { url: "", visible: true },
};

interface ProductFormData {
    name: string;
    slug: string;
    category: string;
    subcategory: string;
    productType: string;
    tagline: string;
    brand: string;
    size: string;
    productCode: string;
    skuCode: string;
    variant: string;
    unitType: string;
    mockupStatus: string;
    productFamily: string;
    price: number;
    originalPrice: number;
    discountPct: number;
    description: string;
    howToUse: string;
    rating: number;
    reviews: number;
    images: string[];
    externalBuyLinks: ExternalBuyLinks;
}

interface ProductFormProps {
    initialData?: Record<string, unknown>;
    isEdit?: boolean;
}

const CATEGORIES = ["Glow", "Baby", "Daily", "Fragrances", "Home Care"];

const SUBCATEGORY_MAP: Record<string, string[]> = {
    Glow: ["Face Wash", "Face Scrub", "Face Mask", "Sunscreen", "Aloe Vera Gel", "Toner", "Body Scrub"],
    Baby: ["Baby Lotion", "Baby Wash", "Baby Talc", "Baby Rash Cream", "Baby Soap"],
    Daily: ["Body Lotion", "Body Cream", "Shower Gel", "Shampoo", "Hair Oil", "Hair Serum", "Intimate Wash", "Hair Removal"],
    Fragrances: ["Perfume", "Body Mist", "Roll On", "Deo Stick"],
    "Home Care": ["Kitchen Care", "Bathroom Care", "Floor & Surface Care", "Hand Care", "Laundry Care"],
};

const inputCls = "w-full px-4 py-2.5 bg-[#F9F5F0] border border-black/8 rounded-xl text-[#1A1A1B] placeholder:text-[#1A1A1B]/25 focus:outline-none focus:border-[#735697]/40 focus:bg-white transition-all text-sm";
const labelCls = "block text-xs font-medium text-[#1A1A1B]/50 mb-1.5";
const cardCls = "bg-white border border-black/5 rounded-2xl p-6 shadow-sm";

interface ListFieldProps {
    label: string;
    items: string[];
    onChange: (idx: number, val: string) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    placeholder: string;
}

function ListField({ label, items, onChange, onAdd, onRemove, placeholder }: ListFieldProps) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            value={item}
                            onChange={e => onChange(i, e.target.value)}
                            placeholder={placeholder}
                            className={inputCls}
                        />
                        <button type="button" onClick={() => onRemove(i)}
                            className="p-2 rounded-lg text-[#1A1A1B]/25 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={onAdd}
                    className="flex items-center gap-1.5 text-xs text-[#735697] hover:text-[#5e4580] transition-colors font-medium">
                    <Plus className="w-3 h-3" /> Add {label}
                </button>
            </div>
        </div>
    );
}

function extractCategoryName(cat: unknown): string {
    if (!cat) return 'Glow';
    if (typeof cat === 'string') return cat;
    if (typeof cat === 'object' && 'name' in (cat as Record<string, unknown>)) {
        return String((cat as Record<string, unknown>).name) || 'Glow';
    }
    return 'Glow';
}

type FamilyVariant = { id: string; size?: string; productFamily?: string };

export function ProductForm({ initialData, isEdit }: ProductFormProps) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    // Files queued for editing; we step through them one at a time so the editor
    // opens for the next file as soon as the previous one is uploaded/cancelled.
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    // Sibling size variants — lets the edit screen switch between sizes / return to the group.
    const currentId = initialData?.id as string | undefined;
    const family = (initialData?.productFamily as string | undefined)?.trim();
    const [siblings, setSiblings] = useState<FamilyVariant[]>([]);
    useEffect(() => {
        if (!isEdit || !family) return;
        const pick = (list: FamilyVariant[]) =>
            (Array.isArray(list) ? list : []).filter(v => v.productFamily?.trim() === family);
        // Use the products-list cache first for an instant switcher, then refresh.
        try {
            const cached = sessionStorage.getItem("enjoyful-admin-products-cache");
            if (cached) setSiblings(pick(JSON.parse(cached)));
        } catch {}
        fetch(`/api/admin/products`)
            .then(r => (r.ok ? r.json() : []))
            .then((list: FamilyVariant[]) => setSiblings(pick(list)))
            .catch(() => {});
    }, [isEdit, family]);

    const getInitialImages = (): string[] => {
        const imgs = initialData?.images as Array<{ url: string } | string> | undefined;
        if (imgs?.length) return imgs.map(img => (typeof img === 'string' ? img : img.url));
        if (initialData?.image) return [initialData.image as string];
        return [];
    };

    const getInitialExternalLinks = (): ExternalBuyLinks => {
        const src = initialData?.externalBuyLinks as Partial<ExternalBuyLinks> | undefined;
        const safe = (l: Partial<ExternalBuyLink> | undefined): ExternalBuyLink => ({
            url: l?.url ?? "",
            visible: l?.visible ?? true,
        });
        return {
            amazon: safe(src?.amazon),
            talabat: safe(src?.talabat),
            carrefour: safe(src?.carrefour),
        };
    };

    const [form, setForm] = useState<ProductFormData>({
        name: (initialData?.name as string) || "",
        slug: (initialData?.slug as string) || "",
        category: extractCategoryName(initialData?.category) || "Glow",
        subcategory: (initialData?.subcategory as string) || "",
        productType: (initialData?.productType as string) || "",
        tagline: (initialData?.tagline as string) || "",
        brand: (initialData?.brand as string) || "enJoyful Life",
        size: (initialData?.size as string) || "",
        productCode: (initialData?.productCode as string) || "",
        skuCode: (initialData?.skuCode as string) || "",
        variant: (initialData?.variant as string) || "",
        unitType: (initialData?.unitType as string) || "",
        mockupStatus: (initialData?.mockupStatus as string) || "",
        productFamily: (initialData?.productFamily as string) || "",
        price: (initialData?.price as number) || 0,
        originalPrice: (initialData?.originalPrice as number) || 0,
        discountPct: (initialData?.discountPct as number) || 0,
        description: (initialData?.description as string) || "",
        howToUse: (initialData?.howToUse as string) || "",
        rating: (initialData?.rating as number) || 4.5,
        reviews: (initialData?.reviews as number) || 0,
        images: getInitialImages(),
        externalBuyLinks: getInitialExternalLinks(),
    });

    // ESLint flags this in inline JSX, so silence the import
    void EMPTY_EXTERNAL;

    const [benefits, setBenefits] = useState<string[]>(
        (initialData?.benefits as string[] | undefined)?.length ? (initialData?.benefits as string[]) : [""]
    );
    const [ingredients, setIngredients] = useState<string[]>(
        (initialData?.ingredients as string[] | undefined)?.length ? (initialData?.ingredients as string[]) : [""]
    );
    const [highlights, setHighlights] = useState<string[]>(
        (initialData?.highlights as string[] | undefined)?.length ? (initialData?.highlights as string[]) : [""]
    );
    const [suitableFor, setSuitableFor] = useState<string[]>(
        (initialData?.suitableFor as string[] | undefined)?.length ? (initialData?.suitableFor as string[]) : [""]
    );

    const updateForm = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
        if (key === "name") {
            setForm(prev => ({
                ...prev,
                name: value as string,
                slug: (value as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            }));
        } else {
            setForm(prev => ({ ...prev, [key]: value }));
        }
    }, []);

    const changeList = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>) =>
        (idx: number, val: string) =>
            setter(prev => { const n = [...prev]; n[idx] = val; return n; }),
        []
    );
    const addList = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>) =>
        () => setter(prev => [...prev, ""]),
        []
    );
    const removeList = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>) =>
        (idx: number) => setter(prev => prev.filter((_, i) => i !== idx)),
        []
    );

    const queueFiles = (files: FileList) => {
        setPendingFiles(prev => [...prev, ...Array.from(files)]);
    };

    const handleEditorUploaded = (url: string) => {
        setForm(prev => ({ ...prev, images: [...prev.images, url] }));
        setPendingFiles(prev => prev.slice(1));
    };

    const handleEditorCancel = () => {
        setPendingFiles(prev => prev.slice(1));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);

        const payload = {
            ...form,
            price: Number(form.price),
            originalPrice: Number(form.originalPrice),
            rating: Number(form.rating),
            reviews: Number(form.reviews),
            benefits: benefits.filter(Boolean),
            ingredients: ingredients.filter(Boolean),
            highlights: highlights.filter(Boolean),
            suitableFor: suitableFor.filter(Boolean),
        };

        const id = initialData?.id as string | undefined;
        const url = isEdit && id ? `/api/admin/products/${id}` : "/api/admin/products";
        const method = isEdit && id ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                router.push("/admin/products");
            } else {
                const err = await res.json().catch(() => ({}));
                setSaveError(err?.error?.message ?? err?.message ?? "Save failed. Please try again.");
            }
        } catch {
            setSaveError("Network error. Check that the API server is running.");
        } finally {
            setSaving(false);
        }
    };

    const subcats = SUBCATEGORY_MAP[form.category] || [];

    return (
        <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
                    e.preventDefault();
                }
            }}
            className="pb-16"
        >
            <div className="flex items-center gap-3 mb-4">
                <Link
                    href={isEdit && family ? `/admin/products/group/${encodeURIComponent(family)}` : "/admin/products"}
                    className="text-[#1A1A1B]/30 hover:text-[#735697]"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">
                        {isEdit ? "Edit Product" : "New Product"}
                    </h1>
                    <p className="text-[#1A1A1B]/40 text-xs mt-0.5">
                        {isEdit ? `Editing: ${form.name}` : "Fill in the product details below"}
                    </p>
                </div>
            </div>

            {/* Variant switcher — appears when this product belongs to a size family */}
            {isEdit && family && siblings.length > 1 && (
                <div className="mb-6 bg-[#735697]/5 border border-[#735697]/15 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-[#735697] uppercase tracking-wider">
                            Editing one size of &ldquo;{family}&rdquo; family
                        </span>
                        <Link
                            href={`/admin/products/group/${encodeURIComponent(family)}`}
                            className="text-xs font-semibold text-[#735697] hover:underline"
                        >
                            View group →
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {siblings.map(v => {
                            const isCurrent = v.id === currentId;
                            return (
                                <Link
                                    key={v.id}
                                    href={`/admin/products/${v.id}/edit`}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                        isCurrent
                                            ? "bg-[#735697] text-white border-transparent"
                                            : "bg-white text-[#1A1A1B]/60 border-black/10 hover:border-[#735697]/40 hover:text-[#735697]"
                                    }`}
                                >
                                    {v.size || "—"}{isCurrent && " ·  editing"}
                                </Link>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-[#1A1A1B]/40 mt-2">
                        Each size is saved separately. Use the same Product Family slug to keep them grouped.
                    </p>
                </div>
            )}

            <div className="space-y-5">
                {/* Images */}
                <div className={cardCls}>
                    <h2 className="text-sm font-semibold text-[#1A1A1B] mb-4 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#735697]" /> Product Images
                    </h2>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        {form.images.map((url, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F9F5F0] group border border-black/5">
                                <Image src={url} alt="" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }))}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                {i === 0 ? (
                                    <span className="absolute bottom-1 left-1 text-xs bg-[#735697] text-white px-1.5 py-0.5 rounded-md">Main</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => { const imgs = [...prev.images]; const [moved] = imgs.splice(i, 1); return { ...prev, images: [moved, ...imgs] }; })}
                                        className="absolute bottom-1 left-1 text-[10px] font-semibold bg-white/90 text-[#735697] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Set main
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={pendingFiles.length > 0}
                            className="aspect-square rounded-xl border-2 border-dashed border-black/10 hover:border-[#735697]/30 flex flex-col items-center justify-center gap-1 text-[#1A1A1B]/25 hover:text-[#735697] transition-all"
                        >
                            <Upload className="w-5 h-5" />
                            <span className="text-xs">Upload</span>
                            {pendingFiles.length > 1 && (
                                <span className="text-[10px] text-[#735697]">{pendingFiles.length - 1} queued</span>
                            )}
                        </button>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => {
                            if (e.target.files) queueFiles(e.target.files);
                            e.target.value = "";
                        }} />
                    <p className="text-[#1A1A1B]/25 text-xs">First image is the main product image · Crop & rotate before upload</p>
                </div>

                {/* Basic Info */}
                <div className={cardCls}>
                    <h2 className="text-sm font-semibold text-[#1A1A1B] mb-4">Basic Info</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className={labelCls}>Product Name *</label>
                            <input required value={form.name} onChange={e => updateForm("name", e.target.value)}
                                placeholder="e.g. Aloe Bliss Shower Gel" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Tagline</label>
                            <input value={form.tagline} onChange={e => updateForm("tagline", e.target.value)}
                                placeholder="Short catchy line" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Brand</label>
                            <input value={form.brand} onChange={e => updateForm("brand", e.target.value)}
                                placeholder="enJoyful Life" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Category *</label>
                            <select required value={form.category}
                                onChange={e => { updateForm("category", e.target.value); updateForm("subcategory", ""); }}
                                className={`${inputCls} appearance-none`}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Subcategory</label>
                            <select value={form.subcategory} onChange={e => updateForm("subcategory", e.target.value)}
                                className={`${inputCls} appearance-none`}>
                                <option value="">— Select subcategory —</option>
                                {subcats.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Product Type</label>
                            <input value={form.productType} onChange={e => updateForm("productType", e.target.value)}
                                placeholder="e.g. Serum, Candle..." className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Size</label>
                            <input value={form.size} onChange={e => updateForm("size", e.target.value)}
                                placeholder="e.g. 200ml, 500gm, 1 Litre" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Product Code</label>
                            <input value={form.productCode} onChange={e => updateForm("productCode", e.target.value)}
                                placeholder="e.g. JO-200" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>SKU Code</label>
                            <input value={form.skuCode} onChange={e => updateForm("skuCode", e.target.value)}
                                placeholder="e.g. HE-KC-DW-001" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Variant</label>
                            <input value={form.variant} onChange={e => updateForm("variant", e.target.value)}
                                placeholder="e.g. Lemon, Lavender" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Unit Type</label>
                            <input value={form.unitType} onChange={e => updateForm("unitType", e.target.value)}
                                placeholder="e.g. L, ML, G, KG" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Mockup Status</label>
                            <select value={form.mockupStatus} onChange={e => updateForm("mockupStatus", e.target.value)}
                                className={`${inputCls} appearance-none`}>
                                <option value="">— Select status —</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Product Family (for size variants)</label>
                            <input value={form.productFamily} onChange={e => updateForm("productFamily", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                                placeholder="e.g. jasmin-oil  (same for all sizes of same product)" className={inputCls} />
                            <p className="text-[10px] text-[#1A1A1B]/30 mt-1">Use the same slug for all size variants of this product so they group together in the store and admin.</p>
                        </div>
                        <div>
                            <label className={labelCls}>Rating (0–5)</label>
                            <input type="number" step="0.1" min="0" max="5" value={form.rating}
                                onChange={e => updateForm("rating", +e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description} onChange={e => updateForm("description", e.target.value)}
                            rows={3} placeholder="Product description..." className={`${inputCls} resize-none`} />
                    </div>
                    <div className="mt-4">
                        <label className={labelCls}>How to Use</label>
                        <textarea value={form.howToUse} onChange={e => updateForm("howToUse", e.target.value)}
                            rows={3} placeholder="Step-by-step usage instructions..." className={`${inputCls} resize-none`} />
                    </div>
                </div>

                {/* Pricing */}
                <div className={cardCls}>
                    <h2 className="text-sm font-semibold text-[#1A1A1B] mb-4">Pricing</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Price (AED) *</label>
                            <input required type="number" min="0" step="0.01" value={form.price}
                                onChange={e => updateForm("price", +e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Original / Compare-at Price (AED)</label>
                            <input type="number" min="0" step="0.01" value={form.originalPrice}
                                onChange={e => updateForm("originalPrice", +e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Discount %</label>
                            <input type="number" min="0" max="100" step="1" value={form.discountPct}
                                onChange={e => updateForm("discountPct", +e.target.value)}
                                placeholder="0" className={inputCls} />
                            <p className="text-[10px] text-[#1A1A1B]/30 mt-1">Leave 0 to auto-calculate from prices</p>
                        </div>
                    </div>
                </div>

                {/* Benefits & Ingredients */}
                <div className={cardCls}>
                    <h2 className="text-sm font-semibold text-[#1A1A1B] mb-4">Benefits &amp; Ingredients</h2>
                    <div className="space-y-5">
                        <ListField label="Benefits" items={benefits}
                            onChange={changeList(setBenefits)} onAdd={addList(setBenefits)} onRemove={removeList(setBenefits)}
                            placeholder="e.g. Hydrates and nourishes skin" />
                        <ListField label="Ingredients" items={ingredients}
                            onChange={changeList(setIngredients)} onAdd={addList(setIngredients)} onRemove={removeList(setIngredients)}
                            placeholder="e.g. Aloe Barbadensis Leaf Extract" />
                        <ListField label="Highlights" items={highlights}
                            onChange={changeList(setHighlights)} onAdd={addList(setHighlights)} onRemove={removeList(setHighlights)}
                            placeholder="e.g. Dermatologist tested" />
                    </div>
                </div>

                {/* Who Can Use */}
                <div className={cardCls}>
                    <h2 className="text-sm font-semibold text-[#1A1A1B] mb-4">Who Can Use</h2>
                    <ListField label="Suitable For" items={suitableFor}
                        onChange={changeList(setSuitableFor)} onAdd={addList(setSuitableFor)} onRemove={removeList(setSuitableFor)}
                        placeholder="e.g. All skin types, Sensitive skin, Babies..." />
                </div>

                {/* Buy elsewhere */}
                <div className={cardCls}>
                    <h2 className="text-sm font-semibold text-[#1A1A1B] mb-1">Buy elsewhere</h2>
                    <p className="text-[#1A1A1B]/45 text-xs mb-4">
                        Paste the product URL for each marketplace. A button appears on the storefront only if the URL is set AND the toggle is on.
                    </p>
                    <div className="space-y-3">
                        {(["amazon", "talabat", "carrefour"] as BuyProvider[]).map(provider => {
                            const meta = PROVIDER_META[provider];
                            const link = form.externalBuyLinks[provider];
                            const willShow = !!link.url.trim() && link.visible;
                            return (
                                <div key={provider} className="flex items-center gap-3 p-3 rounded-xl bg-[#F9F5F0] border border-black/5">
                                    <span
                                        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base font-semibold text-white"
                                        style={{ background: meta.color }}
                                    >
                                        {meta.icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <label className="text-xs font-semibold text-[#1A1A1B]">{meta.label}</label>
                                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                                <span className="text-[10px] font-medium text-[#1A1A1B]/45 uppercase tracking-wide">
                                                    {willShow ? "Showing" : link.url.trim() ? "Hidden" : "—"}
                                                </span>
                                                <span className="relative inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={link.visible}
                                                        onChange={e => setForm(prev => ({
                                                            ...prev,
                                                            externalBuyLinks: {
                                                                ...prev.externalBuyLinks,
                                                                [provider]: { ...prev.externalBuyLinks[provider], visible: e.target.checked },
                                                            },
                                                        }))}
                                                        className="sr-only peer"
                                                    />
                                                    <span className="w-9 h-5 bg-[#1A1A1B]/15 rounded-full peer-checked:bg-[#735697] transition-colors" />
                                                    <span className="absolute left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                                                </span>
                                            </label>
                                        </div>
                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={e => setForm(prev => ({
                                                ...prev,
                                                externalBuyLinks: {
                                                    ...prev.externalBuyLinks,
                                                    [provider]: { ...prev.externalBuyLinks[provider], url: e.target.value },
                                                },
                                            }))}
                                            placeholder={meta.placeholder}
                                            className="w-full px-3 py-2 bg-white border border-black/8 rounded-lg text-[#1A1A1B] text-sm placeholder:text-[#1A1A1B]/25 focus:outline-none focus:border-[#735697]/40 transition-all"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Save */}
                <div className="space-y-3">
                    {saveError && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                            <X className="w-4 h-4 flex-shrink-0" />
                            {saveError}
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <motion.button type="submit" disabled={saving}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            className="px-7 py-2.5 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2 shadow-[0_2px_10px_rgba(115,86,151,0.2)]">
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (isEdit ? "Save Changes" : "Create Product")}
                        </motion.button>
                        <Link href="/admin/products" className="text-sm text-[#1A1A1B]/40 hover:text-[#1A1A1B]">
                            Cancel
                        </Link>
                    </div>
                </div>
            </div>

            <ImageEditor
                file={pendingFiles[0] ?? null}
                aspect={1}
                title="Crop product image (1:1)"
                onCancel={handleEditorCancel}
                onUploaded={handleEditorUploaded}
            />
        </form>
    );
}

export function DeleteButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const handleDelete = async () => {
        if (!confirm("Delete this product?")) return;
        setLoading(true);
        await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
        router.push("/admin/products");
    };
    return (
        <button type="button" onClick={handleDelete} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 text-red-500 text-sm hover:bg-red-50 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
        </button>
    );
}
