"use client";

import { motion } from "framer-motion";
import { Leaf, Heart, Sparkles, Package } from "lucide-react";
import Image from "next/image";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SeoContent } from "@/components/sections/SeoContent";
import { SEO_CONTENT } from "@/data/seo-content";

export default function About() {
    const values = [
        { icon: Leaf, title: "Natural Ingredients", description: "We source only the finest natural and organic ingredients from sustainable farms around the world." },
        { icon: Heart, title: "Cruelty-Free", description: "Our products are never tested on animals. We believe in kindness to all living beings." },
        { icon: Sparkles, title: "Premium Quality", description: "Each product is crafted with care, using advanced formulations backed by science." },
        { icon: Package, title: "Sustainable Packaging", description: "We use eco-friendly, recyclable packaging to minimize our environmental impact." },
    ];

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen pb-24">
            {/* Hero */}
            <div className="relative overflow-hidden bg-white min-h-[600px] flex items-center">
                <div className="max-w-7xl mx-auto px-8 py-24 w-full">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
                        <p className="mb-6 font-sans text-sm text-[var(--color-brand-purple)] tracking-widest uppercase font-semibold">About Us</p>
                        <h1 className="mb-8 font-heading font-extrabold text-[56px] md:text-[72px] text-[var(--color-brand-onyx)] leading-[1.1] tracking-tight">
                            Where Nature Meets Luxury
                        </h1>
                        <p className="font-sans text-xl text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            enJoyful Life was born from a simple belief: that skincare should be a joyful ritual, not a compromise. We create premium products that nurture your skin with the power of nature, while honoring our commitment to sustainability and ethical beauty.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-24 pt-12">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />

                {/* Mission */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="my-32 text-center">
                    <h2 className="mb-6 font-heading font-bold text-4xl md:text-[48px] text-[var(--color-brand-onyx)] tracking-tight">Our Mission</h2>
                    <p className="font-sans text-xl text-[var(--color-brand-onyx)]/80 leading-relaxed max-w-[900px] mx-auto">
                        To empower people to embrace their natural beauty through clean, effective skincare that respects both skin and planet. We believe in transparency, quality, and creating products that make you feel as good as you look.
                    </p>
                </motion.div>

                {/* Founder Story */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-32 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] bg-white shadow-xl">
                        <Image src="/assets/about_founder.png" alt="Founder" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                    <div>
                        <p className="mb-4 font-sans text-sm text-[var(--color-brand-purple)] tracking-widest uppercase font-semibold">Founder Story</p>
                        <h2 className="mb-6 font-heading font-bold text-4xl text-[var(--color-brand-onyx)] tracking-tight">A Journey to Natural Beauty</h2>
                        <p className="mb-6 font-sans text-lg text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            After struggling with sensitive skin and harsh chemicals in conventional products, I knew there had to be a better way. In 2018, I started experimenting with natural ingredients in my kitchen, creating gentle formulations that actually worked.
                        </p>
                        <p className="font-sans text-lg text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            What began as a personal quest became a passion to help others experience the transformative power of clean, effective skincare. Today, enJoyful Life is trusted by thousands who share our commitment to natural, sustainable beauty.
                        </p>
                    </div>
                </motion.div>

                {/* Values */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-32">
                    <h2 className="mb-16 text-center font-heading font-bold text-4xl md:text-[48px] text-[var(--color-brand-onyx)] tracking-tight">Our Values</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="text-center flex flex-col items-center">
                                    <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                                        <Icon size={32} strokeWidth={1.5} />
                                    </motion.div>
                                    <h3 className="mb-3 font-heading font-bold text-xl text-[var(--color-brand-onyx)]">{value.title}</h3>
                                    <p className="font-sans text-[15px] text-[var(--color-brand-onyx)]/70 leading-relaxed max-w-[250px]">{value.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Ingredients Philosophy */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-32 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1">
                        <h2 className="mb-6 font-heading font-bold text-4xl md:text-[40px] text-[var(--color-brand-onyx)] tracking-tight">Powered by Nature</h2>
                        <p className="mb-6 font-sans text-lg text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            We believe nature provides everything skin needs to thrive. Our formulations feature botanical extracts, plant oils, and natural actives that deliver visible results without compromise.
                        </p>
                        <p className="font-sans text-lg text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            Every ingredient is carefully selected for its efficacy and safety. We never use parabens, sulfates, synthetic fragrances, or harsh chemicals. Just pure, powerful botanicals that work in harmony with your skin.
                        </p>
                    </div>
                    <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] bg-white shadow-xl order-1 md:order-2">
                        <Image src="/assets/about_ingredients.png" alt="Natural ingredients" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                </motion.div>

                {/* Sustainability */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="rounded-[2rem] overflow-hidden bg-[var(--color-brand-purple)] shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="relative overflow-hidden aspect-[4/3] lg:aspect-auto">
                            <Image src="/assets/about_sustainability.png" alt="Sustainability" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                        </div>
                        <div className="p-12 lg:p-16 flex flex-col justify-center">
                            <h2 className="mb-6 font-heading font-bold text-4xl text-white tracking-tight">Committed to Sustainability</h2>
                            <p className="mb-8 font-sans text-lg text-white/90 leading-relaxed">Beauty shouldn&apos;t come at the cost of our planet. We&apos;re committed to sustainable practices at every step of our journey.</p>
                            <ul className="space-y-4">
                                {["Recyclable and biodegradable packaging","Carbon-neutral shipping","Sustainably sourced ingredients","Zero-waste manufacturing process","Partnering with environmental organizations"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 font-sans text-base text-white/90">
                                        <span className="mt-1 font-bold">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
            <SeoContent data={SEO_CONTENT.about} />
        </div>
    );
}
