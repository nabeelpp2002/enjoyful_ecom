"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/data/products";

export function BestSellingProducts({ products }: { products: Product[] }) {
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
                            Customer Favorites
                        </h2>
                    </motion.div>
                </div>

                <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 pb-8 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-stretch">
                    {products.length === 0 ? (
                        <div className="w-full col-span-2 lg:col-span-4 py-12 text-center text-gray-500 font-sans">
                            No customer favorites available at the moment.
                        </div>
                    ) : (
                        products.map((product, index) => (
                            <div key={product.id} className="w-[42vw] min-w-[150px] sm:w-[35vw] md:min-w-0 md:w-auto snap-center flex-shrink-0 h-auto">
                                <ProductCard product={product} index={index} animateType="inView" />
                            </div>
                        ))
                    )}

                    {/* View All Card at end of mobile scroll */}
                    <div className="flex md:hidden w-[42vw] min-w-[150px] sm:w-[35vw] snap-center flex-shrink-0 items-stretch justify-center h-auto">
                        <Link href="/category/all" className="flex flex-col items-center justify-center w-full h-full bg-[#F4F1F8] rounded-[1.5rem] border-2 border-[var(--color-brand-purple)]/20 text-[var(--color-brand-purple)] hover:border-[var(--color-brand-purple)] hover:bg-white transition-colors group p-4 shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-[var(--color-brand-purple)] text-white shadow-md flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                            <span className="font-heading font-bold text-sm text-center text-[var(--color-brand-onyx)]">View All<br />Best Sellers</span>
                        </Link>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center md:mt-12 hidden md:block"
                >
                    <Link href="/category/all" className="inline-flex items-center justify-center px-12 py-4 rounded-full border-2 border-[var(--color-brand-purple)] bg-[var(--color-brand-purple)] text-white font-heading font-bold hover:bg-white hover:text-[var(--color-brand-purple)] shadow-[0_8px_20px_rgba(164,136,211,0.25)] transition-all duration-300">
                        Shop Best Sellers
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
