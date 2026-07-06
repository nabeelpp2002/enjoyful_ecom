"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Heart, X, ArrowLeft } from "lucide-react";
import { MegaMenu } from "./MegaMenu";
import { AuthModal } from "./AuthModal";
import { AnimatePresence, motion } from "framer-motion";
import { useData } from "@/context/DataContext";

// Subcategory names MUST match the `subcategory` values seeded on products
// (see seed-from-excel.js) so the ?subcategory= filter resolves to real items.
const menuCategories = [
    {
        name: "Shop All",
        subcategories: ["Best Sellers", "New Arrivals", "Sale"],
        imageUrl: "/assets/shopalllll.png",
        themeColor: "bg-white",
    },
    {
        name: "Glow",
        subcategories: ["Face Wash", "Face Scrub", "Face Mask", "Sunscreen", "Aloe Vera Gel", "Toner"],
        imageUrl: "/assets/placeholder.png",
        themeColor: "bg-[#F0EDF6]",
    },
    {
        name: "Daily",
        subcategories: ["Body Lotion", "Body Cream", "Shower Gel", "Shampoo", "Hair Oil", "Hair Serum", "Intimate Wash"],
        imageUrl: "/assets/category/Mix-Fruit-Moisturising-Cream-100ml21.avif",
        themeColor: "bg-[#FBEBE5]",
    },
    {
        name: "Baby",
        subcategories: ["Baby Lotion", "Baby Wash", "Baby Talc", "Baby Rash Cream", "Baby Soap"],
        imageUrl: "/assets/category/Enjoyful-baby-talc_21.avif",
        themeColor: "bg-[#E6F0F9]",
    },
    {
        name: "Fragrances",
        subcategories: ["Perfume", "Body Mist", "Roll On", "Deo Stick"],
        imageUrl: "/assets/category/Enjoyfullife_bodymist_Amberglow21.avif",
        themeColor: "bg-[#F5EFF8]",
    },
    {
        name: "Home Care",
        subcategories: ["Kitchen Care", "Bathroom Care", "Floor & Surface Care", "Hand Care", "Laundry Care"],
        imageUrl: "/assets/category/Lavender_11June2.avif",
        themeColor: "bg-[#EAF3EB]",
    },
];

export function StickyHeader() {
    const { cart, wishlist, isAuthenticated, user, logout } = useData();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const isHomePage = pathname === "/";
    // Detail pages that get a mobile "back" button in the header (left of the logo).
    const isProductPage = pathname?.startsWith("/product/") ?? false;

    // Count in-app navigations since the last full page load. The header (in the
    // persistent layout) stays mounted across client-side route changes, so this
    // ref survives them and resets only on a real reload. We need it because
    // `window.history.length` is unreliable — a freshly opened tab (e.g. a shared
    // product link) starts at length 2 thanks to the initial about:blank entry,
    // which would make router.back() navigate to a blank page. The App Router also
    // doesn't expose a history index. Counting our own route changes is reliable.
    const navCountRef = useRef(0);
    const lastPathRef = useRef(pathname);
    useEffect(() => {
        if (lastPathRef.current !== pathname) {
            navCountRef.current += 1;
            lastPathRef.current = pathname;
        }
    }, [pathname]);

    // Go back to the previous in-app page when there is one; otherwise (opened
    // straight from a shared link with no prior history) fall back to the listing.
    const handleBack = () => {
        if (navCountRef.current > 0) router.back();
        else router.push("/category/all");
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => {
                const isDesktop = window.matchMedia("(min-width: 768px)").matches;
                (isDesktop ? searchInputRef.current : mobileSearchInputRef.current)?.focus();
            }, 100);
        } else {
            setSearchQuery("");
        }
    }, [isSearchOpen]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const isFirstType = searchQuery === "" && val !== "";
        setSearchQuery(val);

        const targetUrl = val.trim() ? `/category/all?q=${encodeURIComponent(val.trim())}` : `/category/all`;

        if (isFirstType && !pathname.includes('/category/all')) {
            router.push(targetUrl);
        } else {
            router.replace(targetUrl);
        }
    };

    const isTransparent = false;

    // Determine if the header should act floating (only on home page when not scrolled)
    const shouldFloat = isHomePage && !scrolled;

    // Set dynamic classes based on scroll state
    const headerBg = !shouldFloat ? "bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-white shadow-[0_4px_30px_rgba(26,26,27,0.06)]";
    const headerWrapperClasses = !shouldFloat
        ? "top-0 inset-x-0 w-full rounded-none"
        : "top-4 inset-x-4 max-w-7xl mx-auto rounded-[1rem] border border-gray-100";

    const textColor = "text-[var(--color-brand-onyx)] font-sans font-medium text-sm";
    const iconColor = "text-[var(--color-brand-onyx)] hover:text-[var(--color-brand-purple)] bg-transparent";
    const logoSrc = "/assets/Enjoyful_logo_transparent.png";

    return (
        <>
            <header className={`fixed z-40 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${headerBg} ${headerWrapperClasses}`}>
                <div className={`px-4 md:px-4 flex items-center justify-between transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${!shouldFloat ? 'h-[70px] max-w-7xl mx-auto w-full' : 'h-[70px] lg:h-[80px]'}`}>

                    {/* Left: optional mobile back button + logo */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {isProductPage && (
                            <button
                                type="button"
                                onClick={handleBack}
                                aria-label="Go back"
                                className={`md:hidden -ml-2 ${iconColor} transition-transform duration-200 active:scale-95 flex items-center justify-center p-2`}
                            >
                                <ArrowLeft size={24} strokeWidth={1.5} />
                            </button>
                        )}
                        <Link href="/" className="flex-shrink-0 transition-opacity hover:opacity-80 flex items-center">
                            <Image
                                src={logoSrc}
                                alt="enJoyful Life Logo"
                                width={240}
                                height={80}
                                className={`h-16 lg:h-26 w-auto object-contain transition-all duration-300 ${isTransparent ? 'brightness-0 invert' : ''}`}
                                priority
                            />
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation or Search */}
                    <div className="hidden md:flex flex-1 items-center justify-center relative h-full px-8">
                        <AnimatePresence mode="wait">
                            {isSearchOpen ? (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, width: "0%" }}
                                    animate={{ opacity: 1, width: "100%" }}
                                    exit={{ opacity: 0, width: "0%" }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="w-full max-w-2xl relative flex items-center bg-gray-50 rounded-full px-4 border border-gray-100/50 shadow-inner"
                                >
                                    <Search size={20} className="text-gray-400 flex-shrink-0" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search for products, brands..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="w-full bg-transparent border-none outline-none pl-3 pr-10 py-3 text-base text-[var(--color-brand-onyx)] placeholder-gray-400"
                                    />
                                    <button
                                        onClick={() => setIsSearchOpen(false)}
                                        className="absolute right-3 p-1.5 rounded-full text-gray-400 hover:text-[var(--color-brand-onyx)] hover:bg-gray-200 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.nav
                                    key="nav"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center gap-10 h-full"
                                >
                                    {menuCategories.map((category) => (
                                        <div
                                            key={category.name}
                                            className="h-full flex items-center"
                                            onMouseEnter={() => setActiveMenu(category.name)}
                                            onMouseLeave={() => setActiveMenu(null)}
                                        >
                                            <Link
                                                href={`/category/${category.name.toLowerCase()}`}
                                                className={`${textColor} transition-colors duration-200 flex items-center gap-1 hover:text-[var(--color-brand-purple)] ${activeMenu === category.name
                                                    ? "text-[var(--color-brand-purple)]"
                                                    : ""
                                                    }`}
                                            >
                                                {category.name}
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 mt-[2px]"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </Link>

                                            <div className="fixed left-0 w-full" style={{ top: scrolled ? '70px' : '96px' }}>
                                                <MegaMenu
                                                    category={category.name}
                                                    subcategories={category.subcategories}
                                                    imageUrl={category.imageUrl}
                                                    isOpen={activeMenu === category.name}
                                                    themeColor={category.themeColor}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </motion.nav>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Icons */}
                    <div className="flex items-center gap-3">
                        {!isSearchOpen && (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className={`${iconColor} transition-transform duration-200 active:scale-95 flex items-center justify-center p-2`}
                            >
                                <Search size={22} strokeWidth={1.5} />
                            </button>
                        )}
                        <Link href="/wishlist" className={`${iconColor} relative transition-transform duration-200 active:scale-95 flex items-center justify-center p-2 border-l border-gray-200/60 pl-3`}>
                            <Heart size={20} className={`${wishlist.length > 0 ? "fill-[var(--color-brand-purple)] text-[var(--color-brand-purple)]" : ""}`} strokeWidth={1.5} />
                            {wishlist.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>}
                        </Link>
                        {isAuthenticated ? (
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setUserMenuOpen(prev => !prev)}
                                    className={`${iconColor} transition-transform duration-200 active:scale-95 flex items-center justify-center gap-1.5 p-2 border-l border-gray-200/60 pl-3`}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    <span className="hidden md:inline text-sm font-medium max-w-[80px] truncate">{user?.firstName}</span>
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--color-brand-purple)]">
                                            View Profile
                                        </Link>
                                        <Link href="/orders" onClick={() => setUserMenuOpen(false)}
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--color-brand-purple)]">
                                            My Orders
                                        </Link>
                                        <button onClick={() => { logout(); setUserMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setAuthModalOpen(true)}
                                className={`${iconColor} transition-transform duration-200 active:scale-95 hidden md:flex items-center justify-center p-2 border-l border-gray-200/60 pl-3`}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </button>
                        )}
                        <Link href="/cart" className={`relative ${iconColor} transition-transform duration-200 active:scale-95 hidden md:flex items-center justify-center p-2`}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                            {cart.length > 0 && <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[var(--color-brand-purple)] flex items-center justify-center text-[10px] text-white font-bold">{cart.length}</span>}
                        </Link>
                    </div>
                </div>

                {/* Mobile search bar — the desktop search input is `hidden md:flex`,
                    so on phones we drop a full-width bar below the header when open. */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            key="mobile-search"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="md:hidden overflow-hidden border-t border-gray-100"
                        >
                            <div className="px-4 py-3">
                                <div className="flex items-center bg-gray-50 rounded-full px-4 border border-gray-100/50 shadow-inner">
                                    <Search size={20} className="text-gray-400 flex-shrink-0" />
                                    <input
                                        ref={mobileSearchInputRef}
                                        type="text"
                                        inputMode="search"
                                        enterKeyHint="search"
                                        placeholder="Search for products, brands..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="w-full bg-transparent border-none outline-none pl-3 pr-2 py-2.5 text-base text-[var(--color-brand-onyx)] placeholder-gray-400"
                                    />
                                    <button
                                        onClick={() => setIsSearchOpen(false)}
                                        aria-label="Close search"
                                        className="p-1.5 rounded-full text-gray-400 hover:text-[var(--color-brand-onyx)] hover:bg-gray-200 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
}
