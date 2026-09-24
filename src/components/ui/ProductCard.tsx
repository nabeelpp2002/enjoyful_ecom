"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Price } from "@/components/ui/Price";
import { track } from "@/lib/analytics";
import type { Product } from "@/data/products";

interface ProductCardProps {
    product: Product;
    index?: number;
    wishlistMode?: boolean;
    animateType?: "inView" | "animate";
}

export const ProductCard = memo(function ProductCard({ product, index = 0, wishlistMode = false, animateType = "inView" }: ProductCardProps) {
    const { cart, addToCart, updateCartQuantity, addToWishlist, removeFromWishlist, isInWishlist, showProductPrices } = useData();
    const [added, setAdded] = useState(false);
    const inWishlist = isInWishlist(product.id);
    const cartQuantity = cart.find(item => item.product.id === product.id)?.quantity ?? 0;
    const availableSizes = [...new Set((product.availableSizes ?? []).map(size => size.trim()).filter(Boolean))];
    const hasSizeVariants = (product.variantCount ?? availableSizes.length) > 1 && availableSizes.length > 1;
    const listingSizeLabel = hasSizeVariants ? availableSizes.join(" · ") : product.size;
    const mainImage = product.images?.[1] || product.images?.[0] || "/assets/placeholder.png";
    const hoverImage = product.images?.find(image => image && image !== mainImage) || (product.hoverImage && product.hoverImage !== mainImage ? product.hoverImage : undefined) || mainImage;
    const productHref = `/product/${product.productFamily || product.slug || product.id}`;
    const badge = product.isFeatured ? "FEATURED" : showProductPrices && product.onSale ? "SALE" : showProductPrices && product.discountPct && product.discountPct > 0 ? `${product.discountPct}% OFF` : null;

    const toggleWishlist = (event: React.MouseEvent) => {
        event.preventDefault();
        if (inWishlist) removeFromWishlist(product.id);
        else {
            addToWishlist(product);
            track({ type: "add_to_wishlist", productId: product.id, productName: product.name });
        }
    };
    const removeWishlistItem = (event: React.MouseEvent) => {
        event.preventDefault();
        removeFromWishlist(product.id);
    };
    const handleAddToCart = (event: React.MouseEvent) => {
        event.preventDefault();
        addToCart(product, 1);
        track({ type: "add_to_cart", productId: product.id, productName: product.name, metadata: { quantity: 1, price: product.price } });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
    };
    const changeQuantity = (change: number) => {
        if (cartQuantity > 0) updateCartQuantity(product.id, Math.max(1, cartQuantity + change));
    };
    const animProps = animateType === "inView"
        ? { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4, delay: index * 0.05 } }
        : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: index * 0.04 } };

    return (
        <motion.article {...animProps} initial="initial" whileHover="hover" className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_10px_28px_rgba(31,25,18,0.09)] sm:rounded-[1.5rem]">
            <div className="relative aspect-[1.08/1] min-h-0 overflow-hidden bg-[#f2eee8]">
                <Link href={productHref} onClick={() => track({ type: "product_click", productId: product.id, productName: product.name })} className="absolute inset-0">
                    <Image src={mainImage} alt={product.name} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" priority={index < 4} />
                    {hoverImage !== mainImage && <motion.div variants={{ initial: { opacity: 0 }, hover: { opacity: 1 } }} transition={{ duration: 0.35 }} className="absolute inset-0 hidden bg-[#f2eee8] sm:block"><Image src={hoverImage} alt={`${product.name} alternate view`} fill sizes="25vw" className="object-cover" /></motion.div>}
                </Link>
                {badge && <span className={`editorial-ui absolute left-3 top-3 z-20 rounded-full px-3 py-1 text-[8px] font-semibold tracking-wide sm:left-4 sm:top-4 sm:px-4 sm:py-1.5 sm:text-[10px] ${product.isFeatured ? "bg-[var(--color-brand-mustard)]/50 text-[var(--color-brand-onyx)] backdrop-blur-[4px] shadow-sm" : "bg-[#a9342f] text-white"}`}>{badge}</span>}
                <button type="button" onClick={wishlistMode ? removeWishlistItem : toggleWishlist} className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--color-brand-onyx)] shadow-sm transition-transform hover:scale-105 sm:right-4 sm:top-4 sm:h-10 sm:w-10" aria-label={wishlistMode ? "Remove from wishlist" : inWishlist ? "Remove from wishlist" : "Add to wishlist"}>
                    {wishlistMode ? <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />}
                </button>
            </div>

            <div className="relative z-10 -mt-5 flex flex-1 flex-col rounded-t-[1.55rem] bg-white px-3 pb-3 pt-3.5 sm:-mt-7 sm:rounded-t-[2rem] sm:px-4 sm:pb-4 sm:pt-5">
                <Link href={productHref} className="group/link block min-w-0"><h3 className="editorial-subtitle truncate text-[13px] font-semibold leading-tight text-[var(--color-brand-onyx)] transition-colors group-hover/link:text-[var(--color-brand-purple)] sm:text-base">{product.name}</h3></Link>
                <p className="editorial-body mt-1 truncate text-[9px] leading-tight text-[var(--color-brand-onyx)]/50 sm:text-xs">{product.tagline || product.description}</p>
                <div className="mt-2 flex items-end justify-between gap-2 sm:mt-2.5">
                    {listingSizeLabel ? <span className="editorial-body max-w-[52%] truncate rounded-full bg-[#f3eee6] px-2.5 py-1 text-[9px] text-[var(--color-brand-onyx)]/65 sm:px-4 sm:py-1.5 sm:text-xs">{listingSizeLabel}</span> : <span />}
                    {showProductPrices && <Price amount={product.price} originalAmount={product.originalPrice} prefix={hasSizeVariants ? "From" : undefined} className="ml-auto flex-wrap justify-end gap-x-1" prefixClassName="editorial-body text-[7px] text-black/50 sm:text-[9px]" amountClassName="editorial-number text-base font-semibold leading-none text-[var(--color-brand-onyx)] sm:text-xl" currencyClassName="editorial-subtitle text-[8px] uppercase text-black/45 sm:text-[10px]" originalClassName="editorial-body text-[8px] text-black/30 sm:text-[10px]" />}
                </div>
                {showProductPrices && <div className="mt-2.5 flex items-stretch gap-2 sm:mt-3">
                    {cartQuantity > 0 && <div className="flex h-8 w-[42%] min-w-0 items-center rounded-full border border-black/10 px-0.5 sm:h-10 sm:px-1">
                        <button type="button" onClick={() => changeQuantity(-1)} className="flex h-full flex-1 items-center justify-center text-black/45" aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button>
                        <span className="editorial-ui min-w-3 text-center text-[10px] sm:text-xs">{cartQuantity}</span>
                        <button type="button" onClick={() => changeQuantity(1)} className="flex h-full flex-1 items-center justify-center" aria-label="Increase quantity"><Plus className="h-3 w-3" /></button>
                    </div>}
                    {wishlistMode
                        ? <button type="button" onClick={removeWishlistItem} className="editorial-ui flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-[var(--color-brand-purple)] px-2 text-[9px] font-medium text-white transition-opacity hover:opacity-90 sm:h-10 sm:text-xs"><X className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Remove</button>
                        : <button type="button" onClick={handleAddToCart} className={`editorial-ui flex h-8 flex-1 items-center justify-center gap-1 rounded-full px-1.5 text-[9px] font-medium text-white transition-opacity sm:h-10 sm:px-2 sm:text-xs ${added ? "bg-emerald-600" : "bg-[var(--color-brand-purple)] hover:opacity-90"}`}><ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span className="truncate">{added ? "Added" : "Add to Cart"}</span></button>}
                </div>}
            </div>
        </motion.article>
    );
});
