"use client";

import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Price } from "@/components/ui/Price";

export default function Wishlist() {
    const { wishlist, removeFromWishlist, showProductPrices } = useData();

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen">
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Breadcrumb */}
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="font-heading text-[32px] text-[var(--color-brand-onyx)] tracking-tight">
                        My Wishlist
                    </h1>
                </motion.div>

                {/* Wishlist Content */}
                {wishlist.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="relative w-full max-w-xl aspect-[16/9] mx-auto overflow-hidden rounded-[2rem]">
                            <Image
                                src="/assets/emptyWishlist.png"
                                alt="Empty Wishlist"
                                fill
                                className="object-cover object-center"
                            />
                        </div>
                        <h2 className="mb-8 font-heading text-[24px] text-[var(--color-brand-onyx)] tracking-tight">
                            Your Wishlist is Empty
                        </h2>
                        <Link href="/">
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-block px-6 py-3 rounded-full bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] font-heading  text-base shadow-[0_8px_20px_rgba(244,180,73,0.2)]"
                            >
                                Start Shopping
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    /* Wishlist Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
                        {wishlist.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial="initial"
                                whileHover="hover"
                                className="group h-full"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    className="flex flex-col h-full bg-white rounded-[1.5rem] p-3 shadow-sm relative"
                                >
                                    {/* Product Image Card Container */}
                                    <div className="relative pt-[100%] rounded-[1.25rem] bg-gray-50 flex-shrink-0 group/image">
                                        {/* Top Area Overlays */}
                                        <div className="absolute top-4 inset-x-4 z-30 flex justify-end items-start pointer-events-none">
                                            {/* Wishlist Button (Remove since we are on Wishlist) */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    removeFromWishlist(product.id);
                                                }}
                                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[var(--color-brand-onyx)] hover:bg-white hover:text-red-500 transition-colors shadow-sm pointer-events-auto"
                                                aria-label="Remove from wishlist"
                                            >
                                                <Heart className="w-3 h-3 sm:w-4 sm:h-4 transition-colors fill-red-500 text-red-500" />
                                            </button>
                                        </div>

                                        {/* Image Wrapper */}
                                        <Link href={`/product/${product.id}`} className="block absolute inset-0 cursor-pointer overflow-hidden rounded-[1.25rem]">
                                            <div className="relative w-full h-full">
                                                {/* Primary Image */}
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    priority={index < 4}
                                                />

                                                {/* Secondary Hover Image (Slide Up) */}
                                                <motion.div
                                                    variants={{
                                                        initial: { y: "100%" },
                                                        hover: { y: 0 }
                                                    }}
                                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                    className="absolute inset-0 z-10 bg-gray-50"
                                                >
                                                    <Image
                                                        src={product.hoverImage}
                                                        alt={`${product.name} alternate view`}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                        className="object-cover"
                                                    />
                                                </motion.div>
                                            </div>
                                        </Link>

                                        {/* Arch Cutout Overlapping the bottom edge */}
                                        <div className="absolute -bottom-6 sm:-bottom-8 w-full z-20 flex justify-center pointer-events-none">
                                            <div className="relative bg-white w-[85%] h-8 sm:h-[3.5rem] rounded-[1.5rem] flex items-center justify-around px-2 sm:px-4 pointer-events-auto shadow-sm sm:shadow-none">
                                                {/* Left Action Button (View) */}
                                                <Link href={`/product/${product.id}`} className="text-[var(--color-brand-onyx)] hover:text-gray-500 transition-colors p-1 sm:p-2">
                                                    <motion.div whileHover={{ scale: 1.05 }}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] sm:w-[24px] sm:h-[24px]">
                                                            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                        </svg>
                                                    </motion.div>
                                                </Link>

                                                {/* Right Action Button (Remove) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        removeFromWishlist(product.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-500 transition-colors p-1 sm:p-2"
                                                >
                                                    <motion.div whileHover={{ scale: 1.05 }}>
                                                        <X className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                                                    </motion.div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Info Below Image */}
                                    <div className="pt-6 sm:pt-8 pb-2 px-1 sm:px-2 text-center bg-white flex flex-col items-center flex-grow justify-start z-10 relative">
                                        <Link href={`/product/${product.id}`} className="block group/link w-full">
                                            <h3 className="font-heading font-bold text-sm sm:text-[18px] text-[var(--color-brand-onyx)] transition-colors group-hover/link:text-gray-600 leading-snug mb-1 truncate px-1">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        {showProductPrices && (
                                            <Price
                                                amount={product.price}
                                                originalAmount={product.originalPrice}
                                                className="mt-auto justify-center"
                                                amountClassName="font-heading font-medium text-xs sm:text-base text-[var(--color-brand-onyx)]"
                                                currencyClassName="font-heading font-medium text-xs sm:text-base text-[var(--color-brand-onyx)]"
                                                originalClassName="font-heading font-medium text-[10px] sm:text-sm text-[var(--color-brand-onyx)]/30"
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
