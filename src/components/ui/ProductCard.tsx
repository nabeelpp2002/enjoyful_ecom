"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { track } from "@/lib/analytics";
import type { Product } from "@/data/products";

interface ProductCardProps {
    product: Product;
    index?: number;
    /** When true, replaces wishlist toggle with a Remove button — used on /wishlist */
    wishlistMode?: boolean;
    /** Animation type: "inView" for section grids, "animate" for page mounts */
    animateType?: "inView" | "animate";
}

export const ProductCard = memo(function ProductCard({
    product,
    index = 0,
    wishlistMode = false,
    animateType = "inView",
}: ProductCardProps) {
    const { addToWishlist, removeFromWishlist, isInWishlist, showProductPrices } = useData();

    const inWishlist = isInWishlist(product.id);

    // List-view images: primary photo + a DISTINCT alternate on hover when the
    // product has more than one image (falls back to the primary so single-image
    // products still render). Deterministic on purpose — a Math.random pick would
    // differ between server and client render and break hydration.
    const PLACEHOLDER = "/assets/placeholder.png";
    const mainImage = product.images?.[1] || product.images?.[0] || PLACEHOLDER;
    const hoverImage =
        product.images?.find((img) => img && img !== mainImage) ||
        (product.hoverImage && product.hoverImage !== mainImage ? product.hoverImage : undefined) ||
        mainImage;

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        if (inWishlist) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
            track({ type: "add_to_wishlist", productId: product.id, productName: product.name });
        }
    };

    const removeWishlistItem = (e: React.MouseEvent) => {
        e.preventDefault();
        removeFromWishlist(product.id);
    };

    const animProps = animateType === "inView"
        ? {
            initial: { opacity: 0, y: 30 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.5, delay: index * 0.08 },
        }
        : {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.4, delay: index * 0.05 },
        };

    return (
        <motion.div initial="initial" whileHover="hover" className="group h-full">
            <motion.div
                {...animProps}
                className="flex flex-col h-full bg-white rounded-[1.5rem] p-1 md:p-3 shadow-sm relative"
            >
                {/* Image Area */}
                <div className="relative pt-[100%] rounded-[1.25rem] bg-gray-50 flex-shrink-0 group/image">
                    {/* Wishlist / Remove button */}
                    <div className="absolute top-4 inset-x-4 z-30 flex justify-end items-start pointer-events-none">
                        {wishlistMode ? (
                            <button
                                onClick={removeWishlistItem}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[var(--color-brand-onyx)] hover:bg-white hover:text-red-500 transition-colors shadow-sm pointer-events-auto"
                                aria-label="Remove from wishlist"
                            >
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-red-500 text-red-500" />
                            </button>
                        ) : (
                            <button
                                onClick={toggleWishlist}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[var(--color-brand-onyx)] hover:bg-white hover:text-red-500 transition-colors shadow-sm pointer-events-auto"
                                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                            >
                                <Heart className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
                            </button>
                        )}
                    </div>

                    {/* Promo / discount badges (stacked) */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-30 pointer-events-none flex flex-col items-start gap-1">
                        {showProductPrices && product.discountPct && product.discountPct > 0 ? (
                            <span className="bg-[#F6DE7F] text-[var(--color-brand-onyx)] font-bold text-[9px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm whitespace-nowrap">
                                {product.discountPct}% OFF
                            </span>
                        ) : null}
                        {showProductPrices && product.onSale && (
                            <span className="bg-red-500 text-white font-bold text-[9px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm whitespace-nowrap">
                                SALE
                            </span>
                        )}
                        {product.isFeatured && (
                            <span className="bg-[var(--color-brand-onyx)] text-white font-bold text-[9px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm whitespace-nowrap">
                                FEATURED
                            </span>
                        )}
                    </div>

                    {/* Image Link */}
                    <Link
                        href={`/product/${product.productFamily || product.slug || product.id}`}
                        onClick={() => track({ type: "product_click", productId: product.id, productName: product.name })}
                        className="block absolute inset-0 cursor-pointer overflow-hidden rounded-[1.25rem]"
                    >
                        <div className="relative w-full h-full">
                            {/* Primary Image */}
                            <Image
                                src={mainImage}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority={index < 4}
                            />
                            {/* Hover Image Slide Up */}
                            <motion.div
                                variants={{ initial: { y: "100%" }, hover: { y: 0 } }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute inset-0 z-10 bg-gray-50"
                            >
                                <Image
                                    src={hoverImage}
                                    alt={`${product.name} alternate view`}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover"
                                />
                            </motion.div>
                        </div>
                    </Link>

                    {/* Arch Action Bar */}
                    <div className="absolute -bottom-6 sm:-bottom-8 w-full z-20 flex justify-center pointer-events-none">
                        <div className="relative bg-white w-[85%] h-8 sm:h-[3.5rem] rounded-[1.5rem] flex items-center justify-around px-2 sm:px-4 pointer-events-auto ">
                            {/* View button */}
                            <Link href={`/product/${product.productFamily || product.slug || product.id}`} className="text-[var(--color-brand-onyx)] hover:text-gray-500 transition-colors p-1 sm:p-2">
                                <motion.div whileHover={{ scale: 1.05 }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] sm:w-[24px] sm:h-[24px]">
                                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </motion.div>
                            </Link>

                            {/* Right action: Add to Cart or Remove from Wishlist */}
                            {wishlistMode ? (
                                <button
                                    onClick={removeWishlistItem}
                                    className="text-red-400 hover:text-red-500 transition-colors p-1 sm:p-2"
                                >
                                    <motion.div whileHover={{ scale: 1.05 }}>
                                        <X className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                                    </motion.div>
                                </button>
                            ) : (
                                showProductPrices && <AddToCartButton product={product} className="p-1 sm:p-2" iconClassName="w-[20px] h-[20px] sm:w-[26px] sm:h-[26px]" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Info */}
                <div className="pt-8 pb-2 px-1 sm:px-2 text-center flex flex-col items-center flex-grow justify-start z-10 relative">
                    <Link href={`/product/${product.productFamily || product.slug || product.id}`} className="block group/link w-full">
                        <h3 className="font-heading font-bold text-sm sm:text-[18px] text-[var(--color-brand-onyx)] transition-colors group-hover/link:text-gray-600 leading-snug mb-1 truncate px-1">
                            {product.name}
                        </h3>
                    </Link>
                    {(product.rating > 0 || product.reviews > 0) && (
                        <div className="flex items-center gap-1 mb-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`text-[10px] leading-none ${i < Math.round(product.rating) ? "text-[var(--color-brand-mustard)]" : "text-gray-300"}`}
                                >
                                    {i < Math.round(product.rating) ? "★" : "☆"}
                                </span>
                            ))}
                            <span className="text-[10px] leading-none text-[var(--color-brand-onyx)]/40 ml-0.5">({product.reviews})</span>
                        </div>
                    )}
                    {product.size && (
                        <span className="font-sans text-[11px] sm:text-xs text-[var(--color-brand-onyx)]/40 mb-0.5">{product.size}</span>
                    )}
                    {showProductPrices && (
                        <div className="flex items-baseline gap-2 justify-center pt-1">
                            <div className="flex items-baseline gap-1">
                                <span className="font-heading font-extrabold text-[20px] sm:text-[24px] text-[var(--color-brand-onyx)] tracking-tight leading-none">
                                    {product.price}
                                </span>
                                <span className="font-sans font-semibold text-[13px] sm:text-[15px] text-[var(--color-brand-onyx)]/70 uppercase leading-none">
                                    AED
                                </span>
                            </div>
                            {product.originalPrice && product.originalPrice > product.price && (
                                <span className="font-sans font-medium text-[13px] sm:text-[15px] text-[var(--color-brand-onyx)]/30 line-through leading-none">
                                    {product.originalPrice} AED
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
});
