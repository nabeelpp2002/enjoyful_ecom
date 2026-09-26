"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const categories = [
    {
        name: "Glow",
        image: "/assets/category/Charcoal-Face-Wash1.avif",
        link: "/category/glow",
        bgColor: "#EFEBE7", // Soft beige
    },
    {
        name: "Daily",
        image: "/assets/category/Mix-Fruit-Moisturising-Cream-100ml21.avif",
        link: "/category/daily",
        bgColor: "#FCE8E0", // Soft peach
    },
    {
        name: "Baby Care",
        image: "/assets/category/Enjoyful-baby-talc_21.avif",
        link: "/category/baby",
        bgColor: "#E8F4F8", // Soft cyan
    },
    {
        name: "Fragrances",
        image: "/assets/category/Enjoyfullife_bodymist_Amberglow21.avif",
        link: "/category/fragrances",
        bgColor: "#F5E8F0", // Soft rose
    },
    {
        name: "Home Care",
        image: "/assets/category/Lavender_11June2.avif",
        link: "/category/home-care",
        bgColor: "#E8F3EC", // Soft sage
    },
];

export function ShopByCategory() {
    return (
        <section className="bg-white py-10 md:py-32">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
                {/* Section Header */}
                <div className="mb-5 flex items-center justify-between gap-4 md:mb-20 md:block md:text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="editorial-section-heading display-sm text-2xl tracking-tight text-[var(--color-brand-onyx)] md:text-5xl">
                            <span className="md:hidden">Categories</span>
                            <span className="hidden md:inline">Shop Your Lifestyle</span>
                        </h2>
                    </motion.div>
                    <Link
                        href="/category/all"
                        className="editorial-body inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-brand-purple)] md:hidden"
                    >
                        View all <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                </div>

                <div
                    className="-mr-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
                    aria-label="Shop categories"
                >
                    {categories.map((category) => (
                        <Link
                            key={category.link}
                            href={category.link}
                            className="group flex w-[86px] flex-none snap-start flex-col items-center gap-2 text-center sm:w-[100px]"
                        >
                            <span className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_4px_14px_rgba(26,26,27,0.07)] transition-transform group-active:scale-95">
                                <Image
                                    src={category.image}
                                    alt=""
                                    fill
                                    sizes="(max-width: 640px) 100px, 1px"
                                    className="object-cover object-center"
                                />
                            </span>
                            <span className="editorial-body text-[12px] font-medium leading-tight text-[var(--color-brand-onyx)]">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Categories Grid */}
                <div className="hidden gap-4 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-5">
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
                                    <h3 className="editorial-heading font-bold text-base md:text-lg text-[var(--color-brand-onyx)] truncate leading-tight text-center">
                                        {category.name}
                                    </h3>
                                </div>
                            </Link>
                        </motion.div>
                    ))}

                </div>
            </div>
        </section>
    );
}
