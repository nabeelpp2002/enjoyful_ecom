"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Package, ShoppingCart, ImagePlay, Image as ImageIcon, Users, MessageSquare, MessagesSquare, LogOut, Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
    { href: "/admin/feedback", label: "Feedback", icon: MessagesSquare },
    { href: "/admin/carousel", label: "Carousel", icon: ImagePlay },
    { href: "/admin/banners", label: "Banners", icon: ImageIcon },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
    };

    const isActive = (item: typeof navItems[0]) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href);

    if (pathname === "/admin/login") return <>{children}</>;

    return (
        <div className="min-h-screen bg-[#F9F5F0] flex">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#1A1A1B]/20 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-black/5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <div className="h-16 flex items-center justify-between px-5 border-b border-black/5">
                    <Image
                        src="/assets/Enjoyful_logo_transparent.png"
                        alt="enJoyful"
                        width={110}
                        height={32}
                        priority
                        style={{ width: 110, height: "auto" }}
                        className="object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-[#1A1A1B]/30 hover:text-[#1A1A1B]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-5 space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                    ? "bg-[#735697]/10 text-[#735697]"
                                    : "text-[#1A1A1B]/50 hover:text-[#1A1A1B] hover:bg-[#1A1A1B]/5"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#735697]" : "text-[#1A1A1B]/30"}`} />
                                {item.label}
                                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#735697]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-black/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-[#1A1A1B]/40 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
                <header className="h-14 border-b border-black/5 flex items-center px-5 sticky top-0 bg-[#F9F5F0]/90 backdrop-blur-xl z-10">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-[#1A1A1B]/40 hover:text-[#1A1A1B] mr-3"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="ml-auto">
                        <div className="w-8 h-8 rounded-full bg-[#735697]/15 flex items-center justify-center">
                            <span className="text-[#735697] text-xs font-bold">A</span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-5 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
