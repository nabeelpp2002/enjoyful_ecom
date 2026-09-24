"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/ui/ProductCard";

export default function Wishlist() {
    const { wishlist } = useData();

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="editorial-title display-md text-[32px] text-[var(--color-brand-onyx)] tracking-tight">
                        My Wishlist
                    </h1>
                </motion.div>

                {wishlist.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex w-full flex-col items-center text-center"
                    >
                        <div className="relative mx-auto aspect-square w-60 self-center overflow-hidden sm:aspect-[16/9] sm:w-full sm:max-w-xl sm:rounded-[2rem]">
                            <Image
                                src="/assets/emptyWishlist.png"
                                alt="Empty Wishlist"
                                fill
                                sizes="(max-width: 639px) 240px, 576px"
                                className="object-contain object-center sm:object-cover"
                            />
                        </div>
                        <h2 className="mb-8 editorial-section-heading text-[24px] text-[var(--color-brand-onyx)] tracking-tight">
                            Your Wishlist is Empty
                        </h2>
                        <Link href="/">
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-block px-6 py-3 rounded-full bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] editorial-heading text-base shadow-[0_8px_20px_rgba(244,180,73,0.2)]"
                            >
                                Start Shopping
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
                        {wishlist.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={index}
                                wishlistMode
                                animateType="animate"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
