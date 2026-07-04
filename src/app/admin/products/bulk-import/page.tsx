"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Upload, FileJson, FileSpreadsheet, Loader2,
    CheckCircle2, AlertCircle, Download, Copy, Eye, ChevronDown, ChevronUp,
} from "lucide-react";

type Mode = "json" | "csv" | "xlsx";

interface ImportResult {
    created: number;
    failed: number;
    errors: { index: number; message: string }[];
}

interface ParsedProduct {
    productCode?: string;
    name: string;
    category: string;
    subcategory?: string;
    productType?: string;
    size?: string;
    itemForm?: string;
    targetUse?: string;
    scent?: string;
    texture?: string;
    price: number;
    currency: string;
    benefits?: string[];
    ingredients?: string[];
    activeIngredients?: string[];
    barcode?: string;
    [key: string]: unknown;
}

interface XlsxParseResult {
    parsed: ParsedProduct[];
    errors: string[];
}

const SAMPLE_JSON = `[
  {
    "name": "Rose Glow Serum",
    "category": "Glow",
    "subcategory": "Face Serum",
    "productType": "Serum",
    "brand": "Enjoyful Life",
    "price": 65,
    "originalPrice": 85,
    "shortDescription": "Brightening rose-infused serum for radiant skin.",
    "description": "A luxurious brightening serum enriched with Rosa Damascena extract.",
    "howToUse": "Apply 2-3 drops to clean face morning and night.",
    "recommendedUsage": "Twice daily, morning and evening.",
    "precautions": "Avoid contact with eyes. Patch test recommended for sensitive skin.",
    "seoTitle": "Rose Glow Serum | Brightening Serum | Enjoyful Life",
    "metaDescription": "Luminous skin with our Rose Glow Serum. Rosa Damascena and Hyaluronic Acid for visible radiance.",
    "keywords": ["rose serum", "brightening serum", "face serum UAE", "glow serum"],
    "searchTags": ["serum", "rose", "brightening", "glow", "face care"],
    "benefits": ["Brightens dull skin", "Reduces fine lines"],
    "activeIngredients": ["Rosa Damascena Extract", "Hyaluronic Acid"],
    "ingredients": ["Rosa Damascena Extract", "Hyaluronic Acid", "Niacinamide", "Aqua"],
    "features": ["Dermatologically tested", "Vegan formula", "Cruelty-free"],
    "skinType": ["All Skin Types"],
    "targetUse": "Face",
    "scent": "Floral",
    "texture": "Lightweight",
    "itemForm": "Serum",
    "size": "30ml",
    "countryOfOrigin": "Pending Client Confirmation",
    "barcode": "Pending Client Confirmation",
    "shelfLife": "Pending Client Confirmation",
    "storageInstructions": "Pending Client Confirmation",
    "image": "https://res.cloudinary.com/example/image/upload/your-image.jpg",
    "images": []
  }
]`;

const SAMPLE_CSV = `name,category,subcategory,productType,price,description,benefits,ingredients,howToUse,skinType,stock,image
Rose Glow Serum,Glow,Face Serum,Serum,65,Brightening rose-infused serum,Brightens dull skin|Reduces fine lines,Rosa Damascena Extract|Hyaluronic Acid,Apply 2-3 drops,All Skin Types,50,https://res.cloudinary.com/example/image/upload/rose-serum.jpg`;

const inputCls =
    "w-full px-4 py-2.5 bg-[#F9F5F0] border border-black/8 rounded-xl text-[#1A1A1B] placeholder:text-[#1A1A1B]/25 focus:outline-none focus:border-[#735697]/40 focus:bg-white transition-all text-sm font-mono";
const cardCls = "bg-white border border-black/5 rounded-2xl p-6 shadow-sm";

function ProductPreviewRow({ product, index }: { product: ParsedProduct; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-black/5 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9F5F0] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#1A1A1B]/40 w-6 shrink-0">{index + 1}</span>
                    <div>
                        <p className="text-sm font-medium text-[#1A1A1B]">{product.name}</p>
                        <p className="text-xs text-[#1A1A1B]/40 mt-0.5">
                            {product.category}
                            {product.subcategory && <> · {product.subcategory}</>}
                            {product.size && <> · {product.size}</>}
                            {product.productCode && (
                                <> · <span className="font-mono">{product.productCode}</span></>
                            )}
                        </p>
                    </div>
                </div>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-[#1A1A1B]/30 shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[#1A1A1B]/30 shrink-0" />
                )}
            </button>
            {open && (
                <div className="px-4 pb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs border-t border-black/5 pt-3">
                    {([
                        ["Item Form", product.itemForm],
                        ["Target Use", product.targetUse],
                        ["Scent", product.scent],
                        ["Texture", product.texture],
                        ["Active Ingredients", product.activeIngredients?.join(", ")],
                        ["Benefits", product.benefits?.slice(0, 3).join(" · ")],
                    ] as [string, string | undefined][]).map(([label, val]) =>
                        val ? (
                            <div key={label}>
                                <span className="text-[#1A1A1B]/40">{label}: </span>
                                <span className="text-[#1A1A1B]/80">{val}</span>
                            </div>
                        ) : null
                    )}
                </div>
            )}
        </div>
    );
}

export default function BulkImportPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("json");

    // JSON / CSV state
    const [jsonText, setJsonText] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // XLSX state
    const [xlsxFile, setXlsxFile] = useState<File | null>(null);
    const [xlsxParsing, setXlsxParsing] = useState(false);
    const [xlsxResult, setXlsxResult] = useState<XlsxParseResult | null>(null);
    const [xlsxError, setXlsxError] = useState<string | null>(null);
    const [xlsxImporting, setXlsxImporting] = useState(false);
    const xlsxRef = useRef<HTMLInputElement>(null);

    function resetAll() {
        setResult(null); setError(null);
        setXlsxResult(null); setXlsxError(null);
        setJsonText(""); setCsvFile(null); setXlsxFile(null);
    }

    const downloadSample = (type: "json" | "csv") => {
        const content = type === "json" ? SAMPLE_JSON : SAMPLE_CSV;
        const blob = new Blob([content], { type: type === "json" ? "application/json" : "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `enjoyful-products-sample.${type}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        setError(null);
        setResult(null);
        setImporting(true);
        try {
            let res: Response;
            if (mode === "json") {
                let parsed: unknown;
                try {
                    parsed = JSON.parse(jsonText);
                } catch (e) {
                    setError(`Invalid JSON: ${(e as Error).message}`);
                    return;
                }
                const products = Array.isArray(parsed)
                    ? parsed
                    : (parsed as { products?: unknown[] }).products;
                if (!Array.isArray(products) || products.length === 0) {
                    setError("Provide an array of products (or { products: [...] })");
                    return;
                }
                res = await fetch("/api/admin/products/bulk-import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ products }),
                });
            } else {
                if (!csvFile) { setError("Choose a CSV file first"); return; }
                const fd = new FormData();
                fd.append("file", csvFile);
                res = await fetch("/api/admin/products/bulk-import", { method: "POST", body: fd });
            }
            if (res.status === 401) { router.push("/admin/login"); return; }
            const data = await res.json();
            if (!res.ok) { setError(data?.error?.message ?? data?.message ?? "Import failed"); return; }
            setResult(data?.data ?? data);
            try { sessionStorage.removeItem("enjoyful-admin-products-cache"); } catch {}
        } finally {
            setImporting(false);
        }
    };

    const handleXlsxParse = async () => {
        if (!xlsxFile) return;
        setXlsxError(null);
        setXlsxResult(null);
        setXlsxParsing(true);
        try {
            const fd = new FormData();
            fd.append("file", xlsxFile);
            const res = await fetch("/api/products/parse-xlsx", { method: "POST", body: fd });
            if (res.status === 401) { router.push("/admin/login"); return; }
            const data = await res.json();
            if (!res.ok) {
                setXlsxError(data?.error?.message ?? data?.message ?? "Parse failed");
                return;
            }
            setXlsxResult(data?.data ?? data);
        } finally {
            setXlsxParsing(false);
        }
    };

    const handleXlsxImport = async () => {
        if (!xlsxResult?.parsed?.length) return;
        setXlsxImporting(true);
        try {
            const res = await fetch("/api/admin/products/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: xlsxResult.parsed }),
            });
            if (res.status === 401) { router.push("/admin/login"); return; }
            const data = await res.json();
            if (!res.ok) {
                setXlsxError(data?.error?.message ?? data?.message ?? "Import failed");
                return;
            }
            setResult(data?.data ?? data);
            setXlsxResult(null);
            try { sessionStorage.removeItem("enjoyful-admin-products-cache"); } catch {}
        } finally {
            setXlsxImporting(false);
        }
    };

    const downloadXlsxJson = () => {
        if (!xlsxResult) return;
        const blob = new Blob([JSON.stringify(xlsxResult.parsed, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "enjoyful-catalog-parsed.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const TABS: { id: Mode; label: string }[] = [
        { id: "json", label: "JSON" },
        { id: "csv", label: "CSV" },
        { id: "xlsx", label: "XLSX Catalog" },
    ];

    return (
        <div className="max-w-4xl pb-16">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/admin/products" className="text-[#1A1A1B]/30 hover:text-[#735697]">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">
                        Bulk Import Products
                    </h1>
                    <p className="text-[#1A1A1B]/40 text-xs mt-0.5">
                        Import via JSON, CSV, or the Enjoyful Life XLSX catalog spreadsheet
                    </p>
                </div>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-5">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setMode(tab.id); resetAll(); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                            mode === tab.id
                                ? "bg-[#735697] text-white border-[#735697] shadow-[0_2px_10px_rgba(115,86,151,0.2)]"
                                : "bg-white text-[#1A1A1B]/60 border-black/8 hover:border-[#735697]/30"
                        }`}
                    >
                        {tab.id === "json" && <FileJson className="w-4 h-4" />}
                        {tab.id === "csv" && <FileSpreadsheet className="w-4 h-4" />}
                        {tab.id === "xlsx" && <FileSpreadsheet className="w-4 h-4" />}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── XLSX tab ──────────────────────────────────────────────── */}
            {mode === "xlsx" && (
                <>
                    <div className={`${cardCls} mb-5`}>
                        <h2 className="text-sm font-semibold text-[#1A1A1B] mb-1">
                            Enjoyful Life Product Catalog (XLSX)
                        </h2>
                        <p className="text-[#1A1A1B]/50 text-xs leading-relaxed mb-4">
                            Upload{" "}
                            <span className="font-mono bg-[#F0EDF6] px-1 rounded">
                                Enjoyful_Life_Products_Full_INCI_with_Benefits.xlsx
                            </span>{" "}
                            or any spreadsheet with columns:{" "}
                            <span className="font-mono">Code · Item Name · Ingredients · Benefits</span>.
                            The parser infers category, subcategory, size, active ingredients and catalog
                            metadata automatically. Review the result, then download the JSON to set prices
                            before importing.
                            <br />
                            <span className="text-amber-600 font-medium mt-1 inline-block">
                                Prices default to 0 — update them in the product list after import.
                            </span>
                        </p>

                        {/* Drop zone */}
                        <div
                            onClick={() => xlsxRef.current?.click()}
                            className="border-2 border-dashed border-black/10 hover:border-[#735697]/40 rounded-xl p-10 text-center cursor-pointer transition-all"
                        >
                            <Upload className="w-8 h-8 text-[#1A1A1B]/25 mx-auto mb-3" />
                            {xlsxFile ? (
                                <>
                                    <p className="text-[#1A1A1B] font-medium text-sm">{xlsxFile.name}</p>
                                    <p className="text-[#1A1A1B]/40 text-xs mt-1">
                                        {(xlsxFile.size / 1024).toFixed(1)} KB — click to replace
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[#1A1A1B]/60 text-sm font-medium">
                                        Click to choose the XLSX file
                                    </p>
                                    <p className="text-[#1A1A1B]/40 text-xs mt-1">.xlsx format only</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={xlsxRef}
                            type="file"
                            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                            onChange={(e) => {
                                setXlsxFile(e.target.files?.[0] ?? null);
                                setXlsxResult(null);
                                setXlsxError(null);
                            }}
                        />

                        <button
                            onClick={handleXlsxParse}
                            disabled={!xlsxFile || xlsxParsing}
                            className="mt-4 px-6 py-2.5 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white font-semibold text-sm disabled:opacity-40 flex items-center gap-2 shadow-[0_2px_10px_rgba(115,86,151,0.2)] transition-all"
                        >
                            {xlsxParsing ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Parsing…</>
                            ) : (
                                <><Eye className="w-4 h-4" />Parse &amp; Preview</>
                            )}
                        </button>
                    </div>

                    {xlsxError && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm mb-5">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold mb-0.5">Parse failed</p>
                                <p className="text-red-500">{xlsxError}</p>
                            </div>
                        </div>
                    )}

                    {xlsxResult && !result && (
                        <div className={`${cardCls} mb-5`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-[#1A1A1B] font-semibold">
                                        {xlsxResult.parsed.length} products parsed
                                        {xlsxResult.errors.length > 0 && (
                                            <span className="text-amber-600 ml-2 font-normal text-sm">
                                                · {xlsxResult.errors.length} row errors
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[#1A1A1B]/40 text-xs mt-0.5">
                                        Review below · download JSON to set prices · then import
                                    </p>
                                </div>
                                <button
                                    onClick={downloadXlsxJson}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A1A1B]/60 hover:text-[#735697] hover:bg-[#735697]/8 transition-all border border-black/8"
                                >
                                    <Download className="w-3 h-3" /> Download JSON
                                </button>
                            </div>

                            {xlsxResult.errors.length > 0 && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 space-y-1">
                                    {xlsxResult.errors.map((e, i) => (
                                        <p key={i}>{e}</p>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {xlsxResult.parsed.map((p, i) => (
                                    <ProductPreviewRow key={i} product={p} index={i} />
                                ))}
                            </div>

                            <div className="mt-5 pt-4 border-t border-black/5 flex items-center gap-4">
                                <button
                                    onClick={handleXlsxImport}
                                    disabled={xlsxImporting}
                                    className="px-7 py-2.5 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white font-semibold text-sm disabled:opacity-40 flex items-center gap-2 shadow-[0_2px_10px_rgba(115,86,151,0.2)] transition-all"
                                >
                                    {xlsxImporting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" />Importing…</>
                                    ) : (
                                        <><Upload className="w-4 h-4" />Import All ({xlsxResult.parsed.length})</>
                                    )}
                                </button>
                                <p className="text-xs text-amber-600">
                                    Prices will be 0 — update individually after import.
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── JSON tab ──────────────────────────────────────────────── */}
            {mode === "json" && (
                <>
                    <div className={`${cardCls} mb-5`}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-[#1A1A1B]">JSON template</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigator.clipboard.writeText(SAMPLE_JSON)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A1A1B]/60 hover:text-[#735697] hover:bg-[#735697]/8 transition-all border border-black/8"
                                >
                                    <Copy className="w-3 h-3" /> Copy template
                                </button>
                                <button
                                    onClick={() => downloadSample("json")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A1A1B]/60 hover:text-[#735697] hover:bg-[#735697]/8 transition-all border border-black/8"
                                >
                                    <Download className="w-3 h-3" /> Download sample
                                </button>
                            </div>
                        </div>
                        <p className="text-[#1A1A1B]/50 text-xs leading-relaxed">
                            Required: <span className="font-mono">name, category, price</span>. Categories:{" "}
                            <span className="font-mono">Glow / Baby / Daily / Fragrances / Home Care</span>.
                            Rich catalog fields supported:{" "}
                            <span className="font-mono">
                                shortDescription, activeIngredients, features, targetUse, scent, texture,
                                itemForm, size, seoTitle, metaDescription, keywords, searchTags,
                                recommendedUsage, precautions, productCode, barcode, shelfLife,
                                storageInstructions, countryOfOrigin
                            </span>.
                        </p>
                    </div>
                    <div className={`${cardCls} mb-5`}>
                        <label className="block text-xs font-medium text-[#1A1A1B]/50 mb-2">
                            Paste your JSON here
                        </label>
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder={SAMPLE_JSON}
                            rows={20}
                            spellCheck={false}
                            className={`${inputCls} resize-y leading-relaxed`}
                        />
                    </div>
                    <div className="flex items-center gap-3 mb-5">
                        <button
                            onClick={handleImport}
                            disabled={importing || !jsonText.trim()}
                            className="px-7 py-2.5 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white font-semibold text-sm disabled:opacity-40 flex items-center gap-2 shadow-[0_2px_10px_rgba(115,86,151,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {importing ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Importing...</>
                            ) : (
                                <><Upload className="w-4 h-4" />Import Products</>
                            )}
                        </button>
                        <Link href="/admin/products" className="text-sm text-[#1A1A1B]/40 hover:text-[#1A1A1B]">
                            Cancel
                        </Link>
                    </div>
                </>
            )}

            {/* ── CSV tab ──────────────────────────────────────────────── */}
            {mode === "csv" && (
                <>
                    <div className={`${cardCls} mb-5`}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-[#1A1A1B]">CSV template</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigator.clipboard.writeText(SAMPLE_CSV)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A1A1B]/60 hover:text-[#735697] hover:bg-[#735697]/8 transition-all border border-black/8"
                                >
                                    <Copy className="w-3 h-3" /> Copy template
                                </button>
                                <button
                                    onClick={() => downloadSample("csv")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A1A1B]/60 hover:text-[#735697] hover:bg-[#735697]/8 transition-all border border-black/8"
                                >
                                    <Download className="w-3 h-3" /> Download sample
                                </button>
                            </div>
                        </div>
                        <p className="text-[#1A1A1B]/50 text-xs leading-relaxed">
                            Required columns:{" "}
                            <span className="font-mono">name, category, price</span>. Use pipe{" "}
                            <span className="font-mono">|</span> to separate list items for benefits,
                            ingredients, skinType. Header row required.
                        </p>
                    </div>
                    <div className={`${cardCls} mb-5`}>
                        <label className="block text-xs font-medium text-[#1A1A1B]/50 mb-2">
                            Upload a CSV file
                        </label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-black/10 hover:border-[#735697]/40 rounded-xl p-10 text-center cursor-pointer transition-all"
                        >
                            <Upload className="w-8 h-8 text-[#1A1A1B]/25 mx-auto mb-3" />
                            {csvFile ? (
                                <>
                                    <p className="text-[#1A1A1B] font-medium text-sm">{csvFile.name}</p>
                                    <p className="text-[#1A1A1B]/40 text-xs mt-1">
                                        {(csvFile.size / 1024).toFixed(1)} KB — click to replace
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[#1A1A1B]/60 text-sm font-medium">
                                        Click to choose a CSV file
                                    </p>
                                    <p className="text-[#1A1A1B]/40 text-xs mt-1">or drag and drop</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                        />
                    </div>
                    <div className="flex items-center gap-3 mb-5">
                        <button
                            onClick={handleImport}
                            disabled={importing || !csvFile}
                            className="px-7 py-2.5 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white font-semibold text-sm disabled:opacity-40 flex items-center gap-2 shadow-[0_2px_10px_rgba(115,86,151,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {importing ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Importing...</>
                            ) : (
                                <><Upload className="w-4 h-4" />Import Products</>
                            )}
                        </button>
                        <Link href="/admin/products" className="text-sm text-[#1A1A1B]/40 hover:text-[#1A1A1B]">
                            Cancel
                        </Link>
                    </div>
                </>
            )}

            {/* ── Shared error / result ──────────────────────────────── */}
            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm mb-5">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-0.5">Import failed</p>
                        <p className="text-red-500">{error}</p>
                    </div>
                </div>
            )}

            {result && (
                <div className={cardCls}>
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                result.failed === 0
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-amber-50 text-amber-600"
                            }`}
                        >
                            {result.failed === 0 ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <p className="text-[#1A1A1B] font-semibold">
                                {result.failed === 0 ? "Import complete" : "Import partially complete"}
                            </p>
                            <p className="text-[#1A1A1B]/50 text-xs mt-0.5">
                                <span className="text-emerald-600 font-semibold">
                                    {result.created} created
                                </span>
                                {result.failed > 0 && (
                                    <>
                                        {" · "}
                                        <span className="text-amber-600 font-semibold">
                                            {result.failed} failed
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="border border-black/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs font-semibold text-amber-700">
                                Row errors
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {result.errors.map((e, i) => (
                                    <div
                                        key={i}
                                        className="px-4 py-2.5 border-b border-black/5 last:border-0 text-sm"
                                    >
                                        <span className="font-mono text-xs text-[#1A1A1B]/50 mr-2">
                                            Row {e.index}:
                                        </span>
                                        <span className="text-[#1A1A1B]/80">{e.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-5 pt-5 border-t border-black/5">
                        <Link
                            href="/admin/products"
                            className="px-5 py-2 rounded-xl bg-[#735697] text-white text-sm font-semibold hover:bg-[#5e4580] transition-colors"
                        >
                            View products
                        </Link>
                        <button
                            onClick={resetAll}
                            className="text-sm text-[#1A1A1B]/40 hover:text-[#1A1A1B]"
                        >
                            Import more
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
