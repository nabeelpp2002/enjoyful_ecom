"use client";

import { usePathname } from "next/navigation";
import { StickyHeader } from "./StickyHeader";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { PageViewTracker } from "./PageViewTracker";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");
    const isProductPage = pathname?.startsWith("/product/");

    const showMobileNav = !isAdmin && !isProductPage;

    return (
        <>
            {!isAdmin && <PageViewTracker />}
            {!isAdmin && <StickyHeader />}
            <main
                className="flex-1 w-full relative"
                style={showMobileNav ? {
                    paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))'
                } : undefined}
            >
                {children}
            </main>
            {!isAdmin && <Footer />}
            {showMobileNav && <MobileBottomNav />}
        </>
    );
}
