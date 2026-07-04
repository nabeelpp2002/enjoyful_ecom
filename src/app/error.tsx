"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[var(--color-brand-sand)] flex flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="font-heading text-xl text-[var(--color-brand-onyx)]">Something went wrong.</p>
            <p className="font-sans text-sm text-[var(--color-brand-onyx)]/60 max-w-sm">
                An unexpected error occurred. Please try again or return to the homepage.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="px-6 py-2.5 rounded-full bg-[var(--color-brand-onyx)] text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="px-6 py-2.5 rounded-full border border-[var(--color-brand-onyx)]/20 text-[var(--color-brand-onyx)] font-heading font-bold text-sm hover:bg-white transition-colors"
                >
                    Go home
                </Link>
            </div>
        </div>
    );
}
