"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Share2, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import type { Product } from "@/data/products";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductReviews } from "@/components/product/ProductReviews";
import { track } from "@/lib/analytics";
import { displayName } from "@/lib/utils";
import { Price } from "@/components/ui/Price";
import { hasValidPrice, formatPrice } from "@/lib/price";
import type { SizeVariant } from "@/lib/products-server";

interface ProductDetailClientProps {
    product: Product;
    initialSizeVariants: SizeVariant[];
    relatedProducts: Product[];
}

export default function ProductDetailClient({
    product,
    initialSizeVariants,
    relatedProducts,
}: ProductDetailClientProps) {
    const { addToWishlist, removeFromWishlist, isInWishlist, addToCart, showProductPrices } = useData();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [openAccordion, setOpenAccordion] = useState<string | null>("benefits");
    const sizeVariants = initialSizeVariants.length > 1 ? initialSizeVariants : [];
    // The currently-selected size variant (in-place — switching does NOT navigate).
    const [activeVariantId, setActiveVariantId] = useState<string | null>(product.id);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        setSelectedImage(0);
        setQuantity(1);
    }, [product.id]);

    useEffect(() => {
        track({ type: "product_view", productId: product.id, productName: product.name });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    // The currently-selected variant (defaults to the resolved product).
    const activeVariant = sizeVariants.find(v => v._id === activeVariantId) ?? null;

    // Switching size updates state IN PLACE — no navigation, no reload, no loader.
    // The URL stays on the group (family) slug so it always reflects the product, not a size.
    const selectVariant = (v: SizeVariant) => {
        setActiveVariantId(v._id);
        setSelectedImage(0);
        if (typeof window !== "undefined" && product?.productFamily) {
            window.history.replaceState(null, "", `/product/${product.productFamily}`);
        }
    };

    // Display values come from the selected variant (price/size differ per size),
    // falling back to the base product for shared fields.
    const displayPrice = activeVariant?.price ?? product.price;
    const displayOriginal = activeVariant?.originalPrice ?? product.originalPrice;
    const displayDiscount = activeVariant?.discountPct ?? product.discountPct;
    const selectedVariantSize = activeVariant?.size ?? product.size;

    // The product as it should enter the cart — with the chosen size's id, price and size.
    const cartProduct = activeVariant
        ? { ...product, id: activeVariant._id, price: displayPrice, originalPrice: displayOriginal ?? product.originalPrice, size: selectedVariantSize, slug: activeVariant.slug ?? product.slug }
        : product;
    const PLACEHOLDER = '/assets/placeholder.png';
    const productImages = (product.images && product.images.length > 0
        ? product.images
        : [product.image, product.hoverImage].filter(Boolean) as string[]
    ).filter(Boolean);
    // Always have at least the placeholder so Image.src is never empty
    if (productImages.length === 0) productImages.push(PLACEHOLDER);

    const displayImages = productImages.slice(0, 4);

    const handleWishlistToggle = () => {
        if (isInWishlist(product.id)) removeFromWishlist(product.id);
        else addToWishlist(product);
    };

    const toggleAccordion = (section: string) => {
        setOpenAccordion(openAccordion === section ? null : section);
    };

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen">
            {/* Top padding clears the fixed 70px header (StickyHeader is position:fixed,
                out of flow) so the breadcrumb sits fully below it on every screen size. */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-28 pb-40 md:pb-12">
                <Breadcrumb
                    items={[
                        { label: "Home", href: "/" },
                        { label: product.category, href: `/category/${product.category.toLowerCase()}` },
                        { label: product.name },
                    ]}
                />

                {/* Product Main Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12 lg:items-start">
                    {/* Left: Image Gallery */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-7"
                    >
                        <div className="flex gap-5 aspect-square lg:aspect-auto lg:h-[520px]">
                            {/* Vertical Thumbnails (desktop) */}
                            <div className="hidden lg:flex flex-col gap-6 w-[100px] flex-shrink-0 h-full">
                                {Array.from({ length: 4 }).map((_, index) => {
                                    const img = displayImages[index];
                                    return img ? (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`relative flex-1 w-full rounded-xl overflow-hidden bg-white transition-all ${selectedImage === index
                                                ? "ring-2 ring-[var(--color-brand-purple)] ring-offset-1 ring-offset-[var(--color-brand-sand)]"
                                                : "border border-gray-100 hover:border-[var(--color-brand-purple)]/40"}`}
                                        >
                                            <Image src={img} alt={`View ${index + 1}`} fill className="object-cover" sizes="200px" />
                                        </button>
                                    ) : (
                                        <div key={index} className="flex-1 rounded-xl" />
                                    );
                                })}
                            </div>

                            {/* Main Image */}
                            <div className="relative flex-1 rounded-[2rem] overflow-hidden bg-white shadow-sm h-full min-w-0">
                                <Image
                                    src={productImages[selectedImage] || productImages[0] || PLACEHOLDER}
                                    alt={product.name}
                                    fill
                                    priority
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                {/* Floating Actions */}
                                <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleWishlistToggle}
                                        className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-[var(--color-brand-purple)] transition-colors"
                                    >
                                        <Heart size={20} className={isInWishlist(product.id) ? "fill-current" : ""} strokeWidth={1.5} />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ title: product.name, url: window.location.href });
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                            }
                                        }}
                                        className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-[var(--color-brand-onyx)] transition-colors"
                                    >
                                        <Share2 size={20} strokeWidth={1.5} />
                                    </motion.button>
                                </div>
                                {/* Discount Badge on main image */}
                                {product.discountPct && product.discountPct > 0 && (
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="bg-[#F6DE7F] text-[var(--color-brand-onyx)] font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                                            {product.discountPct}% OFF
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Thumbnails */}
                        <div className="flex lg:hidden gap-3 mt-4 overflow-x-auto snap-x pb-2 [&::-webkit-scrollbar]:hidden">
                            {displayImages.map((img, index) => img ? (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative w-[72px] h-[72px] flex-shrink-0 snap-start rounded-xl overflow-hidden bg-white transition-all ${selectedImage === index
                                        ? "border-2 border-[var(--color-brand-purple)] shadow-sm"
                                        : "border border-[var(--color-brand-onyx)]/10"}`}
                                >
                                    <div className="absolute inset-1 rounded-lg overflow-hidden">
                                        <Image src={img} alt={`View ${index + 1}`} fill className="object-cover" sizes="72px" />
                                    </div>
                                </button>
                            ) : null)}
                        </div>
                    </motion.div>

                    {/* Right: Product Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-5 flex flex-col justify-center"
                    >
                        <p className="mb-3 font-sans text-sm text-[var(--color-brand-purple)] tracking-widest uppercase font-semibold">
                            <Link href={`/category/${product.category.toLowerCase()}`} className="hover:underline">
                                {product.category}
                            </Link>{" "}/ {product.subcategory}
                        </p>

                        <h1 className="mb-3 font-heading text-2xl lg:text-[32px] text-[var(--color-brand-onyx)] tracking-tight leading-[1.2]">
                            {product.name}
                        </h1>

                        {/* Size variant selector — shown only when productFamily has siblings */}
                        {sizeVariants.length > 0 && (
                            <div className="mb-5">
                                <p className="font-sans text-xs font-semibold text-[var(--color-brand-onyx)]/50 uppercase tracking-widest mb-2.5">
                                    Size{selectedVariantSize ? ` · ${selectedVariantSize}` : ''}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {sizeVariants.map((v) => {
                                        const isSelected = v._id === activeVariantId;
                                        return (
                                            <button
                                                key={v._id}
                                                onClick={() => selectVariant(v)}
                                                title={displayName(v.name)}
                                                className={`relative flex flex-col items-center px-4 py-2 rounded-2xl text-sm font-semibold font-sans border-2 transition-all duration-150 ${
                                                    isSelected
                                                        ? 'border-[var(--color-brand-onyx)] bg-[var(--color-brand-onyx)] text-white shadow-[0_2px_10px_rgba(26,26,27,0.18)]'
                                                        : 'border-gray-200 text-[var(--color-brand-onyx)] bg-white hover:border-[var(--color-brand-onyx)]/50 hover:bg-[var(--color-brand-sand)]'
                                                }`}
                                            >
                                                <span>{v.size || displayName(v.name)}</span>
                                                {showProductPrices && hasValidPrice(v.price) && (
                                                    <span className={`text-[11px] font-medium ${isSelected ? 'text-white/70' : 'text-[var(--color-brand-onyx)]/45'}`}>
                                                        {formatPrice(v.price)} {v.currency || 'AED'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-xl ${i < Math.floor(product.rating) ? "text-[var(--color-brand-mustard)]" : "text-gray-300"}`}>★</span>
                                    ))}
                                </div>
                                <span className="font-heading font-bold text-base text-[var(--color-brand-onyx)]">{product.rating}</span>
                            </div>
                            <span className="font-sans text-sm text-[var(--color-brand-onyx)]/60">({product.reviews} reviews)</span>
                        </div>

                        {showProductPrices && (
                            <div className="mb-4 flex items-center gap-3 flex-wrap">
                                <Price
                                    amount={displayPrice}
                                    originalAmount={displayOriginal}
                                    reserveSpace={false}
                                    amountClassName="font-heading text-2xl lg:text-3xl text-[var(--color-brand-onyx)] font-bold"
                                    currencyClassName="font-heading text-2xl lg:text-3xl text-[var(--color-brand-onyx)] font-bold"
                                    originalClassName="font-sans text-base text-gray-400"
                                />
                                {selectedVariantSize && sizeVariants.length === 0 && (
                                    <span className="font-sans text-sm text-[var(--color-brand-onyx)]/50">/ {selectedVariantSize}</span>
                                )}
                                {displayDiscount && displayDiscount > 0 ? (
                                    <span className="font-sans font-bold text-xs bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full">{displayDiscount}% OFF</span>
                                ) : null}
                                {/* Promo flags */}
                                {product.onSale && (
                                    <span className="font-sans font-bold text-xs bg-red-500 text-white px-2.5 py-0.5 rounded-full">SALE</span>
                                )}
                                {product.isFeatured && (
                                    <span className="font-sans font-bold text-xs bg-[var(--color-brand-onyx)] text-white px-2.5 py-0.5 rounded-full">FEATURED</span>
                                )}
                            </div>
                        )}

                        <p className="mb-4 font-sans text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed">{product.description}</p>

                        {showProductPrices ? (
                            <div className="flex flex-col gap-3 md:mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="font-heading font-medium text-[var(--color-brand-onyx)]">Quantity:</span>
                                    <div className="flex items-center border border-[var(--color-brand-onyx)]/10 rounded-full bg-white">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-onyx)] transition-colors">-</button>
                                        <span className="w-8 text-center font-heading font-medium text-[var(--color-brand-onyx)]">{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-onyx)] transition-colors">+</button>
                                    </div>
                                </div>

                                {/* Mobile: also available */}
                                <div className="md:hidden flex flex-col gap-2 pt-1">
                                    <p className="font-sans text-[10px] text-[var(--color-brand-onyx)]/50 font-semibold tracking-widest uppercase">Also available at</p>
                                    <div className="flex items-center gap-3">
                                        {[
                                            { name: "Amazon", src: "https://www.google.com/s2/favicons?domain=amazon.com&sz=128" },
                                            { name: "Talabat", src: "https://www.google.com/s2/favicons?domain=talabat.com&sz=128" },
                                            { name: "Carrefour", src: "https://www.google.com/s2/favicons?domain=carrefour.com&sz=128" },
                                        ].map(({ name, src }) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img key={name} src={src} alt={name} width={32} height={32} className="rounded-lg object-contain" />
                                        ))}
                                    </div>
                                </div>

                                {/* Desktop: Add to Cart + Also available */}
                                <div className="hidden md:flex flex-col gap-3 mt-5">
                                    <motion.button
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => addToCart(cartProduct, quantity)}
                                        className="w-full py-3.5 rounded-full bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] font-heading font-bold text-sm shadow-[0_8px_20px_rgba(244,180,73,0.2)] flex items-center justify-center gap-3"
                                    >
                                        <span>Add to Cart</span>
                                        {hasValidPrice(displayPrice) && (
                                            <span className="bg-[var(--color-brand-onyx)]/10 rounded-full px-3 py-0.5 text-xs font-bold">{formatPrice(displayPrice * quantity)} AED</span>
                                        )}
                                    </motion.button>
                                    {(() => {
                                        const PROVIDERS: Array<{ key: "amazon" | "talabat" | "carrefour"; name: string; favicon: string }> = [
                                            { key: "amazon", name: "Amazon", favicon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=128" },
                                            { key: "talabat", name: "Talabat", favicon: "https://www.google.com/s2/favicons?domain=talabat.com&sz=128" },
                                            { key: "carrefour", name: "Carrefour", favicon: "https://www.google.com/s2/favicons?domain=carrefour.com&sz=128" },
                                        ];
                                        const links = product.externalBuyLinks ?? {};
                                        const active = PROVIDERS.filter(p => {
                                            const l = links[p.key];
                                            return l && l.url && l.url.trim() && l.visible !== false;
                                        });
                                        if (active.length === 0) return null;
                                        return (
                                            <div className="flex flex-col gap-2">
                                                <p className="font-sans text-[10px] text-[var(--color-brand-onyx)]/50 font-semibold tracking-widest uppercase">Also available at</p>
                                                <div className="flex rounded-xl border border-[var(--color-brand-purple)]/25 overflow-hidden divide-x divide-[var(--color-brand-purple)]/15">
                                                    {active.map(p => (
                                                        <a
                                                            key={p.key}
                                                            href={links[p.key]!.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 py-2.5 flex items-center justify-center gap-2 hover:bg-[var(--color-brand-purple)]/5 transition-colors"
                                                        >
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={p.favicon} alt="" width={22} height={22} className="rounded-md object-contain flex-shrink-0" />
                                                            <span className="font-sans text-xs font-semibold text-[var(--color-brand-onyx)]/70">{p.name}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
                                <p className="font-semibold">Pricing update in progress.</p>
                                <p className="opacity-80">This product cannot be purchased right now. Please check back later.</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Product Details specs grid */}
                {(() => {
                    const specs: Array<[string, string | undefined]> = [
                        ["Size", selectedVariantSize],
                        ["Item Form", product.itemForm],
                        ["Target Use", product.targetUse],
                        ["Scent", product.scent],
                        ["Texture", product.texture],
                        ["Suitable For", product.suitableFor?.join(", ")],
                        ["Skin Type", product.skinType?.join(", ")],
                        ["Hair Type", product.hairType?.join(", ")],
                        ["Brand", product.brand],
                        ["Country of Origin", product.countryOfOrigin],
                    ].filter(([, v]) => v && !String(v).startsWith("Pending")) as Array<[string, string]>;
                    if (specs.length === 0) return null;
                    return (
                        <div className="mb-8 rounded-[1.5rem] bg-white shadow-sm border border-[var(--color-brand-onyx)]/5 p-6 md:p-8">
                            <h2 className="font-heading font-bold text-base text-[var(--color-brand-onyx)] mb-4">Product Details</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5">
                                {specs.map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-4 border-b border-[var(--color-brand-onyx)]/5 pb-2">
                                        <dt className="font-sans text-[13px] text-[var(--color-brand-onyx)]/50">{label}</dt>
                                        <dd className="font-sans text-[13px] font-medium text-[var(--color-brand-onyx)] text-right">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    );
                })()}

                {/* Full Width Accordions */}
                <div className="mb-16 md:mb-24 space-y-4">
                    {[
                        { key: "benefits", label: "Key Benefits", content: product.benefits.length > 0 ? (
                            <ul className="space-y-2">
                                {product.benefits.map((benefit, i) => (
                                    <li key={i} className="font-sans text-sm text-[var(--color-brand-onyx)]/80 pl-5 relative list-none">
                                        <span className="absolute left-0 text-[var(--color-brand-purple)] font-bold">•</span>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        ) : null },
                        { key: "active", label: "Active Ingredients", content: product.activeIngredients && product.activeIngredients.length > 0 ? (
                            <ul className="space-y-2">
                                {product.activeIngredients.map((ing, i) => (
                                    <li key={i} className="font-sans text-sm text-[var(--color-brand-onyx)]/80 pl-5 relative list-none">
                                        <span className="absolute left-0 text-[var(--color-brand-purple)] font-bold">•</span>
                                        {ing}
                                    </li>
                                ))}
                            </ul>
                        ) : null },
                        { key: "features", label: "Features", content: product.features && product.features.length > 0 ? (
                            <ul className="space-y-2">
                                {product.features.map((f, i) => (
                                    <li key={i} className="font-sans text-sm text-[var(--color-brand-onyx)]/80 pl-5 relative list-none">
                                        <span className="absolute left-0 text-[var(--color-brand-purple)] font-bold">•</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        ) : null },
                        { key: "howto", label: "How to Use", content: product.howToUse ? (
                            <div className="font-sans text-sm text-[var(--color-brand-onyx)]/80 leading-[1.7] space-y-2">
                                <p>{product.howToUse}</p>
                                {product.recommendedUsage && (
                                    <p className="text-[var(--color-brand-onyx)]/60"><strong className="text-[var(--color-brand-onyx)]/80">Recommended usage:</strong> {product.recommendedUsage}</p>
                                )}
                            </div>
                        ) : null },
                        { key: "ingredients", label: "Full Ingredients (INCI)", content: product.ingredients.length > 0 ? (
                            <p className="font-sans text-sm text-[var(--color-brand-onyx)]/80 leading-[1.7]">{product.ingredients.join(", ")}</p>
                        ) : null },
                        { key: "precautions", label: "Precautions", content: product.precautions ? (
                            <p className="font-sans text-sm text-[var(--color-brand-onyx)]/80 leading-[1.7]">{product.precautions}</p>
                        ) : null },
                    ].filter(a => a.content).map((accordion) => (
                        <div key={accordion.key} className="rounded-[1.5rem] overflow-hidden bg-white shadow-sm border border-[var(--color-brand-onyx)]/5">
                            <button
                                onClick={() => toggleAccordion(accordion.key)}
                                className="w-full px-6 py-4 flex justify-between items-center focus:outline-none"
                            >
                                <span className="font-heading font-bold text-base text-[var(--color-brand-onyx)]">{accordion.label}</span>
                                {openAccordion === accordion.key
                                    ? <ChevronUp size={20} className="text-[var(--color-brand-purple)]" />
                                    : <ChevronDown size={20} className="text-[var(--color-brand-purple)]" />}
                            </button>
                            <AnimatePresence>
                                {openAccordion === accordion.key && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="px-6 pb-5"
                                    >
                                        {accordion.content}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Brand Philosophy */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-24 rounded-[2rem] overflow-hidden bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="p-10 lg:p-16 flex flex-col justify-center">
                            <h2 className="mb-6 font-heading font-bold text-2xl lg:text-[40px] text-[var(--color-brand-onyx)] tracking-tight">Our Philosophy</h2>
                            <p className="mb-6 font-sans text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed">
                                We believe in the power of nature to transform skin. Every product is carefully crafted with premium, sustainably sourced ingredients that deliver real results.
                            </p>
                            <p className="font-sans text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed">
                                Our formulations are free from harmful chemicals, cruelty-free, and designed to work in harmony with your skin&apos;s natural processes.
                            </p>
                        </div>
                        <div className="relative min-h-[400px]">
                            <Image src="/assets/about_ingredients.png" alt="Brand philosophy" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                        </div>
                    </div>
                </motion.div>

                {/* Reviews */}
                <ProductReviews
                    productId={product.id}
                    initialAverage={product.rating}
                    initialCount={product.reviews}
                />

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h2 className="mb-12 font-heading font-bold text-2xl lg:text-[40px] text-[var(--color-brand-onyx)] tracking-tight text-center">You May Also Like</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
                            {relatedProducts.map((relatedProduct, index) => (
                                <ProductCard key={relatedProduct.id} product={relatedProduct} index={index} animateType="inView" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile Action Bar */}
                {showProductPrices && (
                    <div className="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 w-full p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40">
                        <div className="flex flex-row items-center gap-4 max-w-7xl mx-auto">
                            {hasValidPrice(displayPrice) && (
                                <div className="flex flex-col flex-shrink-0 min-w-[30%]">
                                    <span className="text-[10px] text-[var(--color-brand-onyx)]/60 font-sans uppercase tracking-widest font-semibold mb-0.5">Total</span>
                                    <span className="font-heading font-bold text-lg text-[var(--color-brand-onyx)] leading-none">{formatPrice(displayPrice * quantity)} AED</span>
                                </div>
                            )}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => addToCart(cartProduct, quantity)}
                                className="flex-[2] py-3 rounded-full text-center bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] font-heading font-bold text-sm shadow-[0_8px_20px_rgba(244,180,73,0.3)] flex items-center justify-center"
                            >
                                Add to Cart
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
