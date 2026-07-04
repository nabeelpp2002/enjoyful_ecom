"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MessageSquare, Search, Star, Eye, EyeOff, Trash2, RotateCcw,
    ChevronLeft, ChevronRight, Loader2, Package, ExternalLink,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/ui/AdminSkeleton";

type Status = "all" | "visible" | "hidden" | "deleted";

interface ReviewRow {
    _id: string;
    rating: number;
    title?: string;
    comment: string;
    userName: string;
    userEmail: string;
    isHidden: boolean;
    isDeleted: boolean;
    createdAt: string;
    product?: { _id: string; name: string; slug: string } | null;
}

interface Resp {
    success: boolean;
    data: ReviewRow[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    stats: { total: number; visible: number; hidden: number; deleted: number };
}

const TABS: { value: Status; label: string }[] = [
    { value: "all", label: "All" },
    { value: "visible", label: "Visible" },
    { value: "hidden", label: "Hidden" },
    { value: "deleted", label: "Deleted" },
];

function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.round(ms / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function Stars({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <Star
                    key={n}
                    className={`w-3.5 h-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-[#1A1A1B]/15"}`}
                    strokeWidth={1.5}
                />
            ))}
        </span>
    );
}

export default function AdminReviewsPage() {
    const router = useRouter();
    const [data, setData] = useState<Resp | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);
    const [status, setStatus] = useState<Status>("all");
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [page, setPage] = useState(1);
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => { setDebounced(search); setPage(1); }, 250);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { setPage(1); }, [status]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: "20",
            status,
            ...(debounced ? { q: debounced } : {}),
        });
        const res = await fetch(`/api/admin/reviews?${params.toString()}`);
        if (res.status === 401 || res.status === 403) {
            setAuthError(true); setLoading(false); return;
        }
        if (res.ok) {
            const body = await res.json();
            setData(body as Resp);
        }
        setLoading(false);
    }, [page, status, debounced]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const setHidden = async (r: ReviewRow, hidden: boolean) => {
        setBusy(r._id);
        await fetch(`/api/admin/reviews/${r._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "visibility", hidden }),
        });
        setBusy(null);
        fetchData();
    };

    const setArchived = async (r: ReviewRow, deleted: boolean) => {
        const confirmMsg = deleted ? "Move this review to Deleted?" : "Restore this review?";
        if (!confirm(confirmMsg)) return;
        setBusy(r._id);
        await fetch(`/api/admin/reviews/${r._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "archive", deleted }),
        });
        setBusy(null);
        fetchData();
    };

    if (authError) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-[#1A1A1B] font-semibold mb-1">Session expired</p>
                <p className="text-[#1A1A1B]/40 text-sm mb-6">Please log in again to continue.</p>
                <button onClick={() => router.push("/admin/login")} className="px-5 py-2.5 rounded-xl bg-[#735697] text-white text-sm font-semibold hover:bg-[#5e4580] transition-colors">Go to Login</button>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">Reviews</h1>
                <p className="text-[#1A1A1B]/40 text-xs mt-0.5">
                    {data ? `${data.stats.total} total · ${data.stats.visible} visible · ${data.stats.hidden} hidden · ${data.stats.deleted} deleted` : "Loading…"}
                </p>
            </div>

            {/* Status tabs */}
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                {TABS.map(t => {
                    const count = data ? (t.value === "all" ? data.stats.total : data.stats[t.value]) : 0;
                    const active = status === t.value;
                    return (
                        <button
                            key={t.value}
                            onClick={() => setStatus(t.value)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                                active
                                    ? "bg-[#735697] text-white border-[#735697]"
                                    : "bg-white text-[#1A1A1B]/60 border-black/8 hover:border-[#735697]/30"
                            }`}
                        >
                            {t.label}
                            {data && (
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-[#1A1A1B]/5"}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
                <div className="relative ml-auto w-full sm:w-72 mt-2 sm:mt-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1B]/25" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by user or text…"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-black/8 rounded-xl text-[#1A1A1B] placeholder:text-[#1A1A1B]/25 focus:outline-none focus:border-[#735697]/40 text-sm"
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <AdminTableSkeleton rows={6} />
            ) : !data || data.data.length === 0 ? (
                <div className="text-center py-20 bg-white border border-black/5 rounded-2xl shadow-sm">
                    <MessageSquare className="w-10 h-10 text-[#1A1A1B]/10 mx-auto mb-3" />
                    <p className="text-[#1A1A1B]/30 text-sm">No reviews in this view</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.data.map(r => {
                        const stateBadge = r.isDeleted
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-600">DELETED</span>
                            : r.isHidden
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-600">HIDDEN</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600">VISIBLE</span>;
                        return (
                            <div key={r._id} className={`bg-white border rounded-2xl p-4 md:p-5 shadow-sm transition-opacity ${r.isDeleted ? "border-red-100 opacity-70" : r.isHidden ? "border-amber-100 opacity-80" : "border-black/5"}`}>
                                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm text-[#1A1A1B]">{r.userName}</p>
                                        <span className="text-[11px] text-[#1A1A1B]/40">{r.userEmail}</span>
                                        {stateBadge}
                                        <Stars rating={r.rating} />
                                        <span className="text-[11px] text-[#1A1A1B]/40">· {timeAgo(r.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {!r.isDeleted && (
                                            <button
                                                onClick={() => setHidden(r, !r.isHidden)}
                                                disabled={busy === r._id}
                                                title={r.isHidden ? "Show on storefront" : "Hide from storefront"}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                                    r.isHidden
                                                        ? "bg-[#F9F5F0] text-[#1A1A1B]/55 border-black/8 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100"
                                                }`}
                                            >
                                                {busy === r._id ? <Loader2 className="w-3 h-3 animate-spin" /> : r.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                {r.isHidden ? "Hidden" : "Visible"}
                                            </button>
                                        )}
                                        {r.isDeleted ? (
                                            <button
                                                onClick={() => setArchived(r, false)}
                                                disabled={busy === r._id}
                                                title="Restore review"
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 transition-all"
                                            >
                                                {busy === r._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                                Restore
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setArchived(r, true)}
                                                disabled={busy === r._id}
                                                title="Move to deleted"
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-white text-[#1A1A1B]/55 border-black/8 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                                            >
                                                {busy === r._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {r.title && <p className="font-semibold text-sm text-[#1A1A1B] mb-1">{r.title}</p>}
                                <p className="text-sm text-[#1A1A1B]/75 leading-relaxed whitespace-pre-wrap line-clamp-4">{r.comment}</p>
                                {r.product && (
                                    <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-2 flex-wrap">
                                        <Package className="w-3.5 h-3.5 text-[#1A1A1B]/35" />
                                        <span className="text-xs text-[#1A1A1B]/55">on</span>
                                        <Link
                                            href={`/admin/products/${r.product._id}/edit`}
                                            className="text-xs text-[#735697] font-medium hover:underline"
                                        >
                                            {r.product.name}
                                        </Link>
                                        {r.product.slug && (
                                            <a
                                                href={`/product/${r.product._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-[#1A1A1B]/40 hover:text-[#735697] inline-flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" /> view
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {data.meta.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 text-xs">
                            <span className="text-[#1A1A1B]/50">
                                Page {data.meta.page} of {data.meta.totalPages} · {data.meta.total} reviews
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="p-1.5 rounded-lg text-[#1A1A1B]/50 hover:text-[#735697] hover:bg-[#735697]/8 border border-black/8 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-3 py-1 rounded-lg bg-[#F9F5F0] text-[#1A1A1B] font-semibold tabular-nums min-w-[36px] text-center">{page}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                                    disabled={page >= data.meta.totalPages}
                                    className="p-1.5 rounded-lg text-[#1A1A1B]/50 hover:text-[#735697] hover:bg-[#735697]/8 border border-black/8 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
