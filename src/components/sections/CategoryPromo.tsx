"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function CategoryPromo({ category }: { category: string }) {
    // Generate content based on category
    const promoData: Record<string, { title1: string; title2: string; title3: string; text: string; image: string; type: "image" | "video"; bgColor: string }> = {
        "Shop All": {
            title1: "EVERYDAY",
            title2: "essentials",
            title3: "FOR EVERYONE.",
            text: "Discover our complete range of products designed to elevate your daily routine from head to toe.",
            image: "/assets/caro1.jpeg",
            type: "image",
            bgColor: "bg-[#F5F5F0]",
        },
        Glow: {
            title1: "BEAUTY,",
            title2: "backed",
            title3: "BY INNOVATION.",
            text: "At Enjoyful, every formula is built with precision dosing & advanced encapsulation technology.",
            image: "/assets/blom-perfume.mp4",
            type: "video",
            bgColor: "bg-[#F4F0FE]", // light purple
        },
        Baby: {
            title1: "GENTLE,",
            title2: "safe",
            title3: "FOR LITTLE ONES.",
            text: "Formulated with the purest ingredients to protect and nourish your baby's delicate skin.",
            image: "/assets/IMG_3468.MOV",
            type: "video",
            bgColor: "bg-[#F0F8FF]", // light blue
        },
        Home: {
            title1: "CREATE,",
            title2: "your",
            title3: "SANCTUARY.",
            text: "Elevate your living spaces with our curated collection of calming and invigorating home essentials.",
            image: "/assets/carosal4.jpeg",
            type: "image",
            bgColor: "bg-[#F5FFF5]", // light green
        },
        Daily: {
            title1: "YOUR,",
            title2: "daily",
            title3: "RITUALS.",
            text: "Transform ordinary routines into moments of joy with our everyday body and skin care.",
            image: "/assets/animated -coffie-shampoo.mp4",
            type: "video",
            bgColor: "bg-[#FFF5F0]", // light orange
        },
    };

    const data = promoData[category] || promoData["Shop All"];

    return (
        <section className={`py-16 md:py-24 rounded-t-[3rem] -mt-10 relative z-20 ${data.bgColor} transition-colors duration-500`}>
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-24">
                    {/* Image Side - Optional: change to right for some categories, left for others */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className={`w-full md:w-1/2 ${["Baby", "Home Care"].includes(category) ? "md:order-last" : ""}`}
                    >
                        <div className="relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden shadow-sm">
                            {data.type === "video" ? (
                                <video
                                    src={data.image}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Image
                                    src={data.image}
                                    alt={`${category} Promo`}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                    </motion.div>

                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="w-full md:w-1/2 flex flex-col items-start pt-8"
                    >
                        <h2 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-[var(--color-brand-onyx)] leading-[1.1] mb-6 tracking-tight flex flex-col">
                            <span className="uppercase">{data.title1}</span>
                            <span className="font-serif italic font-normal text-[var(--color-brand-purple)] lowercase">{data.title2}</span>
                            <span className="uppercase">{data.title3}</span>
                        </h2>

                        <p className="font-sans text-lg md:text-xl text-[var(--color-brand-onyx)]/70 mb-12 max-w-md leading-relaxed">
                            {data.text}
                        </p>

                        {/* Circular Rotating Button */}
                        <div className="relative self-center md:self-start w-32 h-32 hidden md:flex items-center justify-center -ml-2">
                            <Link href="/category/all" className="relative group w-full h-full flex items-center justify-center bg-[#E5DDFE] rounded-full hover:bg-[var(--color-brand-purple)] transition-colors duration-500 overflow-hidden">
                                {/* Rotating Text Image / SVG */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 w-[140%] h-[140%] -left-[20%] -top-[20%]"
                                >
                                    <svg viewBox="0 0 100 100" className="w-full h-full fill-[var(--color-brand-purple)] group-hover:fill-white font-sans text-[11px] font-bold tracking-[0.2em] transition-colors duration-500 uppercase">
                                        <path id="curve" fill="transparent" d="M 50, 50 m -32, 0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" />
                                        <text>
                                            <textPath href="#curve" startOffset="0" className="opacity-90">
                                                EXPLORE ALL PRODUCTS • EXPLORE ALL PRODUCTS •
                                            </textPath>
                                        </text>
                                    </svg>
                                </motion.div>

                                {/* Center Arrow */}
                                <div className="absolute inset-0 flex items-center justify-center text-[var(--color-brand-purple)] group-hover:text-white group-hover:scale-110 transition-all duration-500">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                                    </svg>
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

