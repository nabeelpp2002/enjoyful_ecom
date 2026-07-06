"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CheckoutModal, type DeliveryDetails } from "@/components/ui/CheckoutModal";
import { useData } from "@/context/DataContext";
import { track } from "@/lib/analytics";
import { Price } from "@/components/ui/Price";
import { formatPrice } from "@/lib/price";

const FREE_SHIPPING_THRESHOLD = 150;

export default function CartPage() {
    const { cart, updateCartQuantity, removeFromCart, getCartTotal, showProductPrices } = useData();
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const cartSubtotal = getCartTotal();
    const shippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
    const shippingProgress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

    function handleCheckout(details: DeliveryDetails) {
        setShowCheckoutModal(false);
        const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "971500000000";
        const itemLines = cart
            .map(
                (item) =>
                    `- ${item.product.name}${item.product.size ? ` (${item.product.size})` : ""} x${item.quantity} = ${(item.product.price * item.quantity).toFixed(0)} AED`
            )
            .join("\n");
        const deliverySection = [
            `*Customer Details:*`,
            `Name: ${details.name}`,
            `Phone: ${details.phone}`,
            `Address: ${details.address}`,
            `City: ${details.city}`,
            details.notes ? `Notes: ${details.notes}` : null,
        ]
            .filter(Boolean)
            .join("\n");
        const message = `*New Order - enJoyful Life*\n\n*Items:*\n${itemLines}\n\n*Total: ${cartSubtotal} AED*\nDelivery: Free\n\n${deliverySection}\n\nPlease confirm my order. Thank you!`;
        track({
            type: "checkout_initiated",
            metadata: { total: cartSubtotal, itemCount: cart.length },
        });
        const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
    }

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <h1 className="font-heading mt-12 text-[32px] text-[var(--color-brand-onyx)] tracking-tight">Your Cart</h1>
                </motion.div>

                {cart.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-24"
                    >
                        <div className="w-24 h-24 rounded-full bg-[var(--color-brand-purple)]/10 flex items-center justify-center mx-auto mb-6">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-brand-purple)]">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                            </svg>
                        </div>
                        <h2 className="mb-4 font-heading text-2xl text-[var(--color-brand-onyx)] tracking-tight">Your cart is empty</h2>
                        <p className="mb-8 font-sans text-[var(--color-brand-onyx)]/60">Looks like you haven&apos;t added anything yet. Start browsing our collection.</p>
                        <Link href="/category/all">
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-block px-8 py-4 rounded-full bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] font-heading font-bold shadow-[0_8px_20px_rgba(244,180,73,0.2)]"
                            >
                                Start Shopping
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Free Shipping Progress Bar */}
                            {showProductPrices && (
                                <div className="bg-white rounded-2xl p-4 border border-[var(--color-brand-onyx)]/5">
                                    {shippingRemaining === 0 ? (
                                        <p className="text-sm font-sans font-medium text-green-600">
                                            🎉 You&apos;ve unlocked free UAE delivery!
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-sans text-[var(--color-brand-onyx)]/70 mb-2">
                                                Add <span className="font-semibold text-[var(--color-brand-onyx)]">{shippingRemaining.toFixed(0)} AED</span> more for free UAE delivery
                                            </p>
                                            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[var(--color-brand-purple)] transition-all duration-500"
                                                    style={{ width: `${shippingProgress}%` }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {cart.map((item, index) => (
                                <motion.div
                                    key={item.product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="flex flex-row gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm"
                                >
                                    <div className="relative w-24 sm:w-32 aspect-[4/5] rounded-xl sm:rounded-[1.5rem] overflow-hidden bg-gray-50 flex-shrink-0">
                                        <Image
                                            src={item.product.image || '/assets/placeholder.jpg'}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1">
                                            <div>
                                                <Link href={`/product/${item.product.id}`} className="hover:underline">
                                                    <h3 className="font-heading font-bold text-base sm:text-xl text-[var(--color-brand-onyx)] line-clamp-2">{item.product.name}</h3>
                                                </Link>
                                                <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/60 mt-0.5">
                                                    {item.product.category}
                                                    {item.product.size && (
                                                        <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-[var(--color-brand-sand)] text-[var(--color-brand-onyx)]/70 text-[11px] font-medium">
                                                            {item.product.size}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            {showProductPrices && (
                                                <Price
                                                    amount={item.product.price}
                                                    reserveSpace={false}
                                                    className="mt-1 sm:mt-0"
                                                    amountClassName="font-heading font-bold text-base sm:text-xl text-[var(--color-brand-onyx)]"
                                                    currencyClassName="font-heading font-bold text-base sm:text-xl text-[var(--color-brand-onyx)]"
                                                />
                                            )}
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <div className="flex items-center border border-[var(--color-brand-onyx)]/10 rounded-full bg-white">
                                                <button
                                                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-onyx)] transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-6 sm:w-8 text-center font-heading font-medium text-xs sm:text-sm text-[var(--color-brand-onyx)]">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-onyx)] transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-500 transition-colors p-1 sm:p-2">
                                                <Trash2 size={18} className="sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="bg-white p-8 rounded-[2rem] shadow-sm sticky top-32"
                            >
                                <h3 className="font-heading font-bold text-2xl text-[var(--color-brand-onyx)] mb-6">Order Summary</h3>
                                {showProductPrices ? (
                                    <>
                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between text-[var(--color-brand-onyx)]/80">
                                                <span>Subtotal</span>
                                                <span className="font-medium">{formatPrice(cartSubtotal) ?? cartSubtotal} AED</span>
                                            </div>
                                            <div className="flex justify-between text-[var(--color-brand-onyx)]/80">
                                                <span>Shipping</span>
                                                <span className="font-medium text-green-600">Free</span>
                                            </div>
                                            <div className="h-px bg-[var(--color-brand-onyx)]/10 my-4" />
                                            <div className="flex justify-between text-xl font-heading font-bold text-[var(--color-brand-onyx)]">
                                                <span>Total</span>
                                                <span>{formatPrice(cartSubtotal) ?? cartSubtotal} AED</span>
                                            </div>
                                        </div>
                                        <motion.button
                                            onClick={() => setShowCheckoutModal(true)}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-4 rounded-full bg-[#25D366] text-white font-heading font-bold text-base shadow-[0_8px_20px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2"
                                        >
                                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Order via WhatsApp
                                        </motion.button>
                                    </>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 rounded-[1rem] p-4 text-amber-800 text-sm">
                                        <p className="font-semibold mb-1">Checkout is temporarily disabled.</p>
                                        <p className="opacity-80">We are currently updating our pricing. Please check back later to complete your purchase.</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>

            <CheckoutModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                onConfirm={handleCheckout}
                total={cartSubtotal}
            />
        </div>
    );
}
