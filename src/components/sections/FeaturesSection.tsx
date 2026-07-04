"use client";

import { motion } from "framer-motion";
import { Leaf, Package, Heart, Sparkles } from "lucide-react";

const features = [
    {
        icon: Leaf,
        title: "Natural Ingredients",
        description: "Only the finest natural and organic ingredients in every product",
    },
    {
        icon: Package,
        title: "Eco-Friendly Packaging",
        description: "Sustainable packaging that cares for our planet",
    },
    {
        icon: Heart,
        title: "Cruelty-Free",
        description: "Never tested on animals, always kind to all living beings",
    },
    {
        icon: Sparkles,
        title: "Premium Quality",
        description: "Luxury formulations crafted with care and expertise",
    },
];

export function FeaturesSection() {
    return (
        <section className="py-16 sm:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-8">
                {/* Section Header */}
                <div className="text-center mb-12 sm:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="mb-4 font-heading font-extrabold text-4xl md:text-[48px] text-[var(--color-brand-onyx)] tracking-tight">
                            Why Choose enJoyful Life
                        </h2>
                        <p className="font-sans font-normal text-lg text-[var(--color-brand-onyx)]/70 max-w-[600px] mx-auto">
                            We believe in creating products that are good for you and good for the earth
                        </p>
                    </motion.div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-12 lg:gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="text-center flex flex-col items-center"
                            >
                                {/* Icon Container */}
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full mb-3 sm:mb-6 bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]"
                                >
                                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
                                </motion.div>

                                {/* Feature Content */}
                                <h3 className="mb-2 sm:mb-3 font-heading font-bold text-sm sm:text-xl text-[var(--color-brand-onyx)]">
                                    {feature.title}
                                </h3>
                                <p className="font-sans font-normal text-xs sm:text-[15px] text-[var(--color-brand-onyx)]/70 leading-relaxed max-w-[250px]">
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
