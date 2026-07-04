"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageCircle, Phone, ChevronDown, ChevronUp } from "lucide-react";
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
            answer: "We offer free shipping on all orders over $50. Standard shipping takes 3-5 business days, and express shipping is available for 1-2 day delivery.",
        },
        {
            question: "Are your products cruelty-free?",
            answer: "Yes! All enJoyful Life products are 100% cruelty-free. We never test on animals and are certified by leading cruelty-free organizations.",
        },
        {
            question: "Can I return a product?",
            answer: "We want you to love your purchase. If you're not satisfied, you can return unused products within 30 days for a full refund or exchange.",
        },
        {
            question: "How do I know which products are right for my skin?",
            answer: "Each product page includes detailed information about skin types and concerns. You can also reach out to our skincare specialists for personalized recommendations.",
        },
        {
            question: "Do you offer samples?",
            answer: "Yes! We include complimentary samples with every order. You can also purchase sample sets to try multiple products before committing to full sizes.",
        },
        {
            question: "Where are your products made?",
            answer: "All enJoyful Life products are formulated and manufactured in sustainable facilities that meet the highest quality and safety standards.",
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
                    <h1 className="mb-4 sm:mb-6 font-heading font-extrabold text-[34px] sm:text-[56px] leading-tight text-[var(--color-brand-onyx)] tracking-tight">
                        Get in Touch
                    </h1>
                    <p className="font-sans text-base sm:text-lg text-[var(--color-brand-onyx)]/70 max-w-[600px] mx-auto">
                        Have a question or feedback? We'd love to hear from you. Our team is here to help!
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
                        <h3 className="mb-3 font-heading font-bold text-xl text-[var(--color-brand-onyx)]">
                            Email Us
                        </h3>
                        <a
                            href="mailto:hello@enjoyfullife.com"
                            className="font-sans text-base text-[var(--color-brand-purple)] hover:underline"
                        >
                            hello@enjoyfullife.com
                        </a>
                    </div>

                    <div className="rounded-2xl p-6 sm:p-8 text-center bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                            <MessageCircle size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="mb-3 font-heading font-bold text-xl text-[var(--color-brand-onyx)]">
                            Live Chat
                        </h3>
                        <p className="font-sans text-base text-[var(--color-brand-onyx)]/70">
                            Mon-Fri, 9am-6pm EST
                        </p>
                    </div>

                    <div className="rounded-2xl p-6 sm:p-8 text-center bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                            <Phone size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="mb-3 font-heading font-bold text-xl text-[var(--color-brand-onyx)]">
                            Call Us
                        </h3>
                        <a
                            href="tel:+1234567890"
                            className="font-sans text-base text-[var(--color-brand-purple)] hover:underline"
                        >
                            +1 (234) 567-890
                        </a>
                    </div>
                </motion.div>

                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mb-16 sm:mb-24 max-w-3xl mx-auto rounded-2xl p-6 sm:p-8 md:p-12 bg-white shadow-[0_4px_20px_rgba(26,26,27,0.04)]"
                >
                    <h2 className="mb-6 sm:mb-8 text-center font-heading font-bold text-2xl sm:text-[32px] text-[var(--color-brand-onyx)] tracking-tight">
                        Send Us a Message
                    </h2>
                    {submitSuccess ? (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                                <Mail size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="mb-3 font-heading font-bold text-2xl text-[var(--color-brand-onyx)]">Message Received!</h3>
                            <p className="font-sans text-base text-[var(--color-brand-onyx)]/70 max-w-sm mx-auto">
                                Thank you for reaching out. Our team will get back to you within 24 hours.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block mb-2 font-heading font-bold text-sm text-[var(--color-brand-onyx)]"
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-brand-sand)] border border-[var(--color-brand-onyx)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]/20 font-sans text-base transition-shadow"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block mb-2 font-heading font-bold text-sm text-[var(--color-brand-onyx)]"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-brand-sand)] border border-[var(--color-brand-onyx)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]/20 font-sans text-base transition-shadow"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="subject"
                                    className="block mb-2 font-heading font-bold text-sm text-[var(--color-brand-onyx)]"
                                >
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-brand-sand)] border border-[var(--color-brand-onyx)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]/20 font-sans text-base transition-shadow"
                                    placeholder="How can we help?"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="message"
                                    className="block mb-2 font-heading font-bold text-sm text-[var(--color-brand-onyx)]"
                                >
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-brand-sand)] border border-[var(--color-brand-onyx)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]/20 font-sans text-base resize-none transition-shadow"
                                    placeholder="Tell us more about your inquiry..."
                                />
                            </div>
                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={isSubmitting ? {} : { y: -2 }}
                                whileTap={isSubmitting ? {} : { scale: 0.98 }}
                                className="w-full py-4 rounded-full bg-[var(--color-brand-mustard)] text-[var(--color-brand-onyx)] font-heading font-bold text-base shadow-[0_8px_20px_rgba(244,180,73,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Sending..." : "Send Message"}
                            </motion.button>
                            {submitError && (
                                <p className="text-center font-sans text-sm text-red-600">
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
                    <h2 className="mb-8 sm:mb-12 text-center font-heading font-bold text-[28px] sm:text-[40px] leading-tight text-[var(--color-brand-onyx)] tracking-tight">
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
                                    <span className="font-heading font-bold text-lg text-[var(--color-brand-onyx)] pr-4">
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
                                            <p className="font-sans text-base text-[var(--color-brand-onyx)]/80 leading-relaxed">
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
