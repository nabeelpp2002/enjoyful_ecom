"use client";

import { motion } from "framer-motion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Scale, ShoppingBag, CreditCard, ShieldAlert, Award } from "lucide-react";

export default function TermsOfServicePage() {
    const lastUpdated = "August 10, 2026";

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen pb-16 sm:pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-6 mb-10 sm:mb-14"
                >
                    <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-purple)] tracking-[0.25em] uppercase font-semibold mb-2">
                        Legal &amp; Governance
                    </p>
                    <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-[50px] text-[var(--color-brand-onyx)] tracking-tight leading-tight">
                        Terms &amp; Conditions
                    </h1>
                    <p className="mt-3 font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/60">
                        Governed by the Federal Laws of the United Arab Emirates &amp; UAE Consumer Protection Framework
                    </p>
                    <p className="mt-1 font-sans text-xs text-[var(--color-brand-onyx)]/50">
                        Last Updated: {lastUpdated}
                    </p>
                </motion.div>

                {/* Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 lg:p-12 rounded-[2rem] border border-white/80 shadow-xl space-y-8 font-sans text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed"
                >
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <Scale className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">1. General Terms</h2>
                        </div>
                        <p>
                            Welcome to <strong>enJoyful Life</strong>. By accessing or purchasing from our website (enjoyfullife.ae), you agree to be bound by these Terms and Conditions. These terms apply to all visitors, registered customers, and users in the United Arab Emirates and globally.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <ShoppingBag className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">2. Orders, Pricing &amp; Currency</h2>
                        </div>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>All prices on our storefront are displayed in <strong>United Arab Emirates Dirhams (AED)</strong> and are inclusive of 5% UAE Value Added Tax (VAT) where applicable.</li>
                            <li>We reserve the right to modify prices or adjust product availability at any time without prior notice.</li>
                            <li>Order confirmation constitutes an offer to purchase, which becomes a binding contract upon dispatch of goods from our Dubai distribution hub.</li>
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <CreditCard className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">3. Payments &amp; Security</h2>
                        </div>
                        <p>
                            We accept online payments using Visa, MasterCard, Apple Pay, and Cash on Delivery (COD) within the UAE. All card payments are processed securely through PCI-DSS certified gateway partners. Customers paying by card must maintain full legal authority over the card used.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <Award className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">4. Intellectual Property</h2>
                        </div>
                        <p>
                            All brand assets, text content, editorial imagery, graphics, logos, and product designs on this site are the exclusive property of enJoyful Life and are protected by UAE and International Copyright &amp; Trademark Laws.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldAlert className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">5. Governing Law &amp; Jurisdiction</h2>
                        </div>
                        <p>
                            These terms shall be governed by and construed in accordance with the Federal Laws of the United Arab Emirates and the local laws of the Emirate of Dubai. Any dispute arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent Courts of Dubai, UAE.
                        </p>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}
