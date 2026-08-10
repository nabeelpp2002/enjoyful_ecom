"use client";

import { motion } from "framer-motion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ShieldCheck, Lock, Eye, FileText, Bell, Server } from "lucide-react";

export default function PrivacyPolicyPage() {
    const lastUpdated = "August 10, 2026";

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen pb-16 sm:pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-6 mb-10 sm:mb-14"
                >
                    <p className="font-sans text-xs sm:text-sm text-[var(--color-brand-purple)] tracking-[0.25em] uppercase font-semibold mb-2">
                        Legal &amp; Compliance
                    </p>
                    <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-[50px] text-[var(--color-brand-onyx)] tracking-tight leading-tight">
                        Privacy Policy
                    </h1>
                    <p className="mt-3 font-sans text-xs sm:text-sm text-[var(--color-brand-onyx)]/60">
                        Compliant with UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL)
                    </p>
                    <p className="mt-1 font-sans text-xs text-[var(--color-brand-onyx)]/50">
                        Last Updated: {lastUpdated}
                    </p>
                </motion.div>

                {/* Main Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 lg:p-12 rounded-[2rem] border border-white/80 shadow-xl space-y-8 font-sans text-sm text-[var(--color-brand-onyx)]/80 leading-relaxed"
                >
                    {/* Section 1 */}
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldCheck className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">1. Introduction</h2>
                        </div>
                        <p>
                            enJoyful Life (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to respecting your privacy and safeguarding your personal information. This Privacy Policy outlines how we collect, use, store, and protect your personal data when you visit or make a purchase from our storefront at <strong>enjoyfullife.ae</strong> in accordance with the laws of the United Arab Emirates (UAE), including Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL).
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <Eye className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">2. Information We Collect</h2>
                        </div>
                        <p className="mb-3">When you interact with our website, we collect information necessary to fulfill your orders and improve your shopping experience:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Identity &amp; Contact Data:</strong> Your name, delivery address within the UAE or GCC, email address, and mobile phone number for order tracking via SMS.</li>
                            <li><strong>Transaction Data:</strong> Details about payments, order history, billing addresses, and items purchased. (Note: Financial credit/debit card data is processed directly via PCI-DSS compliant payment gateways and is never stored on our servers).</li>
                            <li><strong>Technical &amp; Device Data:</strong> IP address, browser type, device information, and browsing patterns on our site gathered through secure cookies.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <Lock className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">3. How We Use Your Data</h2>
                        </div>
                        <p className="mb-3">We use your personal data strictly for legitimate business purposes:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>To process, fulfill, ship, and deliver your skincare and personal care orders across the UAE.</li>
                            <li>To communicate order status updates, shipment tracking, and customer service support.</li>
                            <li>To comply with UAE legal obligations, anti-fraud regulations, and consumer tax laws.</li>
                            <li>With your consent, to send personalized offers, brand news, and skincare tips. You can opt out at any time.</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <Server className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">4. Data Sharing &amp; Third Parties</h2>
                        </div>
                        <p>
                            We do not sell, rent, or trade your personal information to third parties. We only share necessary data with trusted service providers who help operate our platform:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>UAE courier &amp; logistics partners (for parcel delivery).</li>
                            <li>Licensed payment processors &amp; banks (for transaction authorization).</li>
                            <li>IT infrastructure and security service providers.</li>
                        </ul>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <FileText className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">5. Your Data Protection Rights (UAE PDPL)</h2>
                        </div>
                        <p className="mb-2">Under the UAE Personal Data Protection Law, you have rights regarding your personal information:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
                            <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete information.</li>
                            <li><strong>Right to Erasure:</strong> Request deletion of your personal data when no longer required for legal obligations.</li>
                            <li><strong>Right to Withdraw Consent:</strong> Opt out of marketing communications at any time.</li>
                        </ul>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <Bell className="w-5 h-5 text-[var(--color-brand-purple)]" />
                            <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">6. Contact Us Regarding Privacy</h2>
                        </div>
                        <p>
                            If you have any questions or wish to exercise your data protection rights, please contact our Data Protection Office:
                        </p>
                        <div className="mt-3 p-4 bg-[var(--color-brand-sand)]/60 rounded-xl border border-white/60">
                            <p className="font-heading font-semibold text-[var(--color-brand-onyx)]">enJoyful Life — Data Protection Office</p>
                            <p className="font-sans text-xs text-[var(--color-brand-onyx)]/70">Dubai, United Arab Emirates</p>
                            <p className="font-sans text-xs text-[var(--color-brand-onyx)]/70 mt-1">Email: privacy@enjoyfullife.ae</p>
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}
