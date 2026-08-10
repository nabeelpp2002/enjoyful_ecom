"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export interface Slide {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    textColor?: string;
    buttonStyle?: string;
    desktopImageUrl: string;
    mobileImageUrl: string;
}

export function normalizeHeroSlide(s: Record<string, unknown>): Slide {
    return {
        id: String(s.$id ?? s._id ?? s.id ?? ""),
        title: String(s.title ?? ""),
        subtitle: s.subtitle as string | undefined,
        description: s.description as string | undefined,
        buttonText: (s.buttonText as string) || "Shop Now",
        buttonLink: (s.buttonLink as string) || "/category/all",
        textColor: (s.textColor as string) || "#FFFFFF",
        buttonStyle: (s.buttonStyle as string) || "solid",
        desktopImageUrl: (s.desktopImageUrl as string) || (s.imageUrl as string) || "",
        mobileImageUrl: (s.mobileImageUrl as string) || (s.desktopImageUrl as string) || (s.imageUrl as string) || "",
    };
}

export function HeroSection({ initialSlides = [] }: { initialSlides?: Slide[] }) {
    const [slides, setSlides] = useState<Slide[]>(initialSlides);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [trackIndex, setTrackIndex] = useState(0);
    const [resetTrackInstantly, setResetTrackInstantly] = useState(false);
    // When the server already provided slides, there's nothing to wait for — the
    // first slide (LCP image) is in the initial HTML. Only show a skeleton when
    // we have to fall back to a client-side fetch (e.g. API was down at SSR time).
    const [loading, setLoading] = useState(initialSlides.length === 0);

    useEffect(() => {
        // Slides already hydrated from the server render — skip the client fetch.
        if (initialSlides.length > 0) return;
        fetch("/api/carousel")
            .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
            .then((data: Record<string, unknown>[] | null) => {
                if (!data || !Array.isArray(data) || data.length === 0) {
                    return;
                }
                const active = data
                    .filter(s => s.isActive !== false)
                    .filter(s => s.desktopImageUrl || s.imageUrl || s.mobileImageUrl)
                    .map(normalizeHeroSlide)
                    .filter(s => s.desktopImageUrl || s.mobileImageUrl);
                if (active.length) setSlides(active);
            })
            .catch((err) => console.error("[HeroSection] carousel fetch failed:", err))
            .finally(() => setLoading(false));
    }, [initialSlides.length]);

    useEffect(() => {
        if (slides.length < 2) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
            setTrackIndex(prev => prev + 1);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (loading) {
        return (
            <section className="relative w-full h-[100svh] bg-[var(--color-brand-onyx)] animate-pulse" />
        );
    }

    if (slides.length === 0) {
        return null;
    }

    const safe = currentSlide >= slides.length ? 0 : currentSlide;
    const slide = slides[safe];
    const textColor = slide.textColor || "#FFFFFF";
    const isOutline = slide.buttonStyle === "outline";
    // Clone the first slide at the end so the last → first transition still
    // moves exactly one viewport to the left. Once it completes, jump the
    // shared track back to the real first slide with transitions disabled.
    const trackSlides = slides.length > 1 ? [...slides, slides[0]] : slides;

    const handleTrackAnimationComplete = () => {
        if (trackIndex !== slides.length) return;
        setResetTrackInstantly(true);
        setTrackIndex(0);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setResetTrackInstantly(false));
        });
    };

    return (
        <section className="relative w-full h-[100svh] overflow-hidden bg-[var(--color-brand-onyx)]">
            {/* A single translated track keeps neighboring slides in one compositor
                coordinate system. Independent enter/exit transforms can round in
                opposite directions on mobile and expose the parent background. */}
            <motion.div
                initial={false}
                animate={{ x: `${trackIndex * -100}%` }}
                transition={resetTrackInstantly
                    ? { duration: 0 }
                    : { duration: 1, ease: [0.65, 0, 0.35, 1] }}
                onAnimationComplete={handleTrackAnimationComplete}
                className="absolute inset-0 z-0 flex will-change-transform"
            >
                {trackSlides.map((trackSlide, index) => (
                    <div
                        key={`${trackSlide.id}-${index}`}
                        className="relative h-full w-full min-w-full shrink-0 overflow-hidden"
                    >
                        <div className="hidden md:block relative w-full h-full">
                            <Image
                                src={trackSlide.desktopImageUrl}
                                alt={trackSlide.title}
                                fill
                                priority={index === 0}
                                quality={90}
                                unoptimized={trackSlide.desktopImageUrl.startsWith("http")}
                                className="object-cover object-center"
                                sizes="100vw"
                            />
                        </div>
                        <div className="md:hidden relative w-full h-full">
                            <Image
                                src={trackSlide.mobileImageUrl || trackSlide.desktopImageUrl}
                                alt={trackSlide.title}
                                fill
                                priority={index === 0}
                                quality={90}
                                unoptimized={(trackSlide.mobileImageUrl || trackSlide.desktopImageUrl).startsWith("http")}
                                className="object-cover object-center"
                                sizes="100vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Text overlay — positioned absolutely over the image */}
            <div className="absolute inset-0 z-10 flex items-center md:items-center pb-0 md:pb-0 pt-0">
                <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
                    <div className="max-w-2xl relative flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={safe}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 30 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                className="space-y-6 text-left"
                            >
                                {slide.subtitle && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                        style={{ color: textColor }}
                                        className="inline-block px-5 py-2 rounded-full backdrop-blur-md bg-white/10 font-sans text-xs md:text-sm tracking-[0.2em] uppercase font-bold border border-white/20"
                                    >
                                        {slide.subtitle}
                                    </motion.div>
                                )}

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                    style={{ color: textColor }}
                                    className="font-heading font-extrabold text-[40px] md:text-6xl lg:text-[84px] leading-[0.95] tracking-tighter drop-shadow-xl whitespace-pre-line"
                                >
                                    {slide.title}
                                </motion.h1>

                                {slide.description && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.6 }}
                                        style={{ color: textColor }}
                                        className="font-sans font-normal text-sm md:text-base leading-relaxed max-w-md drop-shadow-md opacity-90"
                                    >
                                        {slide.description}
                                    </motion.p>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.7 }}
                                    className="pt-4"
                                >
                                    <Link
                                        href={slide.buttonLink || "/category/all"}
                                        style={isOutline ? { color: textColor, borderColor: textColor } : undefined}
                                        className={
                                            isOutline
                                                ? "inline-block px-6 py-3 md:px-8 md:py-3.5 rounded-full bg-transparent font-sans font-semibold text-xs md:text-sm tracking-wider uppercase transition-all duration-300 border-2 hover:bg-white hover:text-black hover:border-white"
                                                : "inline-block px-6 py-3 md:px-8 md:py-3.5 rounded-full bg-white text-black font-sans font-semibold text-xs md:text-sm tracking-wider uppercase transition-all duration-300 hover:bg-black hover:text-white border border-transparent hover:border-white"
                                        }
                                    >
                                        {slide.buttonText}
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
