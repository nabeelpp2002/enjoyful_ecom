"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "@/context/DataContext";
import { track } from "@/lib/analytics";
import type { Product } from "@/data/products";

interface AddToCartButtonProps {
    product: Product;
    className?: string;
    iconClassName?: string;
}

export const AddToCartButton = memo(function AddToCartButton({
    product,
    className = "p-1 sm:p-2",
    iconClassName = "w-[20px] h-[20px] sm:w-[26px] sm:h-[26px]"
}: AddToCartButtonProps) {
    const { addToCart } = useData();
    const [added, setAdded] = useState(false);

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (added) return;

        addToCart(product, 1);
        track({ type: "add_to_cart", productId: product.id, productName: product.name, metadata: { quantity: 1, price: product.price } });
        setAdded(true);

        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <button
            onClick={handleAdd}
            className={`text-[var(--color-brand-onyx)] transition-colors relative flex items-center justify-center ${added ? 'text-green-600' : 'hover:text-gray-500'} ${className}`}
            aria-label="Add to Cart"
        >
            <AnimatePresence mode="wait">
                {added ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </motion.div>
                ) : (
                    <motion.div
                        key="plus"
                        whileHover={{ scale: 1.05 }}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
});
