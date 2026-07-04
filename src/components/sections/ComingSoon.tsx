"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';

// Reusable component for the floating background custom image icons
const FloatingCustomIcon = ({ src, top, left, size, delay, duration }: { src: string, top: string, left: string, size: number, delay: number, duration: number }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <motion.div
            className="absolute pointer-events-none z-10 opacity-60 mt-16 sm:mt-0" // Added mt-16 for mobile view to push icons down
            style={{ top, left, width: size, height: size }}
            initial={{ y: 0, x: 0, rotate: 0 }}
            animate={{
                y: [0, -15, 8, 0], // Increased float amplitude significantly
                x: [0, 8, -5, 0],
                rotate: [0, 5, -5, 0],
                opacity: [0.3, 0.8, 0.3] // Higher opacity for visibility, gentle blink
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay
            }}
        >
            <Image
                src={src}
                alt="Product Icon"
                fill
                className="object-contain filter drop-shadow-sm" // Removed extra opacity and grayscale filters
            />
        </motion.div>
    );
};

// Reusable component for repeating typewriter effect
const TypewriterText = ({ text }: { text: string }) => {
    const [displayText, setDisplayText] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < text.length) {
            const timer = setTimeout(() => {
                setDisplayText((prev) => prev + text[index]);
                setIndex(index + 1);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                setDisplayText('');
                setIndex(0);
            }, 3000); // 3 seconds before restarting
            return () => clearTimeout(timer);
        }
    }, [index, text]);

    return (
        <div className="absolute bottom-6 sm:bottom-12 pb-6 sm:pb-0 w-full text-center z-30 pointer-events-none px-4">
            <span
                className="text-[#2b1055] font-semibold text-xs sm:text-sm md:text-base opacity-80 inline-flex items-center"
                style={{ fontFamily: "'Space Mono', var(--font-open-sans), sans-serif", letterSpacing: "0.15em" }}
            >
                {displayText}
                <span className="animate-pulse ml-1 font-bold text-[#f7ac16]">|</span>
            </span>
        </div>
    );
};

export function ComingSoon() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const response = await fetch('https://sheetdb.io/api/v1/qkw40eodjwhpk', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: [
                        {
                            'email': email
                        }
                    ]
                })
            });

            if (response.ok) {
                setStatus('success');
                setEmail('');
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    // Custom Icons configuration using the user-provided images (reduced sizes further)
    const floatingIcons = [
        { src: "/assets/icons/media__1773038613026.png", top: "15%", left: "15%", size: 30, delay: 0, duration: 6 }, // Perfume Pink
        { src: "/assets/icons/media__1773038644881.png", top: "60%", left: "10%", size: 40, delay: 1.5, duration: 7 }, // Lotion Dispenser Black
        { src: "/assets/icons/media__1773038685425.png", top: "20%", left: "75%", size: 25, delay: 3, duration: 5 }, // Sunscreen Tube
        { src: "/assets/icons/media__1773038708841.png", top: "70%", left: "80%", size: 45, delay: 2, duration: 8 }, // Flower Lotion Bottle
        { src: "/assets/icons/media__1773038778052.png", top: "45%", left: "25%", size: 35, delay: 1, duration: 6 }, // Spa Face
        { src: "/assets/icons/media__1773038613026.png", top: "40%", left: "85%", size: 20, delay: 4, duration: 7 }, // Perfume Pink small
    ];

    return (
        <div className="fixed inset-0 h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden font-sans text-center bg-[#fdfaff]">
            {/* Switched from svh to dvh (dynamic viewport height) to fix Safari bottom bar bleeding issues */}

            {/* Background Base with full height to prevent cutoff */}
            <div className="absolute inset-[-100px] z-0 bg-[#f8f2ff] bg-cover"></div>

            {/* Custom Floating Image Icons (replacing videos) */}
            {floatingIcons.map((props, index) => (
                <FloatingCustomIcon key={index} {...props} />
            ))}

            {/* Main Content Container */}
            <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-6">

                {/* Logo & Top Graphic */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
                    className="relative mb-6 flex flex-col items-center -mt-12 sm:-mt-24" // Added negative top margin to pull it up
                >
                    {/* Animated squiggles around logo to mimic reference */}
                    <motion.div
                        className="absolute -top-8 -left-8 z-0 hidden sm:block"
                        animate={{ rotate: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Sparkles size={50} className="text-[#19181a]" />
                    </motion.div>

                    {/* Logo Image - Adjusted Size and Animation (even smaller and less floaty) */}
                    <motion.div
                        className="relative z-10 w-[200px] h-[100px] sm:w-[300px] sm:h-[150px] md:w-[400px] md:h-[200px]"
                        animate={{
                            y: [0, -4, 0],
                            rotate: [-1, 1, -1]
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Image
                            src="/assets/logoRegistered.png"
                            alt="Enjoyful Logo"
                            fill
                            priority
                            unoptimized
                            className="object-contain"
                        />
                    </motion.div>
                </motion.div>

                {/* Typography (Bold, Uppercase, High Contrast) - Reduced Size Further */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center w-full flex flex-col items-center mt-[-20px] md:mt-[-40px]" // Pull text closer to larger logo
                >
                    <h1
                        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2b1055] mb-3 tracking-wider uppercase leading-tight drop-shadow-sm" // Dark deep purple representative text
                        style={{ fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em" }}
                    >
                        Coming Soon
                    </h1>

                    <p
                        className="text-[#2b1055] opacity-90 text-xs sm:text-sm md:text-base font-semibold mb-6 max-w-lg mx-auto" // Dark deep purple representative text
                        style={{ fontFamily: "'Space Mono', var(--font-open-sans), sans-serif" }}
                    >
                        Be the first to know when we launch and get exclusive updates!
                    </p>

                    {/* Compact Inline Email Form - Super Compact */}
                    <div className="relative w-full max-w-md mx-auto group z-30 mt-8 sm:mt-12">
                        <form onSubmit={handleSubmit} className="flex flex-row justify-between items-center w-full bg-[#19181a] rounded-full p-1 shadow-[3px_3px_0px_0px_rgba(25,24,26,0.3)] border-2 border-[#19181a]">
                            <input
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading' || status === 'success'}
                                required
                                className="flex-1 w-full px-4 py-2 rounded-full bg-transparent text-white placeholder:text-gray-400 focus:outline-none focus:ring-0 font-semibold text-base border-none disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className="px-5 py-2 rounded-full bg-[#f7ac16] text-[#19181a] font-bold uppercase tracking-wider hover:bg-white hover:text-[#19181a] transition-colors shadow-sm flex-shrink-0 text-xs sm:text-sm border-2 border-[#19181a] disabled:opacity-50"
                            >
                                {status === 'loading' ? 'Sending...' : status === 'success' ? 'Notified' : 'Notify Me'}
                            </button>
                        </form>
                        {status === 'success' && (
                            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold text-[#735697] mt-3 bg-white/80 py-1.5 px-4 rounded-full inline-block backdrop-blur-sm shadow-sm">
                                🎉 Thanks! You'll be the first to know.
                            </motion.p>
                        )}
                        {status === 'error' && (
                            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold text-red-600 mt-3 bg-white/80 py-1.5 px-4 rounded-full inline-block backdrop-blur-sm shadow-sm">
                                ❌ Something went wrong. Please try again.
                            </motion.p>
                        )}
                    </div>
                </motion.div>

            </div>

            {/* Typing Effect Footer Text */}
            <div className="absolute bottom-10 sm:bottom-16 w-full flex justify-center z-30">
                <TypewriterText text="Where joy meets care" />
            </div>

        </div>
    );
}
