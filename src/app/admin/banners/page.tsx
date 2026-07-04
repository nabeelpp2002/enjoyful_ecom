"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, ImageIcon, Save, X, Pencil } from "lucide-react";
import { AdminCardSkeleton } from "@/components/ui/AdminSkeleton";
import Image from "next/image";
import { ImageEditor } from "@/components/admin/ImageEditor";

const CATEGORIES = ["Glow", "Baby", "Daily", "Fragrances", "Home Care"];
type BannerField = "desktopImageUrl" | "mobileImageUrl";
const FIELD_ASPECT: Record<BannerField, number> = {
    desktopImageUrl: 16 / 9,
    mobileImageUrl: 4 / 3,
};

interface Banner {
    id: string;
    category: string;
    desktopImageUrl: string;
    mobileImageUrl: string;
}

export default function AdminBannersPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, { desktopImageUrl: string; mobileImageUrl: string }>>({});
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [editing, setEditing] = useState<{ file: File; cat: string; field: BannerField } | null>(null);
    // Which category is currently being edited (null = all in read-only "view" mode)
    const [editCat, setEditCat] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/banners");
            if (res.ok) {
                const data: Banner[] = await res.json();
                const d: typeof drafts = {};
                data.forEach(b => {
                    d[b.category] = {
                        desktopImageUrl: b.desktopImageUrl || "",
                        mobileImageUrl: b.mobileImageUrl || "",
                    };
                });
                CATEGORIES.forEach(cat => {
                    if (!d[cat]) d[cat] = { desktopImageUrl: "", mobileImageUrl: "" };
                });
                setDrafts(d);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleFile = (file: File, cat: string, field: BannerField) => {
        setEditing({ file, cat, field });
    };
    const handleEditorUploaded = (url: string) => {
        if (!editing) return;
        setDrafts(prev => ({ ...prev, [editing.cat]: { ...prev[editing.cat], [editing.field]: url } }));
        setEditing(null);
    };
    const handleEditorCancel = () => setEditing(null);

    const saveBanner = async (cat: string) => {
        setSaving(cat);
        await fetch("/api/admin/banners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: cat, ...drafts[cat] }),
        });
        setSaving(null);
        setEditCat(null); // back to view mode after saving
    };

    // Read-only preview of the saved banner (shown when not editing)
    const BannerView = ({ cat, field, label }: { cat: string; field: BannerField; label: string }) => {
        const imgUrl = drafts[cat]?.[field];
        const previewAspect = field === "mobileImageUrl" ? "aspect-[4/3]" : "aspect-video";
        return (
            <div>
                <label className="block text-xs text-[#1A1A1B]/40 font-medium mb-1.5">{label}</label>
                {imgUrl ? (
                    <div className={`relative ${previewAspect} rounded-xl overflow-hidden bg-[#F9F5F0] border border-black/5`}>
                        <Image src={imgUrl} alt={`${cat} ${label}`} fill className="object-cover" unoptimized={imgUrl.startsWith("http")} />
                    </div>
                ) : (
                    <div className={`w-full ${previewAspect} rounded-xl border border-dashed border-black/10 flex flex-col items-center justify-center gap-1.5 text-[#1A1A1B]/25`}>
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-xs">No {label.toLowerCase()} set</span>
                    </div>
                )}
            </div>
        );
    };

    const UploadZone = ({ cat, field, label }: { cat: string; field: BannerField; label: string }) => {
        const key = `${cat}-${field}`;
        const imgUrl = drafts[cat]?.[field];
        const previewAspect = field === "mobileImageUrl" ? "aspect-[4/3]" : "aspect-video";
        return (
            <div>
                <label className="block text-xs text-[#1A1A1B]/40 font-medium mb-1.5">{label}</label>
                {imgUrl ? (
                    <div className={`relative ${previewAspect} rounded-xl overflow-hidden bg-[#F9F5F0] group border border-black/5`}>
                        <Image src={imgUrl} alt="" fill className="object-cover" unoptimized={imgUrl.startsWith("http")} />
                        <button
                            type="button"
                            onClick={() => setDrafts(p => ({ ...p, [cat]: { ...p[cat], [field]: "" } }))}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => fileRefs.current[key]?.click()}
                            className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-all"
                        >
                            <Upload className="w-3 h-3" /> Replace
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileRefs.current[key]?.click()}
                        className={`w-full ${previewAspect} rounded-xl border-2 border-dashed border-black/10 hover:border-[#735697]/30 flex flex-col items-center justify-center gap-2 text-[#1A1A1B]/25 hover:text-[#735697] transition-all`}
                    >
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-medium">Upload {label}</span>
                    </button>
                )}
                <input
                    ref={el => { fileRefs.current[key] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f, cat, field);
                        e.target.value = "";
                    }}
                />
            </div>
        );
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">Category Banners</h1>
                <p className="text-[#1A1A1B]/40 text-xs mt-0.5">Desktop and mobile banners per category</p>
            </div>

            {loading ? (
                <div className="space-y-5">
                    {CATEGORIES.map(c => <AdminCardSkeleton key={c} />)}
                </div>
            ) : (
                <div className="space-y-5">
                    {CATEGORIES.map((cat, i) => (
                        <motion.div key={cat}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[#1A1A1B] font-semibold flex items-center gap-2 text-sm">
                                    <ImageIcon className="w-4 h-4 text-[#735697]" />
                                    {cat} Category
                                </h2>
                                {editCat === cat ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setEditCat(null); load(); }}
                                            disabled={saving === cat}
                                            className="px-3.5 py-2 rounded-xl bg-white border border-black/10 text-[#1A1A1B]/60 text-xs font-semibold hover:border-black/25 transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => saveBanner(cat)}
                                            disabled={saving === cat}
                                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-[0_2px_8px_rgba(115,86,151,0.15)]"
                                        >
                                            {saving === cat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            Save
                                        </motion.button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setEditCat(cat)}
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-black/10 text-[#1A1A1B] text-xs font-semibold hover:border-[#735697]/40 hover:text-[#735697] transition-all"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {editCat === cat ? (
                                    <>
                                        <UploadZone cat={cat} field="desktopImageUrl" label="Desktop Banner" />
                                        <UploadZone cat={cat} field="mobileImageUrl" label="Mobile Banner" />
                                    </>
                                ) : (
                                    <>
                                        <BannerView cat={cat} field="desktopImageUrl" label="Desktop Banner" />
                                        <BannerView cat={cat} field="mobileImageUrl" label="Mobile Banner" />
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <ImageEditor
                file={editing?.file ?? null}
                aspect={editing ? FIELD_ASPECT[editing.field] : undefined}
                title={
                    editing?.field === "mobileImageUrl"
                        ? `Crop mobile banner (4:3) · ${editing?.cat ?? ""}`
                        : `Crop desktop banner (16:9) · ${editing?.cat ?? ""}`
                }
                onCancel={handleEditorCancel}
                onUploaded={handleEditorUploaded}
            />
        </div>
    );
}
