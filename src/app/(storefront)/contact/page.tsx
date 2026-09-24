"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageCircle, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SeoContent } from "@/components/sections/SeoContent";
import { SEO_CONTENT } from "@/data/seo-content";

export default function Contact() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                }),
            });
            if (!res.ok) {
                throw new Error("Server error");
            }
            setSubmitSuccess(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch {
            setSubmitError("Failed to send. Please try WhatsApp directly.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const faqs = [
        {
            question: "What is your shipping policy?",
            answer: "We deliver throughout the UAE. Dubai and Abu Dhabi orders typically arrive in 1–2 business days, while other Emirates typically take 2–3 business days. Standard UAE shipping is complimentary on orders of AED 200 or more.",
        },
        {
            question: "Are your products cruelty-free?",
            answer: "Yes. Enjoyful Life states that its ingredients and finished products are not tested on animals.",
        },
        {
            question: "Can I return a product?",
            answer: "Unopened, sealed products in their original packaging may be returned within 14 days. Please contact customer support with your order details to begin a return.",
        },
        {
            question: "How do I know which products are right for my skin?",
            answer: "Each product page includes detailed information about skin types and concerns. You can also reach out to our skincare specialists for personalized recommendations.",
        },
        {
            question: "Where does Enjoyful Life deliver?",
            answer: "We deliver across all seven Emirates: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah and Umm Al Quwain.",
        },
        {
            question: "How can I get help with an order?",
            answer: "Send us your order details using the contact form or email hello@enjoyfullife.com, and our customer-support team will assist you.",
        },
    ];

    return (
        <div className="bg-[var(--color-brand-sand)] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
                {/* Breadcrumb */}
                <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 sm:mb-16 text-center"
                >
                    <h1 className="mb-4 sm:mb-6 editorial-title display-md font-extrabold text-[34px] sm:text-[56px] leading-tight text-[var(--color-brand-onyx)] tracking-tight">
                        Get in Touch
                    </h1>
                    <p className="editorial-body text-base sm:text-lg text-[var(--color-brand-onyx)]/70 max-w-[600px] mx-auto">
                        Have a question or feedback? We&apos;d love to hear from you. Our team is here to help!
                    </p>
                </motion.div>

                {/* Contact Methods */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-16"
                >
                    <div className="rounded-2xl p-6 sm:p-8 text-center bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                            <Mail size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="mb-3 editorial-heading font-bold text-xl text-[var(--color-brand-onyx)]">
                            Email Us
                        </h3>
                        <a
                            href="mailto:hello@enjoyfullife.com"
                            className="editorial-body text-base text-[var(--color-brand-purple)] hover:underline"
                        >
                            hello@enjoyfullife.com
                        </a>
                    </div>

                    <div className="rounded-2xl p-6 sm:p-8 text-center bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                            <MessageCircle size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="mb-3 editorial-heading font-bold text-xl text-[var(--color-brand-onyx)]">
                            Contact Form
                        </h3>
                        <p className="editorial-body text-base text-[var(--color-brand-onyx)]/70">
                            Mon–Fri, 9am–6pm GST (UTC+4)
                        </p>
                    </div>

                    <div className="rounded-2xl p-6 sm:p-8 text-center bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                            <MapPin size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="mb-3 editorial-heading font-bold text-xl text-[var(--color-brand-onyx)]">
                            Delivery Area
                        </h3>
                        <p className="editorial-body text-base text-[var(--color-brand-purple)]">
                            All seven UAE Emirates
                        </p>
                    </div>
                </motion.div>

                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mb-16 sm:mb-24 max-w-3xl mx-auto rounded-2xl p-6 sm:p-8 md:p-12 bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]"
                >
                    <h2 className="mb-6 sm:mb-8 text-center editorial-section-heading text-2xl sm:text-[32px] text-[var(--color-brand-onyx)] tracking-tight">
                        Send Us a Message
                    </h2>
                    {submitSuccess ? (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                                <Mail size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="mb-3 editorial-heading font-bold text-2xl text-[var(--color-brand-onyx)]">Message Received!</h3>
                            <p className="editorial-body text-base text-[var(--color-brand-onyx)]/70 max-w-sm mx-auto">
                                Thank you for reaching out. Our team will get back to you within 24 hours.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block mb-2 editorial-heading font-bold text-sm text-[var(--color-brand-onyx)]"
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-brand-sand)] border border-[var(--color-brand-onyx)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]/20 editorial-body text-base transition-shadow"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block mb-2 editorial-heading font-bold text-sm text-[var(--color-brand-onyx)]"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-brand-sand)] border border-[var(--color-brand-onyx)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]/20 editorial-body text-base transition-shadow"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="subject"
                                    className="block mb-2 editorial-heading font-bold text-sm text-[var(--color-brand-onyx)]"
                                >
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-brand-sand)] border border-[var(--color-brand-onyx)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]/20 editorial-body text-base transition-shadow"
                                    placeholder="How can we help?"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="message"
                                    className="block mb-2 editorial-heading font-bold text-sm text-[var(--color-brand-onyx)]"
                                >
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-brand-sand)] border border-[var(--color-brand-onyx)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]/20 editorial-body text-base resize-none transition-shadow"
                                    placeholder="Tell us more about your inquiry..."
                                />
                            </div>
                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={isSubmitting ? {} : { y: -2 }}
                                whileTap={isSubmitting ? {} : { scale: 0.98 }}
                                className="w-full py-4 rounded-full bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] editorial-heading font-bold text-base shadow-[0_8px_20px_rgba(244,180,73,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Sending..." : "Send Message"}
                            </motion.button>
                            {submitError && (
                                <p className="text-center editorial-body text-sm text-red-600">
                                    {submitError}
                                </p>
                            )}
                        </form>
                    )}
                </motion.div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto"
                >
                    <h2 className="mb-8 sm:mb-12 text-center editorial-section-heading text-[28px] sm:text-[40px] leading-tight text-[var(--color-brand-onyx)] tracking-tight">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="rounded-2xl overflow-hidden bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full px-6 py-6 sm:px-8 flex justify-between items-center text-left focus:outline-none"
                                >
                                    <span className="editorial-heading font-bold text-lg text-[var(--color-brand-onyx)] pr-4">
                                        {faq.question}
                                    </span>
                                    {openFaq === index ? (
                                        <ChevronUp size={20} className="text-[var(--color-brand-purple)] flex-shrink-0" />
                                    ) : (
                                        <ChevronDown size={20} className="text-[var(--color-brand-purple)] flex-shrink-0" />
                                    )}
                                </button>
                                <AnimatePresence>
                                    {openFaq === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="px-6 sm:px-8 pb-6"
                                        >
                                            <p className="editorial-body text-base text-[var(--color-brand-onyx)]/80 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
            <SeoContent data={SEO_CONTENT.contact} />
        </div>
    );
}
