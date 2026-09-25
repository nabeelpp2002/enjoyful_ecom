"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const slides = [
    {
        desktop: "/assets/glow-carousel-1-desktop.webp",
        mobile: "/assets/glow-carousel-1-mobile.webp",
        href: "/category/glow",
        alt: "Enjoyful Life Glow Collection",
    },
    {
        desktop: "/assets/fragrance-carousel-2-desktop-v4.webp",
        mobile: "/assets/fragrance-carousel-2-mobile.webp",
        href: "/category/fragrances",
        alt: "Enjoyful Life Fragrances Collection",
    },
    {
        desktop: "/assets/home-care-carousel-3-desktop.webp",
        mobile: "/assets/home-care-carousel-3-mobile.webp",
        href: "/category/home-care",
        alt: "Enjoyful Life Home Care Collection",
    },
] as const;

export function StaticHeroCarousel() {
    const [current, setCurrent] = useState(0);
    const [trackIndex, setTrackIndex] = useState(1);
    const [instantReset, setInstantReset] = useState(false);
    const pointerStartRef = useRef<number | null>(null);
    const suppressClickRef = useRef(false);
    const currentRef = useRef(0);
    const transitionInProgressRef = useRef(false);
    const trackSlides = [slides[slides.length - 1], ...slides, slides[0]];

    const showNext = useCallback(() => {
        if (document.hidden || transitionInProgressRef.current) return;
        const active = currentRef.current;
        const next = (active + 1) % slides.length;
        currentRef.current = next;
        transitionInProgressRef.current = true;
        setCurrent(next);
        // From the final real slide, animate to the cloned first slide. The
        // animation-complete handler then jumps back to the real first slide.
        setTrackIndex(active === slides.length - 1 ? slides.length + 1 : next + 1);
    }, []);

    const showPrevious = useCallback(() => {
        if (document.hidden || transitionInProgressRef.current) return;
        const active = currentRef.current;
        const previous = (active - 1 + slides.length) % slides.length;
        currentRef.current = previous;
        transitionInProgressRef.current = true;
        setCurrent(previous);
        // From the first real slide, animate to the cloned final slide.
        setTrackIndex(active === 0 ? 0 : previous + 1);
    }, []);

    useEffect(() => {
        let timer: number | undefined;

        const startTimer = () => {
            if (timer !== undefined) window.clearInterval(timer);
            timer = window.setInterval(showNext, 6000);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (timer !== undefined) window.clearInterval(timer);
                timer = undefined;
                return;
            }

            // A browser may suspend an in-flight animation while the tab is in
            // the background. Restore the matching real slide before resuming.
            transitionInProgressRef.current = false;
            setInstantReset(true);
            setTrackIndex(currentRef.current + 1);
            requestAnimationFrame(() => requestAnimationFrame(() => setInstantReset(false)));
            startTimer();
        };

        if (!document.hidden) startTimer();
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            if (timer !== undefined) window.clearInterval(timer);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [showNext]);

    useEffect(() => {
        // The files are already compressed WebP assets. Warm every slide directly
        // so the browser cache has the next image before the carousel moves.
        const preloaders = slides.flatMap(slide => [slide.desktop, slide.mobile]).map(src => {
            const image = new window.Image();
            image.decoding = "async";
            image.src = src;
            return image;
        });

        return () => {
            preloaders.forEach(image => { image.src = ""; });
        };
    }, []);

    const handlePointerUp = (event: React.PointerEvent) => {
        if (pointerStartRef.current === null) return;
        const distance = event.clientX - pointerStartRef.current;
        pointerStartRef.current = null;
        if (Math.abs(distance) < 50) return;

        suppressClickRef.current = true;
        if (distance < 0) showNext();
        else showPrevious();
        window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    };

    const handleAnimationComplete = () => {
        let resetTo: number | null = null;
        if (trackIndex <= 0) resetTo = slides.length;
        if (trackIndex >= slides.length + 1) resetTo = 1;
        transitionInProgressRef.current = false;
        if (resetTo === null) return;

        setInstantReset(true);
        setTrackIndex(resetTo);
        requestAnimationFrame(() => requestAnimationFrame(() => setInstantReset(false)));
    };

    return (
        <section
            className="relative w-full touch-pan-y overflow-hidden bg-[#dff2ff] aspect-[941/1672] md:h-[min(110vh,1200px)] md:aspect-auto"
            onPointerDown={event => { pointerStartRef.current = event.clientX; }}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { pointerStartRef.current = null; }}
        >
            <motion.div
                initial={false}
                animate={{ x: `${trackIndex * -100}%` }}
                transition={instantReset ? { duration: 0 } : { duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
                onAnimationComplete={handleAnimationComplete}
                className="absolute inset-0 z-10 flex will-change-transform"
            >
                {trackSlides.map((slide, index) => {
                    const originalIndex = index === 0 ? slides.length - 1 : index === trackSlides.length - 1 ? 0 : index - 1;
                    return (
                    <Link
                        key={`${slide.href}-${index}`}
                        href={slide.href}
                        aria-label={`Shop ${slide.alt}`}
                        onClick={event => {
                            if (suppressClickRef.current) event.preventDefault();
                        }}
                        className="relative block h-full w-full min-w-full shrink-0 overflow-hidden"
                    >
                        <div className="relative h-full w-full md:hidden">
                            <Image
                                src={slide.mobile}
                                alt={slide.alt}
                                fill
                                priority={originalIndex === 0}
                                fetchPriority={originalIndex === 0 ? "high" : "auto"}
                                unoptimized
                                sizes="100vw"
                                className="object-cover"
                            />
                        </div>
                        <div className="relative hidden h-full w-full md:block">
                            <Image
                                src={slide.desktop}
                                alt={slide.alt}
                                fill
                                priority={originalIndex === 0}
                                fetchPriority={originalIndex === 0 ? "high" : "auto"}
                                unoptimized
                                sizes="100vw"
                                className="object-cover object-center"
                            />
                        </div>
                    </Link>
                    );
                })}
            </motion.div>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-6">
                {slides.map((slide, index) => (
                    <button
                        key={slide.href}
                        type="button"
                        onClick={() => {
                            if (index === currentRef.current || transitionInProgressRef.current) return;
                            currentRef.current = index;
                            transitionInProgressRef.current = true;
                            setCurrent(index);
                            setTrackIndex(index + 1);
                        }}
                        aria-label={`Show slide ${index + 1}`}
                        className={`h-2 rounded-full shadow-sm transition-all ${index === current ? "w-7 bg-white" : "w-2 bg-white/60 hover:bg-white/80"}`}
                    />
                ))}
            </div>
        </section>
    );
}
