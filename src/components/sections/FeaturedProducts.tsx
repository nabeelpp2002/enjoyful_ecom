"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/ProductCardSkeleton";
import type { Product } from "@/data/products";

// Round-robin across categories so the row shows a MIX (e.g. 2 Glow, 2 Daily, …)
// instead of all items from one category.
function balanceByCategory(list: Product[], limit: number): Product[] {
    const byCat = new Map<string, Product[]>();
    for (const p of list) {
        const c = p.category || "Other";
        if (!byCat.has(c)) byCat.set(c, []);
        byCat.get(c)!.push(p);
    }
    const buckets = Array.from(byCat.values());
    const out: Product[] = [];
    let i = 0;
    while (out.length < limit && buckets.some(b => b.length > 0)) {
        const b = buckets[i % buckets.length];
        if (b.length > 0) out.push(b.shift()!);
        i++;
    }
    return out;
}

export function FeaturedProducts() {
    const { products, productsLoading } = useData();
    const featuredProducts = useMemo(() => {
        // Prioritise admin-flagged featured products, balanced across categories…
        const featured = balanceByCategory(products.filter(p => p.isFeatured), 8);
        const used = new Set(featured.map(p => p.id));
        const fill = balanceByCategory(products.filter(p => !used.has(p.id)), 8 - featured.length);
        return [...featured, ...fill];
    }, [products]);

    return (
        <section className="py-12 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-[#FBEBE5] rounded-full mix-blend-multiply blur-3xl opacity-40 z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[400px] h-[400px] bg-[#EAF3EB] rounded-full mix-blend-multiply blur-3xl opacity-40 z-0 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto md:px-8 px-4 relative z-10">
                <div className="flex flex-col items-center text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-heading font-extrabold text-2xl md:text-[48px] text-[var(--color-brand-onyx)] tracking-tight">
                            Featured Products
                        </h2>
                    </motion.div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 pb-8 items-stretch">
                    {productsLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`h-auto ${i >= 6 ? 'hidden lg:block' : ''}`}>
                                <ProductCardSkeleton />
                            </div>
                        ))
                    ) : products.length === 0 ? (
                        <div className="col-span-2 lg:col-span-4 py-12 text-center text-gray-500 font-sans">
                            No featured products available at the moment.
                        </div>
                    ) : (
                        featuredProducts.map((product, index) => (
                            <div key={product.id} className={`h-auto ${index >= 6 ? 'hidden lg:block' : ''}`}>
                                <ProductCard product={product} index={index} animateType="inView" />
                            </div>
                        ))
                    )}
                </div>

                {/* View All Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex justify-center w-full mt-8 md:mt-16"
                >
                    <Link href="/category/all" className="inline-flex items-center justify-center px-12 py-4 rounded-full border-2 border-[var(--color-brand-onyx)] font-heading font-bold text-[var(--color-brand-onyx)] hover:bg-[var(--color-brand-onyx)] hover:text-white transition-all duration-300">
                        View All Products
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
