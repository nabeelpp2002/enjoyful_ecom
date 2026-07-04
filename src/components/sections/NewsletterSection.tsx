"use client";

import { motion } from "framer-motion";

export function NewsletterSection() {
    return (
        <section className="py-24 bg-[var(--color-brand-sand)]">
            <div className="max-w-7xl mx-auto px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="rounded-3xl overflow-hidden relative bg-[var(--color-brand-purple)] min-h-[500px]"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 items-center h-full min-h-[500px] flex-col-reverse lg:flex-row">
                        {/* Left: Content */}
                        <div className="p-8 lg:p-16 relative z-10 flex flex-col justify-center h-full order-last lg:order-first">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <p className="mb-4 font-sans font-semibold text-sm text-white tracking-widest uppercase opacity-90">
                                    Stay Connected
                                </p>
                                <h2 className="mb-6 font-heading font-extrabold text-4xl md:text-[48px] text-white leading-[1.1] tracking-tight">
                                    Join Our Community
                                </h2>
                                <p className="mb-10 font-sans font-normal text-lg text-white/90 leading-relaxed max-w-[450px]">
                                    Subscribe to get special offers, free giveaways, and exclusive updates on new products.
                                </p>

                                {/* Newsletter Form */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1 px-6 py-4 rounded-full focus:outline-none font-sans text-base bg-white text-[var(--color-brand-onyx)] placeholder:text-[var(--color-brand-onyx)]/50 focus:ring-2 focus:ring-[var(--color-brand-mustard)]/50"
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-10 py-4 rounded-full bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] font-heading font-bold text-base whitespace-nowrap shadow-[0_4px_14px_rgba(244,180,73,0.3)] transition-shadow hover:shadow-[0_6px_20px_rgba(244,180,73,0.4)]"
                                    >
                                        Subscribe
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: Video Background */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="h-[300px] lg:h-full w-full relative block order-first lg:order-last"
                        >
                            <video
                                src="/assets/IMG_3468.MOV"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="object-cover w-full h-full absolute inset-0"
                            />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
