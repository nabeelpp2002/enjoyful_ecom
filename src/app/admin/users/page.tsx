"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Search, Mail, KeyRound, Sparkles, Lock, ShieldCheck,
    UserCircle2, ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/ui/AdminSkeleton";

type Sort = "recent" | "oldest" | "name" | "orders";

interface UserRow {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    providers: string[];
    createdAt: string;
    orderCount: number;
    totalSpent: number;
    reviewCount: number;
}

interface Response {
    success: boolean;
    data: UserRow[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    stats: { totalUsers: number; activeUsers: number; adminCount: number; recentSignups: number };
}

const SORT_LABEL: Record<Sort, string> = {
    recent: "Recently joined",
    oldest: "Oldest first",
    name: "By name",
    orders: "Most orders",
};

const STAT_CARDS = [
    { key: "totalUsers", label: "Total users", icon: Users, color: "text-[#735697]", bg: "bg-[#735697]/8" },
    { key: "activeUsers", label: "Active", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "adminCount", label: "Admins", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
    { key: "recentSignups", label: "Last 7 days", icon: Sparkles, color: "text-sky-600", bg: "bg-sky-50" },
] as const;

const providerStyle: Record<string, { label: string; icon: typeof Mail; cls: string }> = {
    password: { label: "Password", icon: Lock, cls: "bg-gray-100 text-gray-600" },
    otp: { label: "Email OTP", icon: KeyRound, cls: "bg-[#735697]/10 text-[#735697]" },
    google: { label: "Google", icon: Mail, cls: "bg-blue-50 text-blue-600" },
};

function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [data, setData] = useState<Response | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [sort, setSort] = useState<Sort>("recent");
    const [page, setPage] = useState(1);
    const [toggling, setToggling] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => { setDebounced(search); setPage(1); }, 250);
        return () => clearTimeout(t);
    }, [search]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: "20",
            sort,
            ...(debounced ? { q: debounced } : {}),
        });
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (res.status === 401 || res.status === 403) {
            setAuthError(true); setLoading(false); return;
        }
        if (res.ok) {
            // NestJS ResponseInterceptor wraps the service return as
            //   { success: true, data: [...], meta: {...}, stats: {...} }
            // We need the FULL envelope, not just `body.data`.
            const body = await res.json();
            setData(body as Response);
        }
        setLoading(false);
    }, [page, sort, debounced]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleToggleActive = async (u: UserRow) => {
        if (u.role === "admin") return; // safety: don't disable admins from here
        setToggling(u.id);
        const next = !u.isActive;
        try {
            const res = await fetch(`/api/admin/users/${u.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: next }),
            });
            if (res.ok && data) {
                setData({ ...data, data: data.data.map(x => x.id === u.id ? { ...x, isActive: next } : x) });
            }
        } finally {
            setToggling(null);
        }
    };

    if (authError) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-red-400" />
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
            <div className="mb-6">
                <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">Users</h1>
                <p className="text-[#1A1A1B]/40 text-xs mt-0.5">
                    {data ? `${data.meta.total} total registered` : "Loading…"}
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {STAT_CARDS.map(card => {
                    const Icon = card.icon;
                    const value = data?.stats[card.key] ?? 0;
                    return (
                        <div key={card.key} className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-2`}>
                                <Icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                            <p className="text-2xl font-heading font-bold text-[#1A1A1B] tabular-nums">{value}</p>
                            <p className="text-[#1A1A1B]/40 text-xs mt-0.5">{card.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1B]/25" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by email or name…"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/8 rounded-xl text-[#1A1A1B] placeholder:text-[#1A1A1B]/25 focus:outline-none focus:border-[#735697]/40 text-sm"
                    />
                </div>
                <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-[#1A1A1B]/40 mr-1">Sort:</span>
                    {(Object.keys(SORT_LABEL) as Sort[]).map(s => (
                        <button
                            key={s}
                            onClick={() => { setSort(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                sort === s
                                    ? "bg-[#735697] text-white"
                                    : "bg-white border border-black/8 text-[#1A1A1B]/60 hover:border-[#735697]/30"
                            }`}
                        >
                            {SORT_LABEL[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <AdminTableSkeleton rows={8} />
            ) : !data || data.data.length === 0 ? (
                <div className="text-center py-20 bg-white border border-black/5 rounded-2xl shadow-sm">
                    <UserCircle2 className="w-10 h-10 text-[#1A1A1B]/10 mx-auto mb-3" />
                    <p className="text-[#1A1A1B]/30 text-sm">
                        {debounced ? `No users match "${debounced}"` : "No users yet"}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-black/5 bg-[#F9F5F0]/80">
                                    <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide">User</th>
                                    <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Providers</th>
                                    <th className="text-right px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Orders</th>
                                    <th className="text-right px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Spent</th>
                                    <th className="text-right px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Reviews</th>
                                    <th className="text-left px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Joined</th>
                                    <th className="text-right px-5 py-3.5 text-[#1A1A1B]/40 font-medium text-xs uppercase tracking-wide">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/4">
                                {data.data.map(u => {
                                    const name = `${u.firstName} ${u.lastName}`.trim() || u.email.split("@")[0];
                                    const initial = name.charAt(0).toUpperCase();
                                    return (
                                        <tr key={u.id} className="hover:bg-[#F9F5F0]/40 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#735697]/10 text-[#735697] font-semibold flex items-center justify-center text-sm">
                                                        {u.avatarUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : initial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-medium text-[#1A1A1B] text-sm truncate max-w-[180px]">
                                                                {name}
                                                            </p>
                                                            {u.role === "admin" && (
                                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                                                    ADMIN
                                                                </span>
                                                            )}
                                                            {u.emailVerified && (
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-[#1A1A1B]/45 text-xs truncate max-w-[220px]">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 hidden md:table-cell">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {(u.providers && u.providers.length > 0 ? u.providers : ["password"]).map(p => {
                                                        const s = providerStyle[p] ?? providerStyle.password;
                                                        const Icon = s.icon;
                                                        return (
                                                            <span key={p} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${s.cls}`}>
                                                                <Icon className="w-2.5 h-2.5" /> {s.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right hidden sm:table-cell tabular-nums text-[#1A1A1B]/80">{u.orderCount}</td>
                                            <td className="px-5 py-3.5 text-right hidden sm:table-cell tabular-nums text-[#1A1A1B]">
                                                {u.totalSpent > 0 ? <><span className="font-semibold">{u.totalSpent.toFixed(0)}</span> <span className="text-[#1A1A1B]/40 text-xs">AED</span></> : <span className="text-[#1A1A1B]/30">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-right hidden lg:table-cell tabular-nums text-[#1A1A1B]/80">{u.reviewCount}</td>
                                            <td className="px-5 py-3.5 hidden md:table-cell text-xs text-[#1A1A1B]/50">{timeAgo(u.createdAt)}</td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleToggleActive(u)}
                                                    disabled={toggling === u.id || u.role === "admin"}
                                                    title={u.role === "admin" ? "Admins can't be deactivated here" : (u.isActive ? "Click to deactivate" : "Click to activate")}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        u.isActive
                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
                                                            : "bg-[#F9F5F0] text-[#1A1A1B]/40 border-black/8 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                                                    }`}
                                                >
                                                    {toggling === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                                        u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {u.isActive ? "Active" : "Inactive"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data.meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-black/5 text-xs">
                            <span className="text-[#1A1A1B]/50">
                                Page {data.meta.page} of {data.meta.totalPages} · {data.meta.total} users
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
