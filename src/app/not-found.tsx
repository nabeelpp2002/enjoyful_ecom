import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page Not Found | Enjoyful Life",
    robots: { index: false },
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F9F5F0] flex flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="font-sans text-xs font-semibold tracking-widest uppercase text-[#735697]">404</p>
            <h1 className="font-heading font-bold text-2xl text-[#1A1A1B]">Page not found</h1>
            <p className="font-sans text-sm text-[#1A1A1B]/60 max-w-sm">
                We couldn&apos;t find the page you were looking for. It may have moved or been removed.
            </p>
            <Link
                href="/"
                className="px-6 py-2.5 rounded-full bg-[#1A1A1B] text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity"
            >
                Back to shop
            </Link>
        </div>
    );
}
