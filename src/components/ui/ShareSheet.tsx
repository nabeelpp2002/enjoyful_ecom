"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Facebook, Twitter, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import { useData } from "@/context/DataContext";
import { Price } from "@/components/ui/Price";

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        image: string;
        price: number;
    };
}

export function ShareSheet({ isOpen, onClose, product }: ShareSheetProps) {
    const { showProductPrices } = useData();
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
            onClose();
        } catch (err) {
            console.error("Failed to copy link", err);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out ${product.name}`,
                    text: `I found this amazing product on enJoyful Life!`,
                    url: window.location.href,
                });
                onClose();
            } catch (err) {
                console.log("Error sharing:", err);
            }
        } else {
            handleCopyLink();
        }
    };

    const shareOptions = [
        { name: "Copy Link", icon: <Copy size={24} strokeWidth={1.5} />, onClick: handleCopyLink, iconColor: "text-blue-500" },
        { name: "WhatsApp", icon: <MessageCircle size={24} strokeWidth={1.5} />, onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, "_blank"), iconColor: "text-green-500" },
        { name: "Facebook", icon: <Facebook size={24} strokeWidth={1.5} />, onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank"), iconColor: "text-blue-600" },
        { name: "Twitter", icon: <Twitter size={24} strokeWidth={1.5} />, onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${product.name}`)}`, "_blank"), iconColor: "text-black" },
        { name: "More", icon: <Share2 size={24} strokeWidth={1.5} />, onClick: handleShare, iconColor: "text-gray-500" },
    ];

    const sharedContent = (
        <>
            <div className="flex items-center justify-center p-4 border-b border-gray-200 bg-white relative rounded-t-3xl">
                <button onClick={onClose} className="absolute left-4 p-2 text-[var(--color-brand-onyx)] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
                    <X size={22} strokeWidth={1.5} />
                </button>
                <h2 className="font-heading font-bold text-lg text-[var(--color-brand-onyx)]">Share</h2>
            </div>

            <div className="bg-white m-4 mb-2 rounded-[1rem] p-3 flex items-center gap-4 shadow-sm border border-gray-100">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                    <Image src={product.image} alt={product.name} fill className="object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-[var(--color-brand-onyx)] line-clamp-1 text-sm">{product.name}</h3>
                    {showProductPrices && (
                        <Price
                            amount={product.price}
                            reserveSpace={false}
                            className="mt-1"
                            amountClassName="font-sans text-xs text-[var(--color-brand-purple)] font-medium"
                            currencyClassName="font-sans text-xs text-[var(--color-brand-purple)] font-medium"
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-5 gap-y-6 pt-4 pb-6 px-2">
                {shareOptions.map((option) => (
                    <div key={option.name} className="flex flex-col items-center gap-2">
                        <button
                            onClick={option.onClick}
                            className={`w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform active:scale-95 ${option.iconColor}`}
                        >
                            {option.icon}
                        </button>
                        <span className="font-sans text-[11px] text-[var(--color-brand-onyx)]/70 font-medium whitespace-nowrap">
                            {option.name}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[var(--color-brand-onyx)]/40 backdrop-blur-sm z-[999]"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="md:hidden fixed bottom-0 left-0 w-full bg-[#f8f9fa] rounded-t-3xl z-[1000] overflow-hidden drop-shadow-[0_-5px_20px_rgba(0,0,0,0.15)]"
                    >
                        <div className="pb-[env(safe-area-inset-bottom)]">
                            {sharedContent}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="hidden md:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#f8f9fa] rounded-3xl z-[1000] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                    >
                        {sharedContent}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
