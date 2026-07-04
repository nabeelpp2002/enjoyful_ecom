"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const categories = [
    {
        name: "Baby Care",
        description: "Gentle for little ones.",
        image: "/assets/category/Baby-Lotion_small1.avif",
        link: "/category/baby",
        bgColor: "bg-[#E6F0F9]", // Light soft blue
    },
    {
        name: "Fragrances",
        description: "Signature scents & body mists",
        image: "/assets/category/Enjoyfullife_bodymist_Amberglow21.avif",
        link: "/category/fragrances",
        bgColor: "bg-[#F5EFF8]", // Light soft fragrance purple
    },
    {
        name: "Glow Collection",
        description: "Radiance from within",
        image: "/assets/category/Charcoal-Face-Wash1.avif",
        link: "/category/glow",
        bgColor: "bg-[#F0EDF6]", // Light soft purple
    },
    {
        name: "Daily Rituals",
        description: "Everyday self-care essentials",
        image: "/assets/category/Daily-Delight-Moisturing-cream2.avif",
        link: "/category/daily",
        bgColor: "bg-[#FBEBE5]", // Light soft orange
    },
    {
        name: "Home Care",
        description: "Curated home fragrance & care",
        image: "/assets/category/Lavender_11June2.avif",
        link: "/category/home-care",
        bgColor: "bg-[#EAF3EB]", // Light soft green
    },
];

export function ShopByCategory() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <p className="mb-4 font-sans font-semibold text-sm text-[var(--color-brand-purple)] tracking-widest uppercase">
                            Shop by Category
                        </p>
                        <h2 className="font-heading font-extrabold text-4xl md:text-[48px] text-[var(--color-brand-onyx)] tracking-tight">
                            Shop Your Lifestyle
                        </h2>
                    </motion.div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                    {categories.map((category, index) => (
                        <motion.div
                            key={index}
                            className={index === 4 ? "col-span-2 lg:col-span-1" : ""}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link
                                href={category.link}
                                className={`group block rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(26,26,27,0.04)] hover:-translate-y-2 transition-transform duration-300`}
                            >
                                {/* Category Image */}
                                <div className="relative overflow-hidden aspect-square flex items-center justify-center">
                                    <div className="relative w-full h-full rounded-t-[1.5rem] overflow-hidden">
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>
                                </div>

                                {/* Category Info */}
                                <div className={`px-2 sm:px-4 pb-6 sm:pb-8 pt-3 sm:pt-4 text-center ${category.bgColor} backdrop-blur-md border-t border-white/50`}>
                                    <h3 className="mb-1 sm:mb-2 font-heading font-bold text-sm sm:text-xl text-[var(--color-brand-onyx)] truncate">
                                        {category.name}
                                    </h3>
                                    <p className="font-sans font-normal text-[10px] sm:text-sm text-[var(--color-brand-onyx)]/80 line-clamp-2 leading-snug">
                                        {category.description}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
