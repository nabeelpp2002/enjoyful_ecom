"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Users, Eye, MousePointerClick, ShoppingCart, Heart, Search, CreditCard,
    Package, ImagePlay, Image as ImageIcon, TrendingUp, TrendingDown, Activity,
} from "lucide-react";

interface TopProduct {
    productId: string;
    productName: string;
    count: number;
}

interface TopRevenueProduct {
    name: string;
    revenue: number;
    units: number;
}

interface RevenueData {
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    topProducts: TopRevenueProduct[];
}

interface DashboardData {
    windowDays: number;
    totals: {
        visitors: number;
        pageViews: number;
        productViews: number;
        productClicks: number;
        addToCart: number;
        addToWishlist: number;
        searches: number;
        checkouts: number;
    };
    previous: {
        visitors: number;
        pageViews: number;
        productViews: number;
        productClicks: number;
        addToCart: number;
    };
    derived: { clickThroughRate: number; cartConversionRate: number };
    topViewed: TopProduct[];
    topClicked: TopProduct[];
    topAddedToCart: TopProduct[];
    topSearches: Array<{ query: string; count: number }>;
    timeSeries: Array<{ date: string; count: number }>;
    deviceBreakdown: Array<{ device: string; count: number }>;
}

const RANGE_OPTIONS = [
    { days: 1, label: "Today" },
    { days: 7, label: "7d" },
    { days: 30, label: "30d" },
    { days: 90, label: "90d" },
];

function pctChange(current: number, prev: number): number {
    if (!prev) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
}

function StatCard({
    icon: Icon, label, value, prev, accent,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    prev?: number;
    accent: string;
}) {
    const change = prev !== undefined ? pctChange(value, prev) : null;
    const positive = change !== null && change >= 0;
    return (
        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${accent}`}>
                    <Icon className="w-4 h-4" />
                </div>
                {change !== null && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>
                        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-[#1A1A1B]">{value.toLocaleString()}</p>
            <p className="text-xs text-[#1A1A1B]/40 mt-0.5">{label}</p>
        </div>
    );
}

function TopList({ title, items, emptyMessage }: { title: string; items: TopProduct[]; emptyMessage: string }) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <h3 className="font-semibold text-sm text-[#1A1A1B] mb-4">{title}</h3>
            {items.length === 0 ? (
                <p className="text-[#1A1A1B]/30 text-xs">{emptyMessage}</p>
            ) : (
                <ol className="space-y-2.5">
                    {items.map((item, i) => (
                        <li key={item.productId || i} className="flex items-center gap-3">
                            <span className="text-[#1A1A1B]/30 text-xs font-medium w-4">{i + 1}</span>
                            <span className="flex-1 text-sm text-[#1A1A1B] truncate">{item.productName || "(unknown)"}</span>
                            <span className="text-xs font-semibold text-[#735697]">{item.count}</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

function MiniChart({ data }: { data: Array<{ date: string; count: number }> }) {
    if (!data.length) return <p className="text-[#1A1A1B]/30 text-xs">No data yet</p>;
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end gap-1 h-24">
            {data.map((d, i) => (
                <div key={i} className="flex-1 group relative">
                    <div
                        className="bg-[#735697]/15 hover:bg-[#735697]/35 transition-colors rounded-t"
                        style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }}
                    />
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#1A1A1B] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                        {d.date} · {d.count}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AdminDashboard() {
    const [days, setDays] = useState(7);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState<RevenueData | null>(null);
    const [revenueLoading, setRevenueLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`/api/admin/analytics?days=${days}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (!cancelled) setData(d); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [days]);

    useEffect(() => {
        let cancelled = false;
        setRevenueLoading(true);
        fetch('/api/admin/analytics/revenue?daysBack=30')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (!cancelled) setRevenue(d?.data ?? d); })
            .finally(() => { if (!cancelled) setRevenueLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-heading font-bold text-[#1A1A1B]">Dashboard</h1>
                    <p className="text-[#1A1A1B]/40 text-sm mt-0.5">Welcome back, Admin.</p>
                </div>
                <div className="flex gap-1 bg-white border border-black/5 rounded-xl p-1">
                    {RANGE_OPTIONS.map(r => (
                        <button
                            key={r.days}
                            onClick={() => setDays(r.days)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                days === r.days
                                    ? "bg-[#735697] text-white"
                                    : "text-[#1A1A1B]/50 hover:text-[#1A1A1B]"
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading || !data ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm animate-pulse">
                            <div className="h-8 w-8 bg-black/5 rounded-lg mb-3" />
                            <div className="h-7 w-16 bg-black/5 rounded mb-2" />
                            <div className="h-3 w-20 bg-black/5 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard icon={Users} label="Unique Visitors" value={data.totals.visitors} prev={data.previous.visitors} accent="bg-[#735697]/10 text-[#735697]" />
                        <StatCard icon={Eye} label="Product Views" value={data.totals.productViews} prev={data.previous.productViews} accent="bg-emerald-50 text-emerald-600" />
                        <StatCard icon={MousePointerClick} label="Product Clicks" value={data.totals.productClicks} prev={data.previous.productClicks} accent="bg-amber-50 text-amber-600" />
                        <StatCard icon={ShoppingCart} label="Add to Cart" value={data.totals.addToCart} prev={data.previous.addToCart} accent="bg-rose-50 text-rose-500" />
                        <StatCard icon={Heart} label="Wishlist Adds" value={data.totals.addToWishlist} accent="bg-pink-50 text-pink-500" />
                        <StatCard icon={Search} label="Searches" value={data.totals.searches} accent="bg-blue-50 text-blue-500" />
                        <StatCard icon={CreditCard} label="Checkouts" value={data.totals.checkouts} accent="bg-indigo-50 text-indigo-500" />
                        <StatCard icon={Activity} label="Page Views" value={data.totals.pageViews} prev={data.previous.pageViews} accent="bg-cyan-50 text-cyan-600" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm md:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-sm text-[#1A1A1B]">Activity ({data.windowDays}d)</h3>
                                <span className="text-xs text-[#1A1A1B]/40">events per day</span>
                            </div>
                            <MiniChart data={data.timeSeries} />
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                            <h3 className="font-semibold text-sm text-[#1A1A1B] mb-4">Conversion</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#1A1A1B]/50">View → Click</span>
                                        <span className="font-semibold text-[#1A1A1B]">{data.derived.clickThroughRate}%</span>
                                    </div>
                                    <div className="h-2 bg-[#F9F5F0] rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(data.derived.clickThroughRate, 100)}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#1A1A1B]/50">View → Cart</span>
                                        <span className="font-semibold text-[#1A1A1B]">{data.derived.cartConversionRate}%</span>
                                    </div>
                                    <div className="h-2 bg-[#F9F5F0] rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.min(data.derived.cartConversionRate, 100)}%` }} />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-black/5">
                                    <p className="text-xs text-[#1A1A1B]/40 mb-1.5">Devices</p>
                                    {data.deviceBreakdown.map(d => (
                                        <div key={d.device} className="flex justify-between text-xs py-0.5">
                                            <span className="text-[#1A1A1B]/60 capitalize">{d.device}</span>
                                            <span className="font-medium text-[#1A1A1B]">{d.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <TopList title="Most Viewed Products" items={data.topViewed} emptyMessage="No product views yet" />
                        <TopList title="Most Clicked Products" items={data.topClicked} emptyMessage="No clicks yet" />
                        <TopList title="Most Added to Cart" items={data.topAddedToCart} emptyMessage="No cart adds yet" />
                    </div>

                    {data.topSearches.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm mb-6">
                            <h3 className="font-semibold text-sm text-[#1A1A1B] mb-3">Top Searches</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.topSearches.map((s, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-[#F9F5F0] rounded-lg text-xs">
                                        <span className="text-[#1A1A1B]">{s.query}</span>
                                        <span className="text-[#735697] font-semibold ml-1.5">{s.count}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Revenue — Last 30 Days */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-[#1A1A1B] mb-3">Revenue — Last 30 Days</h2>
                {revenueLoading || !revenue ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm animate-pulse">
                                    <div className="h-8 w-8 bg-black/5 rounded-lg mb-3" />
                                    <div className="h-7 w-16 bg-black/5 rounded mb-2" />
                                    <div className="h-3 w-20 bg-black/5 rounded" />
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm animate-pulse">
                            <div className="h-4 w-28 bg-black/5 rounded mb-4" />
                            <div className="space-y-2.5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="h-4 flex-1 bg-black/5 rounded" />
                                        <div className="h-4 w-16 bg-black/5 rounded" />
                                        <div className="h-4 w-10 bg-black/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 rounded-lg bg-[#735697]/10 text-[#735697]">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[#1A1A1B]">
                                    {revenue.totalRevenue.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-[#1A1A1B]/40 mt-0.5">Total Revenue (AED)</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                        <ShoppingCart className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[#1A1A1B]">{revenue.orderCount.toLocaleString()}</p>
                                <p className="text-xs text-[#1A1A1B]/40 mt-0.5">Total Orders</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[#1A1A1B]">
                                    {revenue.averageOrderValue.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-[#1A1A1B]/40 mt-0.5">Avg Order Value (AED)</p>
                            </div>
                        </div>

                        {revenue.topProducts.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                                <h3 className="font-semibold text-sm text-[#1A1A1B] mb-4">Top Products</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-black/5">
                                                <th className="text-left text-xs font-medium text-[#1A1A1B]/40 pb-2 pr-4">Product Name</th>
                                                <th className="text-right text-xs font-medium text-[#1A1A1B]/40 pb-2 pr-4">Revenue (AED)</th>
                                                <th className="text-right text-xs font-medium text-[#1A1A1B]/40 pb-2">Units</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/[0.03]">
                                            {revenue.topProducts.slice(0, 5).map((p, i) => (
                                                <tr key={i}>
                                                    <td className="py-2.5 pr-4 text-[#1A1A1B] truncate max-w-[200px]">{p.name}</td>
                                                    <td className="py-2.5 pr-4 text-right font-semibold text-[#735697]">
                                                        {p.revenue.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-2.5 text-right text-[#1A1A1B]/60">{p.units}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                    { label: "Products", desc: "Manage catalogue", icon: Package, href: "/admin/products", bg: "bg-[#735697]/8", iconColor: "text-[#735697]", border: "border-[#735697]/12 hover:border-[#735697]/25" },
                    { label: "Carousel", desc: "Homepage slides", icon: ImagePlay, href: "/admin/carousel", bg: "bg-[#F4B449]/12", iconColor: "text-[#c48f2a]", border: "border-[#F4B449]/20 hover:border-[#F4B449]/40" },
                    { label: "Banners", desc: "Category banners", icon: ImageIcon, href: "/admin/banners", bg: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-emerald-100 hover:border-emerald-200" },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label}
                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.06 }}>
                            <Link href={s.href}
                                className={`block p-5 rounded-2xl border bg-white transition-all ${s.border}`}>
                                <div className={`p-2.5 rounded-xl inline-flex mb-4 ${s.bg}`}>
                                    <Icon className={`w-5 h-5 ${s.iconColor}`} />
                                </div>
                                <p className="text-[#1A1A1B] font-semibold text-sm">{s.label}</p>
                                <p className="text-[#1A1A1B]/35 text-xs mt-0.5">{s.desc}</p>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
