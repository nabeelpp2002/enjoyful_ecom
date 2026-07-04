import Link from "next/link";
import type { Metadata } from "next";
import { PackageX } from "lucide-react";

export const metadata: Metadata = {
    title: "Product Not Found | Enjoyful Life",
    robots: { index: false },
};

export default function ProductNotFound() {
    return (
        <div className="min-h-[70vh] bg-[#F9F5F0] flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#735697]/8 flex items-center justify-center">
                <PackageX className="w-8 h-8 text-[#735697]" />
            </div>
            <p className="font-sans text-xs font-semibold tracking-widest uppercase text-[#735697]">Product unavailable</p>
            <h1 className="font-heading font-bold text-2xl text-[#1A1A1B]">This product isn&apos;t available</h1>
            <p className="font-sans text-sm text-[#1A1A1B]/60 max-w-sm">
                The product you&apos;re looking for may have been removed, renamed, or is no longer in stock. Explore our collections to find something you&apos;ll love.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                <Link
                    href="/category/all"
                    className="px-6 py-2.5 rounded-full bg-[#1A1A1B] text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Browse all products
                </Link>
                <Link
                    href="/"
                    className="px-6 py-2.5 rounded-full bg-white border border-black/10 text-[#1A1A1B] font-heading font-bold text-sm hover:border-[#735697]/40 transition-colors"
                >
                    Back to home
                </Link>
            </div>
        </div>
    );
}
