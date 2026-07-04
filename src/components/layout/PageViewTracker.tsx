"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

export function PageViewTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname || pathname.startsWith("/admin")) return;
        track({ type: "page_view", path: pathname });
    }, [pathname]);

    return null;
}
