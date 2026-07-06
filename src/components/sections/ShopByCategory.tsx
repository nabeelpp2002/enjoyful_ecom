"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const categories = [
    {
        name: "Glow Collection",
        description: "Radiance from within",
        image: "/assets/category/Charcoal-Face-Wash1.avif",
        link: "/category/glow",
        bgColor: "#EFEBE7", // Soft beige
    },
    {
        name: "Daily Rituals",
        description: "Everyday self-care essentials",
        image: "/assets/category/Mix-Fruit-Moisturising-Cream-100ml21.avif",
        link: "/category/daily",
        bgColor: "#FCE8E0", // Soft peach
    },
    {
        name: "Baby Care",
        description: "Gentle for little ones.",
        image: "/assets/category/Enjoyful-baby-talc_21.avif",
        link: "/category/baby",
        bgColor: "#E8F4F8", // Soft cyan
    },
    {
        name: "Fragrances",
        description: "Signature scents & body mists",
        image: "/assets/category/Enjoyfullife_bodymist_Amberglow21.avif",
        link: "/category/fragrances",
        bgColor: "#F5E8F0", // Soft rose
    },
    {
        name: "Home Care",
        description: "Curated home fragrance & care",
        image: "/assets/category/Lavender_11June2.avif",
        link: "/category/home-care",
        bgColor: "#E8F3EC", // Soft sage
    },
];

export function ShopByCategory() {
    return (
        <section className="py-20 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
                {/* Section Header */}
                <div className="text-center mb-16 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <p className="mb-4 font-sans font-semibold text-xs md:text-sm text-[var(--color-brand-purple)] tracking-widest uppercase">
                            Shop by Category
                        </p>
                        <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-[var(--color-brand-onyx)] tracking-tight">
                            Shop Your Lifestyle
                        </h2>
                    </motion.div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                    {categories.map((category, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link
                                href={category.link}
                                className="group flex flex-col h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                            >
                                {/* Image Container - Fixed Height */}
                                <div
                                    className="relative w-full h-52 md:h-64 overflow-hidden flex-shrink-0 bg-[#f5f5f5]"
                                >
                                    <Image
                                        src={category.image}
                                        alt={category.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 20vw"
                                        className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>

                                {/* Content Container - Fixed Padding & Color */}
                                <div
                                    className="flex flex-col flex-grow justify-center px-5 md:px-6 py-6 md:py-7"
                                    style={{ backgroundColor: category.bgColor }}
                                >
                                    <h3 className="font-heading font-bold text-base md:text-lg text-[var(--color-brand-onyx)] mb-2 line-clamp-2 leading-tight">
                                        {category.name}
                                    </h3>
                                    <p className="font-sans text-xs md:text-sm text-[var(--color-brand-onyx)]/70 line-clamp-2 leading-relaxed">
                                        {category.description}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}

                    {/* View All CTA Card - Mobile Only */}
                    <motion.div
                        className="lg:hidden"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Link
                            href="/shop"
                            className="group flex flex-col h-full items-center justify-center px-4 py-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 border-[var(--color-brand-purple)]/20 hover:border-[var(--color-brand-purple)]/40 bg-white"
                        >
                            {/* Arrow Icon - Primary Focus */}
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-brand-purple)] group-hover:bg-[var(--color-brand-mustard)] transition-colors duration-300 mb-4">
                                <ArrowRight className="w-8 h-8 text-white" strokeWidth={2.5} />
                            </div>

                            {/* CTA Text */}
                            <h3 className="font-heading font-bold text-base md:text-lg text-[var(--color-brand-onyx)] text-center mb-1">
                                View All
                            </h3>
                            <p className="font-sans text-xs md:text-sm text-[var(--color-brand-onyx)]/60 text-center">
                                Browse all products
                            </p>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
