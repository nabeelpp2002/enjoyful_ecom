"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const categories = [
    {
        name: "Baby Care",
        description: "Gentle products for your little ones",
        image: "/assets/baby-diaper.jpg",
        link: "/category/baby",
    },
    {
        name: "Home Care",
        description: "Transform your living space",
        image: "/assets/home-essentials.png",
        link: "/category/home-care",
    },
    {
        name: "Glow Collection",
        description: "Radiance from within",
        image: "/assets/placeholder.png",
        link: "/category/glow",
    },
    {
        name: "Daily Rituals",
        description: "Everyday self-care essentials",
        image: "/assets/baby-wipes.jpg",
        link: "/category/daily",
    },
];

export function CategoryShowcase() {
    return (
        <section className="py-24 bg-[var(--color-brand-sand)]">
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
                            Explore by Category
                        </p>
                        <h2 className="font-heading font-extrabold text-4xl md:text-[48px] text-[var(--color-brand-onyx)] tracking-tight">
                            Shop Your Lifestyle
                        </h2>
                    </motion.div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                                className="group block rounded-2xl overflow-hidden bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)] hover:-translate-y-2 transition-transform duration-300"
                            >
                                {/* Category Image */}
                                <div className="relative overflow-hidden aspect-square">
                                    <Image
                                        src={category.image}
                                        alt={category.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>

                                {/* Category Info */}
                                <div className="p-6 text-center">
                                    <h3 className="mb-2 font-heading font-bold text-xl text-[var(--color-brand-onyx)]">
                                        {category.name}
                                    </h3>
                                    <p className="font-sans font-normal text-sm text-[var(--color-brand-onyx)]/70">
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
