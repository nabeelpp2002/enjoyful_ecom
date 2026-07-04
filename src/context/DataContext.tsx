"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/data/products";
import { displayName, pickProductImages } from "@/lib/utils";

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface AuthUser {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface DataContextType {
    showProductPrices: boolean;
    products: Product[];
    productsLoading: boolean;
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;

    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    isInCart: (productId: string) => boolean;
    getCartTotal: () => number;
    getCartCount: () => number;
    clearCart: () => void;

    isAuthenticated: boolean;
    user: AuthUser | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
    requestOtp: (email: string) => Promise<{ ttlMinutes: number }>;
    verifyOtp: (email: string, code: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function normalizeApiProduct(p: Record<string, unknown>): Product {
    const category = typeof p.category === 'object' && p.category !== null
        ? (p.category as { name: string }).name
        : (p.category as string) ?? '';
    const imagesRaw = p.images as Array<{ url: string } | string> | undefined;
    const imageUrls: string[] = (imagesRaw ?? []).map(img =>
        typeof img === 'string' ? img : img.url
    ).filter(Boolean);
    // Prefer the "*21" thumbnail as the primary; reuse the single image for hover.
    const { image, hoverImage, images } = pickProductImages(
        imageUrls.length > 0
            ? imageUrls
            : [p.image as string, p.hoverImage as string].filter(Boolean) as string[],
    );
    return {
        id: ((p._id ?? p.id) as string),
        slug: (p.slug as string) ?? undefined,
        name: displayName(p.name as string, p.brand as string),
        category,
        subcategory: (p.subcategory as string) ?? '',
        price: p.price as number,
        originalPrice: (p.originalPrice as number) ?? undefined,
        discountPct: (p.discountPct as number) ?? undefined,
        image,
        hoverImage,
        images: images.length > 0 ? images : undefined,
        rating: (p.rating as number) ?? 0,
        reviews: (p.reviews as number) ?? 0,
        description: (p.description as string) ?? '',
        benefits: (p.benefits as string[]) ?? [],
        ingredients: (p.ingredients as string[]) ?? [],
        howToUse: (p.howToUse as string) ?? '',
        skinType: (p.skinType as string[]) ?? [],
        productType: (p.productType as string) ?? '',
        tagline: (p.tagline as string) ?? undefined,
        brand: (p.brand as string) ?? undefined,
        highlights: (p.highlights as string[]) ?? undefined,
        suitableFor: (p.suitableFor as string[]) ?? undefined,
        isHidden: (p.isHidden as boolean) ?? false,
        isFeatured: (p.isFeatured as boolean) ?? false,
        onSale: (p.onSale as boolean) ?? false,
        bestDeal: (p.bestDeal as boolean) ?? false,
        externalBuyLinks: (p.externalBuyLinks as Product['externalBuyLinks']) ?? undefined,
        size: (p.size as string) ?? undefined,
        productCode: (p.productCode as string) ?? undefined,
        productFamily: (p.productFamily as string) ?? undefined,
        variantCount: (p.variantCount as number) ?? undefined,
        activeIngredients: (p.activeIngredients as string[]) ?? undefined,
        features: (p.features as string[]) ?? undefined,
        scent: (p.scent as string) ?? undefined,
        texture: (p.texture as string) ?? undefined,
        targetUse: (p.targetUse as string) ?? undefined,
        itemForm: (p.itemForm as string) ?? undefined,
        recommendedUsage: (p.recommendedUsage as string) ?? undefined,
        precautions: (p.precautions as string) ?? undefined,
        hairType: (p.hairType as string[]) ?? undefined,
        countryOfOrigin: (p.countryOfOrigin as string) ?? undefined,
    };
}

export function DataProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [showProductPrices, setShowProductPrices] = useState(true);

    // Restore localStorage and check auth session on mount
    useEffect(() => {
        setIsMounted(true);

        const savedWishlist = localStorage.getItem("enjoyful-wishlist");
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

        const savedCart = localStorage.getItem("enjoyful-cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        // Fetch products from API
        fetch('/api/products?limit=100')
            .then(r => {
                if (!r.ok) throw new Error("API request failed");
                return r.json();
            })
            .then(({ data }) => {
                if (Array.isArray(data)) {
                    setProducts(data.map(normalizeApiProduct));
                } else {
                    setProducts([]);
                }
            })
            .catch(() => {
                setProducts([]);
            })
            .finally(() => setProductsLoading(false));

        // Restore auth session
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(res => {
                if (res?.data) {
                    setIsAuthenticated(true);
                    setUser(res.data as AuthUser);
                }
            })
            .catch(() => {});

        // Fetch global settings (also called on tab focus so storefront reflects latest setting)
        const fetchSettings = () => {
            fetch(`/api/settings?_t=${Date.now()}`)
                .then(r => r.ok ? r.json() : null)
                .then(res => {
                    // NestJS wraps responses in { success, data } — unwrap it
                    const data = res?.data ?? res;
                    if (data && typeof data.showProductPrices === 'boolean') {
                        setShowProductPrices(data.showProductPrices);
                    }
                })
                .catch(() => {});
        };
        fetchSettings();

        // Re-sync when the user switches back to this tab (e.g. after admin changes the setting)
        const handleFocus = () => fetchSettings();
        document.addEventListener('visibilitychange', handleFocus);
        return () => document.removeEventListener('visibilitychange', handleFocus);
    }, []);

    useEffect(() => {
        if (isMounted) localStorage.setItem("enjoyful-wishlist", JSON.stringify(wishlist));
    }, [wishlist, isMounted]);

    useEffect(() => {
        if (isMounted) localStorage.setItem("enjoyful-cart", JSON.stringify(cart));
    }, [cart, isMounted]);

    // Wishlist
    const addToWishlist = (product: Product) => {
        setWishlist(prev => prev.some(p => p.id === product.id) ? prev : [...prev, product]);
        if (isAuthenticated) {
            fetch(`/api/wishlist/${product.id}`, { method: 'POST' }).catch(() => {});
        }
    };

    const removeFromWishlist = (productId: string) => {
        setWishlist(prev => prev.filter(p => p.id !== productId));
        if (isAuthenticated) {
            fetch(`/api/wishlist/${productId}`, { method: 'DELETE' }).catch(() => {});
        }
    };

    const isInWishlist = (productId: string) => wishlist.some(p => p.id === productId);

    // Cart
    const addToCart = (product: Product, quantity: number = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item);
            }
            return [...prev, { product, quantity }];
        });
        if (isAuthenticated) {
            fetch('/api/cart/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity }),
            }).catch(() => {});
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
        if (isAuthenticated) {
            fetch(`/api/cart/items/${productId}`, { method: 'DELETE' }).catch(() => {});
        }
    };

    const updateCartQuantity = (productId: string, quantity: number) => {
        setCart(prev => prev.map(item => item.product.id === productId
            ? { ...item, quantity: Math.max(1, quantity) }
            : item));
        if (isAuthenticated) {
            fetch(`/api/cart/items/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: Math.max(1, quantity) }),
            }).catch(() => {});
        }
    };

    const isInCart = (productId: string) => cart.some(item => item.product.id === productId);

    const getCartTotal = () => cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

    const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

    const clearCart = () => setCart([]);

    // Auth
    const login = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message ?? 'Login failed');

        setIsAuthenticated(true);
        setUser(data.data as AuthUser);

        // Merge guest cart to server
        const localCart = cart;
        if (localCart.length > 0) {
            fetch('/api/cart/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: localCart.map(i => ({ productId: i.product.id, quantity: i.quantity })) }),
            }).catch(() => {});
        }
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        setIsAuthenticated(false);
        setUser(null);
    };

    const register = async (data: { email: string; password: string; firstName: string; lastName: string }) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? 'Registration failed');

        setIsAuthenticated(true);
        setUser(body.data as AuthUser);
    };

    const mergeGuestCart = () => {
        const localCart = cart;
        if (localCart.length > 0) {
            fetch('/api/cart/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: localCart.map(i => ({ productId: i.product.id, quantity: i.quantity })) }),
            }).catch(() => {});
        }
    };

    const requestOtp = async (email: string) => {
        const res = await fetch('/api/auth/otp/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? 'Could not send code');
        return { ttlMinutes: body?.data?.ttlMinutes ?? 10 };
    };

    const verifyOtp = async (email: string, code: string) => {
        const res = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? 'Invalid code');
        setIsAuthenticated(true);
        setUser(body.data.user as AuthUser);
        mergeGuestCart();
    };

    const loginWithGoogle = async (idToken: string) => {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? 'Google sign-in failed');
        setIsAuthenticated(true);
        setUser(body.data.user as AuthUser);
        mergeGuestCart();
    };

    return (
        <DataContext.Provider value={{
            showProductPrices, products, productsLoading,
            wishlist, addToWishlist, removeFromWishlist, isInWishlist,
            cart, addToCart, removeFromCart, updateCartQuantity, isInCart, getCartTotal, getCartCount, clearCart,
            isAuthenticated, user, login, logout, register,
            requestOtp, verifyOtp, loginWithGoogle,
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) throw new Error("useData must be used within a DataProvider");
    return context;
}
