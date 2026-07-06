"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Loader2, ShoppingBag } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useData } from "@/context/DataContext";

interface OrderItem {
    name: string;
    image?: string;
    price: number;
    quantity: number;
    subtotal?: number;
    size?: string;
}
interface Order {
    _id: string;
    orderNumber: string;
    items: OrderItem[];
    total: number;
    subtotal?: number;
    status: string;
    paymentStatus?: string;
    createdAt?: string;
}

const STATUS_STYLE: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    confirmed: "bg-blue-50 text-blue-600 border-blue-100",
    processing: "bg-[#735697]/10 text-[#735697] border-[#735697]/20",
    shipped: "bg-indigo-50 text-indigo-600 border-indigo-100",
    delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
    cancelled: "bg-red-50 text-red-500 border-red-100",
};

function formatDate(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" });
}

export default function OrdersPage() {
    const { isAuthenticated } = useData();
    const [orders, setOrders] = useState<Order[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch("/api/orders", { cache: "no-store" })
            .then((r) => {
                if (r.status === 401 || r.status === 403) { setNeedsAuth(true); return null; }
                return r.ok ? r.json() : null;
            })
            .then((body) => {
                if (cancelled || !body) return;
                const list = body.data ?? body;
                setOrders(Array.isArray(list) ? list : []);
            })
            .catch(() => { if (!cancelled) setOrders([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isAuthenticated]);

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen">
            <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-40 md:pb-16">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My Orders" }]} />

                <h1 className="font-heading font-bold text-2xl md:text-3xl text-[var(--color-brand-onyx)] tracking-tight mt-4 mb-6">
                    My Orders
                </h1>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-purple)]/50" />
                    </div>
                ) : needsAuth ? (
                    <div className="bg-white rounded-2xl border border-[var(--color-brand-onyx)]/5 shadow-sm py-16 px-6 text-center">
                        <Package className="w-10 h-10 text-[var(--color-brand-onyx)]/15 mx-auto mb-4" />
                        <p className="font-heading font-bold text-lg text-[var(--color-brand-onyx)] mb-1">Sign in to view your orders</p>
                        <p className="font-sans text-sm text-[var(--color-brand-onyx)]/55 mb-6 max-w-sm mx-auto">
                            Use the account icon in the header to sign in, then your order history will appear here.
                        </p>
                        <Link href="/" className="inline-block px-6 py-3 rounded-full bg-[var(--color-brand-onyx)] text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity">
                            Continue Shopping
                        </Link>
                    </div>
                ) : orders && orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-2xl border border-[var(--color-brand-onyx)]/5 shadow-sm overflow-hidden">
                                {/* Order header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[var(--color-brand-onyx)]/5 bg-[var(--color-brand-sand)]/40">
                                    <div>
                                        <p className="font-heading font-bold text-sm text-[var(--color-brand-onyx)]">{order.orderNumber}</p>
                                        <p className="font-sans text-xs text-[var(--color-brand-onyx)]/45">{formatDate(order.createdAt)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border capitalize ${STATUS_STYLE[order.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                                            {order.status}
                                        </span>
                                        <span className="font-heading font-bold text-sm text-[var(--color-brand-onyx)]">{order.total} AED</span>
                                    </div>
                                </div>
                                {/* Items */}
                                <div className="divide-y divide-[var(--color-brand-onyx)]/[0.04]">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                                            <div className="w-12 h-12 rounded-lg bg-[var(--color-brand-sand)] border border-black/5 flex-shrink-0 overflow-hidden">
                                                {item.image ? (
                                                    <Image src={item.image} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-[var(--color-brand-onyx)]/20" /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-sans text-sm font-medium text-[var(--color-brand-onyx)] line-clamp-1">{item.name}</p>
                                                <p className="font-sans text-xs text-[var(--color-brand-onyx)]/45">
                                                    {item.size ? `${item.size} · ` : ""}Qty {item.quantity}
                                                </p>
                                            </div>
                                            <span className="font-sans text-sm font-semibold text-[var(--color-brand-onyx)]/80">{(item.subtotal ?? item.price * item.quantity)} AED</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-[var(--color-brand-onyx)]/5 shadow-sm py-16 px-6 text-center">
                        <ShoppingBag className="w-10 h-10 text-[var(--color-brand-onyx)]/15 mx-auto mb-4" />
                        <p className="font-heading font-bold text-lg text-[var(--color-brand-onyx)] mb-1">No orders yet</p>
                        <p className="font-sans text-sm text-[var(--color-brand-onyx)]/55 mb-6">When you place an order, it will show up here.</p>
                        <Link href="/category/all" className="inline-block px-6 py-3 rounded-full bg-[var(--color-brand-onyx)] text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity">
                            Start Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
