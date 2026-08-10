"use client";

import { motion } from "framer-motion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Truck, RotateCcw, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ShippingReturnsPage() {
    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen pb-16 sm:pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shipping & Returns" }]} />

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-6 mb-10 sm:mb-14"
                >
                    <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-purple)] tracking-[0.25em] uppercase font-semibold mb-2">
                        Customer Care &amp; Logistics
                    </p>
                    <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-[50px] text-[var(--color-brand-onyx)] tracking-tight leading-tight">
                        Shipping &amp; Returns Policy
                    </h1>
                    <p className="mt-3 font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/70 max-w-xl mx-auto">
                        Fast delivery across Dubai, Abu Dhabi &amp; the UAE, backed by our hassle-free 14-day return policy.
                    </p>
                </motion.div>

                <div className="space-y-8">
                    {/* Shipping Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 rounded-[2rem] border border-white/80 shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="font-heading font-bold text-xl sm:text-2xl text-[var(--color-brand-onyx)]">UAE Shipping &amp; Delivery</h2>
                                <p className="font-sans text-xs text-[var(--color-brand-onyx)]/60">Fast, reliable fulfillment across all Emirates</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-[var(--color-brand-sand)]/60 rounded-2xl border border-white/60">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-[var(--color-brand-purple)]" />
                                    <h3 className="font-heading font-bold text-sm text-[var(--color-brand-onyx)]">Dubai &amp; Abu Dhabi</h3>
                                </div>
                                <p className="font-sans text-xs text-[var(--color-brand-onyx)]/70">Standard Delivery: 1 – 2 Business Days</p>
                            </div>

                            <div className="p-4 bg-[var(--color-brand-sand)]/60 rounded-2xl border border-white/60">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-[var(--color-brand-purple)]" />
                                    <h3 className="font-heading font-bold text-sm text-[var(--color-brand-onyx)]">Other Emirates</h3>
                                </div>
                                <p className="font-sans text-xs text-[var(--color-brand-onyx)]/70">Sharjah, Ajman, RAK, Fujairah: 2 – 3 Business Days</p>
                            </div>
                        </div>

                        <div className="space-y-3 font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed">
                            <p>
                                <strong>Complimentary Shipping:</strong> Enjoy FREE standard shipping on all orders totaling <strong>AED 200 or more</strong> across the UAE. For orders under AED 200, a flat shipping fee of AED 15 is applied at checkout.
                            </p>
                            <p>
                                <strong>Order Tracking:</strong> As soon as your order leaves our Dubai warehouse, you will receive an SMS and email containing your tracking link.
                            </p>
                        </div>
                    </motion.div>

                    {/* Returns Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 rounded-[2rem] border border-white/80 shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                                <RotateCcw className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="font-heading font-bold text-xl sm:text-2xl text-[var(--color-brand-onyx)]">14-Day Return &amp; Refund Policy</h2>
                                <p className="font-sans text-xs text-[var(--color-brand-onyx)]/60">Compliant with UAE Consumer Protection Law</p>
                            </div>
                        </div>

                        <div className="space-y-4 font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed mb-6">
                            <p>
                                We want you to be completely delighted with your enJoyful Life experience. If for any reason you are not satisfied, you may return eligible items within <strong>14 days of delivery</strong>.
                            </p>

                            <div className="p-4 bg-white rounded-2xl border border-[var(--color-brand-onyx)]/10 space-y-2">
                                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--color-brand-purple)]">Return Conditions</h4>
                                <ul className="space-y-1.5 text-xs text-[var(--color-brand-onyx)]/80">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                        <span>Items must be unopened, unused, and in their original sealed packaging.</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                        <span>Damaged or defective items are eligible for immediate replacement or full refund.</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        <span>Due to hygiene standards, opened personal care or skincare products cannot be returned unless defective.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* How to Initiate */}
                        <div className="p-5 bg-[var(--color-brand-sand)]/60 rounded-2xl border border-white/80">
                            <h3 className="font-heading font-bold text-base text-[var(--color-brand-onyx)] mb-2">How to Request a Return</h3>
                            <ol className="list-decimal pl-5 space-y-1.5 font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/80">
                                <li>Contact our support team via <Link href="/contact" className="text-[var(--color-brand-purple)] underline font-medium">Contact Us</Link> or email support@enjoyfullife.ae with your order number.</li>
                                <li>Our team will issue a return authorization and schedule a courier pickup from your location in the UAE.</li>
                                <li>Upon receipt and inspection, refunds will be credited back to your original payment card within 5–7 business days.</li>
                            </ol>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
