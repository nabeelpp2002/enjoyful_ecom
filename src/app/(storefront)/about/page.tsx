"use client";

import { motion } from "framer-motion";
import { Leaf, Heart, Sparkles, Package, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export default function About() {
    const values = [
        { icon: Leaf, title: "Natural Ingredients", description: "We source only the finest natural and organic ingredients from sustainable farms around the world." },
        { icon: Heart, title: "Cruelty-Free", description: "Our products are never tested on animals. We believe in kindness to all living beings." },
        { icon: Sparkles, title: "Premium Quality", description: "Each product is crafted with care, using advanced formulations backed by science." },
        { icon: Package, title: "Sustainable Packaging", description: "We use eco-friendly, recyclable packaging to minimize our environmental impact." },
    ];

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen pb-16 sm:pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 mb-12 sm:mb-16 text-center max-w-3xl mx-auto"
                >
                    <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-purple)] tracking-[0.25em] uppercase font-semibold mb-3">
                        About enJoyful Life
                    </p>
                    <h1 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[var(--color-brand-onyx)] tracking-tight leading-[1.15]">
                        Considered Care, <span className="italic text-[var(--color-brand-purple)] font-semibold">Crafted with Intent</span>
                    </h1>
                </motion.div>

                {/* 1. Founder Story Card */}
                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 sm:mb-24 lg:mb-28 bg-white/75 backdrop-blur-sm p-6 sm:p-10 lg:p-12 rounded-[2rem] border border-white/80 shadow-xl shadow-black/5"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* Founder Image (Top on mobile, Right on desktop) */}
                        <div className="order-1 lg:order-2 lg:col-span-5 relative rounded-[1.75rem] sm:rounded-[2.25rem] overflow-hidden aspect-[4/5] bg-white shadow-md border border-white/60 w-full max-w-sm sm:max-w-md lg:max-w-none mx-auto">
                            <Image
                                src="/assets/aslam_ceo.png"
                                alt="Aslam - Founder & CEO of enJoyful Life"
                                fill
                                className="object-cover object-center transform hover:scale-[1.02] transition-transform duration-700 ease-out"
                                sizes="(max-width: 1024px) 100vw, 40vw"
                                priority
                            />
                        </div>

                        {/* Founder Narrative (Below image on mobile, Left on desktop) */}
                        <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-center">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <span className="text-2xl sm:text-3xl text-[var(--color-brand-purple)]/40 font-serif leading-none">“</span>
                                <p className="font-sans text-[11px] sm:text-xs md:text-sm text-[var(--color-brand-purple)] tracking-[0.2em] uppercase font-semibold">
                                    Our Founder
                                </p>
                            </div>

                            {/* Founder Name & Title */}
                            <div className="mb-4 sm:mb-6">
                                <h3 className="font-heading font-bold text-lg sm:text-xl md:text-2xl text-[var(--color-brand-onyx)]">
                                    Aslam
                                </h3>
                                <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-purple)] font-medium">
                                    Founder &amp; CEO, enJoyful Life
                                </p>
                            </div>

                            {/* Headline */}
                            <h2 className="mb-4 sm:mb-6 font-serif font-bold text-xl sm:text-3xl lg:text-[40px] text-[var(--color-brand-onyx)] leading-[1.25] tracking-normal">
                                Purity gives us the foundation.{" "}
                                <span className="text-[var(--color-brand-purple)] font-serif italic font-semibold block sm:inline">
                                    Genuine care gives it a purpose.
                                </span>
                            </h2>

                            <div className="w-12 sm:w-16 h-[2px] bg-[var(--color-brand-onyx)]/15 mb-4 sm:mb-6" />

                            {/* Concise Narrative Story */}
                            <div className="space-y-3 sm:space-y-4 font-sans text-sm sm:text-base md:text-lg text-[var(--color-brand-onyx)]/75 leading-relaxed">
                                <p>
                                    enJoyful Life was established to bridge the gap between mass-produced formulas and high-end skincare — crafting clean, dermatologically considered products for daily routines.
                                </p>
                                <p className="font-medium text-[var(--color-brand-onyx)]/90">
                                    The values stay the same. Only the reach has changed.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Our Mission & Core Values */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 sm:mb-24 lg:mb-28"
                >
                    <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
                        <h2 className="mb-4 sm:mb-6 font-heading font-bold text-2xl sm:text-3xl md:text-[44px] text-[var(--color-brand-onyx)] tracking-tight">
                            Our Mission &amp; Values
                        </h2>
                        <p className="font-sans text-sm sm:text-base md:text-lg text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            To empower people to embrace their natural beauty through clean, effective skincare that respects both skin and planet. We believe in transparency, quality, and creating products that make you feel as good as you look.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="text-center flex flex-col items-center p-4 sm:p-6 bg-white/50 backdrop-blur-xs rounded-2xl border border-white/60 shadow-xs hover:shadow-md transition-shadow"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: 5 }}
                                        className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-5 bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]"
                                    >
                                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
                                    </motion.div>
                                    <h3 className="mb-2 font-heading font-bold text-base sm:text-lg text-[var(--color-brand-onyx)]">
                                        {value.title}
                                    </h3>
                                    <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/70 leading-relaxed">
                                        {value.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* 3. Ingredients Philosophy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 sm:mb-24 lg:mb-28 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center"
                >
                    <div className="order-2 md:order-1">
                        <h2 className="mb-4 sm:mb-6 font-heading font-bold text-2xl sm:text-3xl md:text-[40px] text-[var(--color-brand-onyx)] tracking-tight">
                            Powered by Nature
                        </h2>
                        <p className="mb-4 sm:mb-6 font-sans text-base sm:text-lg text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            We believe nature provides everything skin needs to thrive. Our formulations feature botanical extracts, plant oils, and natural actives that deliver visible results without compromise.
                        </p>
                        <p className="font-sans text-base sm:text-lg text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            Every ingredient is carefully selected for its efficacy and safety. We never use parabens, sulfates, synthetic fragrances, or harsh chemicals. Just pure, powerful botanicals that work in harmony with your skin.
                        </p>
                    </div>
                    <div className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden aspect-[16/10] sm:aspect-[4/3] bg-white shadow-lg border border-white/60 order-1 md:order-2">
                        <Image src="/assets/about_ingredients.png" alt="Natural ingredients" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                </motion.div>

                {/* 4. Sustainability */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 sm:mb-24 lg:mb-28 rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden bg-[var(--color-brand-purple)] shadow-xl"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="relative overflow-hidden aspect-[16/10] lg:aspect-auto min-h-[220px] sm:min-h-[300px]">
                            <Image src="/assets/about_sustainability.png" alt="Sustainability" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                        </div>
                        <div className="p-6 sm:p-10 lg:p-16 flex flex-col justify-center">
                            <h2 className="mb-4 sm:mb-6 font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
                                Committed to Sustainability
                            </h2>
                            <p className="mb-6 sm:mb-8 font-sans text-base sm:text-lg text-white/90 leading-relaxed">
                                Beauty shouldn&apos;t come at the cost of our planet. We&apos;re committed to sustainable practices at every step of our journey.
                            </p>
                            <ul className="space-y-3 sm:space-y-4">
                                {[
                                    "Recyclable and biodegradable packaging",
                                    "Carbon-neutral shipping",
                                    "Sustainably sourced ingredients",
                                    "Zero-waste manufacturing process",
                                    "Partnering with environmental organizations",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5 sm:gap-3 font-sans text-sm sm:text-base text-white/90">
                                        <span className="mt-0.5 font-bold text-white">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* 5. Shop / Explore CTA Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-10 sm:py-16 px-6 bg-white/60 backdrop-blur-sm rounded-[2rem] border border-white/80 shadow-md max-w-4xl mx-auto"
                >
                    <h2 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-[var(--color-brand-onyx)] mb-4">
                        Experience Clean Luxury for Yourself
                    </h2>
                    <p className="font-sans text-sm sm:text-base text-[var(--color-brand-onyx)]/75 max-w-xl mx-auto mb-8">
                        Explore our carefully formulated skincare routines designed to bring joy and efficacy to your daily personal care ritual.
                    </p>
                    <Link
                        href="/category/all"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[var(--color-brand-purple)] text-white font-sans font-semibold text-sm hover:bg-[var(--color-brand-purple)]/90 shadow-lg hover:shadow-xl transition-all group"
                    >
                        Explore Our Collections
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
