"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;

    sortBy: string;
    setSortBy: (v: string) => void;

    priceMin: number;
    priceMax: number;
    maxPrice: number;
    setPriceMin: (v: number) => void;
    setPriceMax: (v: number) => void;

    selectedProductTypes: string[];
    toggleProductType: (type: string) => void;

    selectedSkinTypes: string[];
    toggleSkinType: (type: string) => void;

    activeFilterCount: number;
    onClearAll: () => void;
}

const PRODUCT_TYPES = ["Serum", "Cream", "Lotion", "Cleanser", "Oil", "Dish Washer", "Room Spray"];
const SKIN_TYPES = ["Dry", "Oily", "Combination", "Normal", "Sensitive"];

export function FilterDrawer({
    isOpen,
    onClose,
    category,
    sortBy,
    setSortBy,
    priceMin,
    priceMax,
    maxPrice,
    setPriceMin,
    setPriceMax,
    selectedProductTypes,
    toggleProductType,
    selectedSkinTypes,
    toggleSkinType,
    activeFilterCount,
    onClearAll,
}: FilterDrawerProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const CheckItem = ({
        label,
        checked,
        onChange,
    }: {
        label: string;
        checked: boolean;
        onChange: () => void;
    }) => (
        <label className="flex items-center gap-3 cursor-pointer py-1" onClick={onChange}>
            <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked
                        ? "bg-[var(--color-brand-onyx)] border-[var(--color-brand-onyx)]"
                        : "border-gray-300 bg-white"
                    }`}
            >
                {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <span className="font-sans text-sm text-[var(--color-brand-onyx)]">{label}</span>
        </label>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 z-50 md:hidden"
                        onClick={onClose}
                    />

                    <motion.div
                        key="drawer"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
                    >
                        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>

                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={16} className="text-[var(--color-brand-onyx)]" />
                                <h3 className="font-heading font-bold text-base text-[var(--color-brand-onyx)]">
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-brand-onyx)] text-white text-xs font-sans">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} className="text-[var(--color-brand-onyx)]" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
                            <div>
                                <p className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sort By</p>
                                <div className="space-y-1">
                                    {[
                                        { value: "featured", label: "Featured" },
                                        { value: "price-low", label: "Price: Low to High" },
                                        { value: "price-high", label: "Price: High to Low" },
                                        { value: "rating", label: "Highest Rated" },
                                    ].map((opt) => (
                                        <label key={opt.value} className="flex items-center gap-3 cursor-pointer py-1" onClick={() => setSortBy(opt.value)}>
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${sortBy === opt.value
                                                        ? "border-[var(--color-brand-onyx)]"
                                                        : "border-gray-300"
                                                    }`}
                                            >
                                                {sortBy === opt.value && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-onyx)]" />
                                                )}
                                            </div>
                                            <span className="font-sans text-sm text-[var(--color-brand-onyx)]">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Range (AED)</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-sans">Min</span>
                                        <input
                                            type="number"
                                            value={priceMin}
                                            onChange={(e) => setPriceMin(Math.max(0, +e.target.value))}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-onyx)]/20"
                                        />
                                    </div>
                                    <span className="text-gray-400 text-sm">–</span>
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-sans">Max</span>
                                        <input
                                            type="number"
                                            value={priceMax}
                                            onChange={(e) => setPriceMax(Math.min(maxPrice, +e.target.value))}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-onyx)]/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product Type</p>
                                <div className="space-y-1">
                                    {PRODUCT_TYPES.map((type) => (
                                        <CheckItem
                                            key={type}
                                            label={type}
                                            checked={selectedProductTypes.includes(type)}
                                            onChange={() => toggleProductType(type)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {category === "Glow" && (
                                <div>
                                    <p className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Skin Type</p>
                                    <div className="space-y-1">
                                        {SKIN_TYPES.map((type) => (
                                            <CheckItem
                                                key={type}
                                                label={type}
                                                checked={selectedSkinTypes.includes(type)}
                                                onChange={() => toggleSkinType(type)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="h-4" />
                        </div>

                        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => { onClearAll(); onClose(); }}
                                    className="flex-1 py-3 rounded-full border border-gray-200 font-sans text-sm font-medium text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="flex-[2] py-3 rounded-full bg-[var(--color-brand-onyx)] text-white font-sans text-sm font-semibold"
                            >
                                Show Results
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
