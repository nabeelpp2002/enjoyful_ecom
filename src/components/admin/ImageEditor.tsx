"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Loader2, Check, Maximize } from "lucide-react";
import { uploadImageFile } from "@/lib/image-upload";
import { HeroSafeAreaOverlay } from "@/components/admin/HeroSafeAreaOverlay";
import type { HeroImageVariant } from "@/lib/hero-image-spec";

interface ImageEditorProps {
    file: File | null;
    aspect?: number;          // width / height (e.g. 16/9, 3/4, 1). Omit for free-form.
    title?: string;
    /** Endpoint to POST the cropped Blob to. Defaults to /api/admin/upload. */
    uploadUrl?: string;
    /** Show hero safe-area guides inside the crop box (carousel uploads). */
    safeAreaGuide?: HeroImageVariant;
    /** How the source image fits inside the cropper before positioning. */
    cropObjectFit?: "contain" | "horizontal-cover" | "vertical-cover";
    /** Keep the crop box within image bounds. */
    restrictPosition?: boolean;
    onCancel: () => void;
    onUploaded: (url: string) => void;
    /** Called immediately when upload begins, with a local blob preview URL.
     *  Allows the editor to close while upload runs in the background. */
    onUploadStart?: (previewUrl: string) => void;
}

/**
 * Reads a File into an object URL for the Cropper.
 */
function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Render the cropped + rotated + flipped region to a Blob.
 * Uses an off-screen canvas; output type is JPEG at 0.92 quality (matches Cloudinary's default).
 */
async function getCroppedBlob(
    imageSrc: string,
    crop: Area,
    rotation: number,
    flipH: boolean,
    flipV: boolean,
    mimeType: string,
): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });

    const natW = image.naturalWidth || image.width;
    const natH = image.naturalHeight || image.height;
    const radians = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));

    // Bounding box of the rotated source image
    const bBoxWidth  = Math.round(natW * cos + natH * sin);
    const bBoxHeight = Math.round(natW * sin + natH * cos);

    // Step 1: render full source (rotated + flipped) onto a canvas
    const rotatedCanvas = document.createElement("canvas");
    rotatedCanvas.width  = bBoxWidth;
    rotatedCanvas.height = bBoxHeight;
    const rotCtx = rotatedCanvas.getContext("2d")!;
    rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
    rotCtx.rotate(radians);
    rotCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    rotCtx.drawImage(image, -natW / 2, -natH / 2);

    // Step 2: clamp crop rect to the rotated canvas size to avoid black padding.
    // react-easy-crop can return coordinates slightly outside the image when
    // restrictPosition is false (user panned image partially out of the crop box).
    const sx = Math.max(0, Math.round(crop.x));
    const sy = Math.max(0, Math.round(crop.y));
    const sw = Math.min(Math.round(crop.width),  bBoxWidth  - sx);
    const sh = Math.min(Math.round(crop.height), bBoxHeight - sy);

    // Final cropped output
    const out = document.createElement("canvas");
    out.width  = sw;
    out.height = sh;
    const outCtx = out.getContext("2d")!;
    outCtx.drawImage(rotatedCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

    return new Promise<Blob>((resolve, reject) => {
        out.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Canvas.toBlob returned null"))),
            mimeType,
            0.96,
        );
    });
}


const ROTATIONS = [0, 90, 180, 270];

export function ImageEditor({
    file,
    aspect,
    title = "Edit & Upload Image",
    uploadUrl = "/api/admin/upload",
    safeAreaGuide,
    cropObjectFit = "horizontal-cover",
    restrictPosition = false,
    onCancel,
    onUploaded,
    onUploadStart,
}: ImageEditorProps) {
    const [src, setSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!file) { setSrc(null); return; }
        // reset transform state when a new file comes in
        setSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setError(null);
        let cancelled = false;
        // Read the file, THEN verify the browser can actually decode it before showing the
        // cropper. Formats like HEIC (iPhone) read fine but can't be displayed, which would
        // otherwise leave a blank editor with no indication the file was selected.
        readFileAsDataUrl(file)
            .then(dataUrl => new Promise<string>((resolve, reject) => {
                const probe = new Image();
                probe.onload = () => resolve(dataUrl);
                probe.onerror = () => reject(new Error("decode-failed"));
                probe.src = dataUrl;
            }))
            .then(dataUrl => { if (!cancelled) setSrc(dataUrl); })
            .catch(() => {
                if (!cancelled) setError(`Couldn't preview "${file.name}". It looks like an unsupported format (e.g. HEIC from an iPhone) — please convert it to JPG, PNG or WEBP and try again.`);
            });
        return () => { cancelled = true; };
    }, [file]);

    const onCropComplete = useCallback((_area: Area, areaPx: Area) => {
        setCroppedArea(areaPx);
    }, []);

    const handleConfirm = async () => {
        if (!src || !croppedArea || !file) return;
        setError(null);
        setUploading(true);
        try {
            const blob = await getCroppedBlob(src, croppedArea, rotation, flipH, flipV, "image/png");
            const outputName = `${file.name.replace(/\.[^/.]+$/, "")}-edited.png`;

            if (onUploadStart) {
                const localPreview = URL.createObjectURL(blob);
                onUploadStart(localPreview);
                (async () => {
                    try {
                        const url = await uploadImageFile(blob, outputName, uploadUrl);
                        onUploaded(url);
                    } catch (bgErr) {
                        console.error("[ImageEditor] Background upload failed:", bgErr);
                        onUploaded(localPreview);
                    } finally {
                        URL.revokeObjectURL(localPreview);
                    }
                })();
                return;
            }

            const url = await uploadImageFile(blob, outputName, uploadUrl);
            onUploaded(url);
        } catch (err) {
            setError((err as Error).message ?? "Edit/upload failed");
        } finally {
            setUploading(false);
        }
    };

    const resetTransforms = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
    };

    if (!file) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-[#1A1A1B]/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={e => e.target === e.currentTarget && !uploading && onCancel()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-black/5 overflow-hidden flex flex-col max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
                        <div>
                            <h2 className="text-[#1A1A1B] font-heading font-bold text-base">{title}</h2>
                            <p className="text-[#1A1A1B]/40 text-xs mt-0.5">
                                {aspect ? `Aspect ratio ${aspect >= 1 ? `${aspect.toFixed(2)}:1` : `1:${(1 / aspect).toFixed(2)}`}` : "Free-form crop"} · Drag to reposition, scroll to zoom
                                {safeAreaGuide ? " · Align key content inside the safe zones" : ""}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => !uploading && onCancel()}
                            disabled={uploading}
                            className="text-[#1A1A1B]/30 hover:text-[#1A1A1B] disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Cropper */}
                    <div className="relative w-full bg-[#1A1A1B]/95" style={{ height: 420 }}>
                        {/* Live crop output size so the user can adjust the selection precisely */}
                        {croppedArea && (
                            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-black/65 text-white text-xs font-semibold tabular-nums pointer-events-none flex items-center gap-1.5">
                                <Maximize className="w-3 h-3 opacity-70" />
                                {Math.round(croppedArea.width)} × {Math.round(croppedArea.height)} px
                            </div>
                        )}
                        {src ? (
                            <Cropper
                                image={src}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                restrictPosition={restrictPosition}
                                objectFit={cropObjectFit}
                                showGrid
                                style={{
                                    containerStyle: { background: "#1A1A1B" },
                                    mediaStyle: {
                                        scale: `${flipH ? -1 : 1} ${flipV ? -1 : 1}`,
                                    },
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
                                <p className={`text-sm ${error ? "text-red-300" : "text-white/50"}`}>
                                    {error ?? "Loading image…"}
                                </p>
                            </div>
                        )}
                        {safeAreaGuide && aspect && (
                            <HeroSafeAreaOverlay variant={safeAreaGuide} aspect={aspect} />
                        )}
                    </div>

                    {/* Tools */}
                    <div className="px-6 py-4 border-t border-black/5 space-y-3">
                        {/* Zoom slider */}
                        <div className="flex items-center gap-3">
                            <ZoomOut className="w-4 h-4 text-[#1A1A1B]/30 flex-shrink-0" />
                            <input
                                type="range"
                                min={1}
                                max={4}
                                step={0.01}
                                value={zoom}
                                onChange={e => setZoom(parseFloat(e.target.value))}
                                className="flex-1 accent-[#735697]"
                            />
                            <ZoomIn className="w-4 h-4 text-[#1A1A1B]/30 flex-shrink-0" />
                            <span className="text-[#1A1A1B]/40 text-xs w-10 text-right tabular-nums">
                                {zoom.toFixed(2)}x
                            </span>
                        </div>

                        {/* Rotation + flip buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[#1A1A1B]/40 text-xs font-medium mr-1">Rotation</span>
                            {ROTATIONS.map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRotation(r)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                        rotation === r
                                            ? "bg-[#735697] text-white border-[#735697]"
                                            : "bg-white text-[#1A1A1B]/60 border-black/8 hover:border-[#735697]/30"
                                    }`}
                                >
                                    {r}°
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                                title="Rotate 90° left"
                                className="p-1.5 rounded-lg text-[#1A1A1B]/50 hover:text-[#735697] hover:bg-[#735697]/8 border border-black/8 transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setRotation(r => (r + 90) % 360)}
                                title="Rotate 90° right"
                                className="p-1.5 rounded-lg text-[#1A1A1B]/50 hover:text-[#735697] hover:bg-[#735697]/8 border border-black/8 transition-all"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <div className="h-5 w-px bg-black/10 mx-1" />
                            <button
                                type="button"
                                onClick={() => setFlipH(v => !v)}
                                title="Flip horizontal"
                                className={`p-1.5 rounded-lg border transition-all ${
                                    flipH
                                        ? "bg-[#735697] text-white border-[#735697]"
                                        : "text-[#1A1A1B]/50 hover:text-[#735697] border-black/8 hover:bg-[#735697]/8"
                                }`}
                            >
                                <FlipHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setFlipV(v => !v)}
                                title="Flip vertical"
                                className={`p-1.5 rounded-lg border transition-all ${
                                    flipV
                                        ? "bg-[#735697] text-white border-[#735697]"
                                        : "text-[#1A1A1B]/50 hover:text-[#735697] border-black/8 hover:bg-[#735697]/8"
                                }`}
                            >
                                <FlipVertical className="w-3.5 h-3.5" />
                            </button>
                            <div className="h-5 w-px bg-black/10 mx-1" />
                            <button
                                type="button"
                                onClick={resetTransforms}
                                title="Reset all"
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#1A1A1B]/50 hover:text-[#1A1A1B] border border-black/8 transition-all"
                            >
                                <Maximize className="w-3 h-3" /> Reset
                            </button>
                        </div>

                        {error && (
                            <p className="text-red-500 text-xs">{error}</p>
                        )}

                        {safeAreaGuide && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#1A1A1B]/45">
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-sky-400/40 border border-sky-400/60" /> Header</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-300/40 border border-amber-300/60" /> Text / CTA</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/40 border border-emerald-400/60" /> Product / subject</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400/25 border border-red-400/50" /> May crop</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-black/5 bg-[#F9F5F0]/50">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={uploading || !croppedArea}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white font-semibold text-sm disabled:opacity-40 shadow-[0_2px_10px_rgba(115,86,151,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Check className="w-4 h-4" />Save &amp; Upload</>}
                        </button>
                        <button
                            type="button"
                            onClick={() => !uploading && onCancel()}
                            disabled={uploading}
                            className="text-sm text-[#1A1A1B]/40 hover:text-[#1A1A1B] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
