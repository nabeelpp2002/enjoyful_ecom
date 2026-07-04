"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls the window to the top on every route change. Next.js usually does this,
 * but client-side transitions that keep the same layout can retain scroll position —
 * this guarantees each new page starts at the top.
 */
export function ScrollToTop() {
    const pathname = usePathname();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);
    return null;
}
