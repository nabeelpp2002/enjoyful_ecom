"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, Upload, X, ImagePlay, Eye, EyeOff, Pencil, Monitor, Smartphone } from "lucide-react";
import { AdminSlidesSkeleton } from "@/components/ui/AdminSkeleton";
import Image from "next/image";
import { ImageEditor } from "@/components/admin/ImageEditor";
import { uploadImageFile } from "@/lib/image-upload";
import {
    formatHeroSpecLabel,
    getImageDimensions,
    shouldSkipHeroCrop,
    type HeroImageVariant,
} from "@/lib/hero-image-spec";

type SlideField = "desktopImageUrl" | "mobileImageUrl";
const FIELD_ASPECT: Record<SlideField, number> = {
    desktopImageUrl: 16 / 9,
    mobileImageUrl: 3 / 4,
};
const FIELD_VARIANT: Record<SlideField, HeroImageVariant> = {
    desktopImageUrl: "desktop",
    mobileImageUrl: "mobile",
};

interface Slide {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    textColor?: string;
    buttonStyle?: string;
    desktopImageUrl?: string;
    mobileImageUrl?: string;
    imageUrl?: string;
    order: number;
    isActive: boolean;
}

type SlideForm = {
    title: string;
    subtitle: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    textColor: string;
    buttonStyle: string;
    desktopImageUrl: string;
    mobileImageUrl: string;
};

const EMPTY_FORM: SlideForm = {
    title: "", subtitle: "", description: "",
    buttonText: "Shop Now", buttonLink: "/category/all",
    textColor: "#FFFFFF", buttonStyle: "solid",
    desktopImageUrl: "", mobileImageUrl: "",
};

const inputCls = "w-full px-4 py-2.5 bg-[#F9F5F0] border border-black/8 rounded-xl text-[#1A1A1B] text-sm placeholder:text-[#1A1A1B]/20 focus:outline-none focus:border-[#735697]/40 focus:bg-white transition-all";

const TEXT_FIELDS = [
    { key: "title", label: "Title *", placeholder: "Pure Joy", req: true },
    { key: "subtitle", label: "Subtitle", placeholder: "Gentle Care", req: false },
    { key: "description", label: "Description", placeholder: "Short description...", req: false },
    { key: "buttonText", label: "Button Label", placeholder: "Shop Now", req: false },
    { key: "buttonLink", label: "Button URL", placeholder: "/category/all", req: false },
] as const;

interface UploadDualImagesProps {
    form: SlideForm;
    setForm: React.Dispatch<React.SetStateAction<SlideForm>>;
    uploadingKey: string | null;
    setUploadingKey: (v: string | null) => void;
    /** True while a background upload is still in flight for any field */
    bgUploading: boolean;
    setBgUploading: (v: boolean) => void;
}

function UploadDualImages({ form, setForm, uploadingKey, setUploadingKey, bgUploading, setBgUploading }: UploadDualImagesProps) {
    const desktopRef = useRef<HTMLInputElement>(null);
    const mobileRef = useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState<{ file: File; field: SlideField } | null>(null);
    
    // Track which field has an in-flight background upload.
    // We MUST use a ref here because ImageEditor unmounts after onUploadStart, 
    // leaving a zombie closure that captures the old state (where bgField was null).
    const bgFieldRef = useRef<SlideField | null>(null);

    const handleFile = async (file: File, field: SlideField) => {
        const variant = FIELD_VARIANT[field];
        try {
            const { width, height } = await getImageDimensions(file);
            if (shouldSkipHeroCrop(variant, width, height)) {
                setUploadingKey(field);
                bgFieldRef.current = field;
                setBgUploading(true);
                const previewUrl = URL.createObjectURL(file);
                setForm(p => ({ ...p, [field]: previewUrl }));
                try {
                    const url = await uploadImageFile(file, file.name);
                    setForm(p => ({ ...p, [field]: url }));
                } catch (err) {
                    console.error("[carousel] direct upload failed:", err);
                    setForm(p => ({ ...p, [field]: "" }));
                } finally {
                    URL.revokeObjectURL(previewUrl);
                    bgFieldRef.current = null;
                    setBgUploading(false);
                    setUploadingKey(null);
                }
                return;
            }
        } catch (err) {
            console.warn("[carousel] could not read image dimensions, opening crop editor:", err);
        }
        setEditing({ file, field });
    };

    /** Called immediately when crop is confirmed — editor closes, local preview shown */
    const handleUploadStart = (previewUrl: string) => {
        if (!editing) return;
        const field = editing.field;
        setForm(p => ({ ...p, [field]: previewUrl })); // show local blob preview
        bgFieldRef.current = field;
        setBgUploading(true);
        setEditing(null); // close editor immediately
        setUploadingKey(null);
    };

    /** Called when background upload finishes with the real Cloudinary URL */
    const handleEditorUploaded = (url: string) => {
        // Replace whichever field was uploading with the final URL
        const activeField = bgFieldRef.current;
        if (activeField) {
            setForm(p => ({ ...p, [activeField]: url }));
        }
        bgFieldRef.current = null;
        setBgUploading(false);
        // If editor is still open (blocking mode), close it
        if (editing) {
            setEditing(null);
            setUploadingKey(null);
        }
    };

    const handleEditorCancel = () => {
        setEditing(null);
        setUploadingKey(null);
    };

    const renderZone = (
        field: SlideField,
        label: string,
        aspect: string,
        specLabel: string,
        icon: React.ReactNode,
        ref: React.RefObject<HTMLInputElement | null>,
    ) => {
        const url = form[field];
        const isUploading = uploadingKey === field;
        const isBgUploading = bgFieldRef.current === field;
        const isLocalBlob = url?.startsWith("blob:");
        return (
            <div>
                <label className="block text-xs text-[#1A1A1B]/40 font-medium mb-1.5">
                    <span className="flex items-center gap-1.5">
                        {icon} {label}
                    </span>
                    <span className="block mt-0.5 text-[10px] text-[#1A1A1B]/30 font-normal">
                        Recommended: {specLabel} — matching ratio uploads directly, no crop required
                    </span>
                </label>
                {url ? (
                    <div className={`relative ${aspect} rounded-xl overflow-hidden border border-black/5 group bg-[#F9F5F0]`}>
                        <Image src={url} alt={label} fill className="object-cover" unoptimized />
                        {/* Uploading overlay */}
                        {isBgUploading && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                <span className="text-white text-xs font-medium">Uploading…</span>
                            </div>
                        )}
                        {!isBgUploading && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, [field]: "" }))}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => ref.current?.click()}
                                    disabled={isUploading}
                                    className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-all"
                                >
                                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                    Replace
                                </button>
                            </>
                        )}
                        {isLocalBlob && !isBgUploading && (
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-[10px] font-semibold">
                                Preview
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => ref.current?.click()}
                        disabled={isUploading}
                        className={`w-full ${aspect} rounded-xl border-2 border-dashed border-black/10 hover:border-[#735697]/40 flex flex-col items-center justify-center gap-2 text-[#1A1A1B]/25 hover:text-[#735697] transition-all`}
                    >
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                        <span className="text-xs font-medium">Upload {label.toLowerCase()}</span>
                    </button>
                )}
                <input
                    ref={ref}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f, field);
                        e.target.value = "";
                    }}
                />
            </div>
        );
    };

    return (
        <div className="space-y-4 mb-4">
            {renderZone("desktopImageUrl", "Desktop Image *", "aspect-[16/9]", formatHeroSpecLabel("desktop"), <Monitor className="w-3 h-3" />, desktopRef)}
            {renderZone("mobileImageUrl", "Mobile Image *", "aspect-[3/4]", formatHeroSpecLabel("mobile"), <Smartphone className="w-3 h-3" />, mobileRef)}

            <ImageEditor
                file={editing?.file ?? null}
                aspect={editing ? FIELD_ASPECT[editing.field] : undefined}
                safeAreaGuide={editing ? FIELD_VARIANT[editing.field] : undefined}
                cropObjectFit="contain"
                restrictPosition
                title={editing?.field === "mobileImageUrl" ? "Adjust mobile slide (3:4)" : "Adjust desktop slide (16:9)"}
                onCancel={handleEditorCancel}
                onUploaded={handleEditorUploaded}
                onUploadStart={handleUploadStart}
            />
        </div>
    );
}

function TextFields({ form, setForm }: { form: SlideForm; setForm: React.Dispatch<React.SetStateAction<SlideForm>> }) {
    return (
        <div className="space-y-3">
            {TEXT_FIELDS.map(f => (
                <div key={f.key}>
                    <label className="block text-xs text-[#1A1A1B]/40 mb-1">{f.label}</label>
                    <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} required={f.req} className={inputCls} />
                </div>
            ))}
        </div>
    );
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function StyleFields({ form, setForm }: { form: SlideForm; setForm: React.Dispatch<React.SetStateAction<SlideForm>> }) {
    const validColor = HEX_RE.test(form.textColor) ? form.textColor : "#FFFFFF";
    return (
        <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
                <label className="block text-xs text-[#1A1A1B]/40 mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={validColor}
                        onChange={e => setForm(p => ({ ...p, textColor: e.target.value.toUpperCase() }))}
                        className="w-10 h-[42px] rounded-lg border border-black/8 cursor-pointer p-1 bg-[#F9F5F0]"
                        aria-label="Text color"
                    />
                    <input
                        value={form.textColor}
                        onChange={e => setForm(p => ({ ...p, textColor: e.target.value }))}
                        placeholder="#FFFFFF"
                        className={inputCls}
                    />
                </div>
                <p className="text-[10px] text-[#1A1A1B]/30 mt-1">Applies to title, subtitle &amp; description over the image.</p>
            </div>
            <div>
                <label className="block text-xs text-[#1A1A1B]/40 mb-1">Button Style</label>
                <select
                    value={form.buttonStyle}
                    onChange={e => setForm(p => ({ ...p, buttonStyle: e.target.value }))}
                    className={inputCls}
                >
                    <option value="solid">Solid (white fill)</option>
                    <option value="outline">Outline (uses text color)</option>
                </select>
            </div>
        </div>
    );
}

function SlideModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1A1A1B]/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-7 w-full max-w-2xl shadow-2xl border border-black/5 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[#1A1A1B] font-bold">{title}</h2>
                    <button type="button" onClick={onClose} className="text-[#1A1A1B]/30 hover:text-[#1A1A1B]">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </motion.div>
        </motion.div>
    );
}

function SlideFormModal({
    title,
    initialValues,
    onClose,
    onSubmit,
}: {
    title: string;
    initialValues?: SlideForm;
    onClose: () => void;
    onSubmit: (form: SlideForm) => Promise<void>;
}) {
    const [form, setForm] = useState<SlideForm>(initialValues ?? EMPTY_FORM);
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [bgUploading, setBgUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validate required fields (allow blob: URLs — upload still in flight)
        if (!form.desktopImageUrl || !form.mobileImageUrl || !form.title) return;
        setSaving(true);
        await onSubmit(form);
        setSaving(false);
    };

    const isBusy = saving || !!uploadingKey;
    const pendingUpload = bgUploading; // background upload in flight

    return (
        <SlideModal title={title} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <UploadDualImages
                    form={form}
                    setForm={setForm}
                    uploadingKey={uploadingKey}
                    setUploadingKey={setUploadingKey}
                    bgUploading={bgUploading}
                    setBgUploading={setBgUploading}
                />
                <TextFields form={form} setForm={setForm} />
                <StyleFields form={form} setForm={setForm} />
                {pendingUpload && (
                    <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Image uploading in background — you can save once it finishes.
                    </p>
                )}
                <div className="flex gap-3 mt-5">
                    <motion.button type="submit"
                        disabled={isBusy || pendingUpload || !form.desktopImageUrl || !form.mobileImageUrl || !form.title}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        className="flex-1 py-2.5 rounded-xl bg-[#735697] text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (initialValues ? "Save Changes" : "Add Slide")}
                    </motion.button>
                    <button type="button" onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-[#1A1A1B]/40 hover:text-[#1A1A1B] text-sm border border-black/8">
                        Cancel
                    </button>
                </div>
            </form>
        </SlideModal>
    );
}

export default function AdminCarouselPage() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/carousel");
            if (res.ok) setSlides(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async (formPayload: SlideForm) => {
        const res = await fetch("/api/admin/carousel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formPayload, order: slides.length }),
        });
        if (res.ok) { setAdding(false); load(); }
    };

    const handleEdit = async (formPayload: SlideForm) => {
        if (!editingSlide) return;
        const res = await fetch(`/api/admin/carousel/${editingSlide.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formPayload),
        });
        if (res.ok) { setEditingSlide(null); load(); }
    };

    const handleDelete = async (slide: Slide) => {
        if (!confirm("Delete this slide?")) return;
        setDeletingId(slide.id);
        await fetch(`/api/admin/carousel/${slide.id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    const toggleActive = async (slide: Slide) => {
        await fetch(`/api/admin/carousel/${slide.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !slide.isActive }),
        });
        load();
    };



    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">Carousel Slides</h1>
                    <p className="text-[#1A1A1B]/40 text-xs mt-0.5">{slides.length} slides · desktop &amp; mobile images per slide</p>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white text-sm font-semibold shadow-[0_2px_10px_rgba(115,86,151,0.2)]">
                    <Plus className="w-4 h-4" /> Add Slide
                </motion.button>
            </div>

            <AnimatePresence>
                {adding && (
                    <SlideFormModal title="Add New Slide" onClose={() => setAdding(false)} onSubmit={handleAdd} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingSlide && (
                    <SlideFormModal
                        title="Edit Slide"
                        onClose={() => setEditingSlide(null)}
                        initialValues={{
                            title: editingSlide.title,
                            subtitle: editingSlide.subtitle || "",
                            description: editingSlide.description || "",
                            buttonText: editingSlide.buttonText || "Shop Now",
                            buttonLink: editingSlide.buttonLink || "/category/all",
                            textColor: editingSlide.textColor || "#FFFFFF",
                            buttonStyle: editingSlide.buttonStyle || "solid",
                            desktopImageUrl: editingSlide.desktopImageUrl || editingSlide.imageUrl || "",
                            mobileImageUrl: editingSlide.mobileImageUrl || "",
                        }}
                        onSubmit={handleEdit}
                    />
                )}
            </AnimatePresence>

            {loading ? (
                <AdminSlidesSkeleton count={3} />
            ) : slides.length === 0 ? (
                <div className="text-center py-20 bg-white border border-black/5 rounded-2xl shadow-sm">
                    <ImagePlay className="w-10 h-10 text-[#1A1A1B]/10 mx-auto mb-3" />
                    <p className="text-[#1A1A1B]/30 text-sm">No slides yet. Click &quot;Add Slide&quot; to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {slides.map((slide, i) => {
                        const desktop = slide.desktopImageUrl || slide.imageUrl;
                        const mobile = slide.mobileImageUrl;
                        return (
                            <motion.div key={slide.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-4 bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                                {/* Twin thumbnails */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-[#F9F5F0] border border-black/5">
                                        {desktop ? (
                                            <Image src={desktop} alt={`${slide.title} desktop`} fill className="object-cover" unoptimized={desktop.startsWith("http")} />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-[#1A1A1B]/20"><Monitor className="w-4 h-4" /></div>
                                        )}
                                    </div>
                                    <div className="relative w-12 aspect-[3/4] rounded-lg overflow-hidden bg-[#F9F5F0] border border-black/5">
                                        {mobile ? (
                                            <Image src={mobile} alt={`${slide.title} mobile`} fill className="object-cover" unoptimized={mobile.startsWith("http")} />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-[#1A1A1B]/20"><Smartphone className="w-3 h-3" /></div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#1A1A1B] font-semibold text-sm truncate">{slide.title}</p>
                                    {slide.subtitle && <p className="text-[#1A1A1B]/40 text-xs mt-0.5 truncate">{slide.subtitle}</p>}
                                    <p className="text-[#735697] text-xs mt-1 truncate">{slide.buttonText || "Shop Now"} → {slide.buttonLink}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => setEditingSlide(slide)}
                                        className="p-2 rounded-lg text-[#1A1A1B]/30 hover:text-[#735697] hover:bg-[#735697]/8 transition-all" title="Edit">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => toggleActive(slide)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${slide.isActive
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            : "bg-[#F9F5F0] text-[#1A1A1B]/40 border-black/8"
                                            }`}>
                                        {slide.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {slide.isActive ? "Active" : "Hidden"}
                                    </button>
                                    <button onClick={() => handleDelete(slide)} disabled={deletingId === slide.id}
                                        className="p-2 rounded-lg text-[#1A1A1B]/25 hover:text-red-500 hover:bg-red-50 transition-all">
                                        {deletingId === slide.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
