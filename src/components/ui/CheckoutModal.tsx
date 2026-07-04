"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type DeliveryDetails = {
    name: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
};

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (details: DeliveryDetails) => void;
    total: number;
}

export function CheckoutModal({ isOpen, onClose, onConfirm, total }: CheckoutModalProps) {
    const [details, setDetails] = useState<DeliveryDetails>({
        name: "",
        phone: "",
        address: "",
        city: "",
        notes: "",
    });

    if (!isOpen) return null;

    const isValid =
        details.name.length > 0 &&
        details.phone.length > 0 &&
        details.address.length > 0 &&
        details.city.length > 0;

    function handleChange(field: keyof DeliveryDetails, value: string) {
        setDetails((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid) return;
        onConfirm(details);
    }

    const inputClass =
        "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-purple)] focus:outline-none text-sm font-sans";
    const labelClass =
        "block text-xs font-semibold text-[var(--color-brand-onyx)]/70 uppercase tracking-wider mb-1";

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-onyx)]"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <h2 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)] pr-8">
                    Almost There! 🛍️
                </h2>
                <p className="text-sm text-[var(--color-brand-onyx)]/60 mt-1 mb-4">
                    Order Total: {total.toFixed(0)} AED
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="checkout-name" className={labelClass}>
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="checkout-name"
                            type="text"
                            className={inputClass}
                            placeholder="Your full name"
                            value={details.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="checkout-phone" className={labelClass}>
                            Phone Number <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="checkout-phone"
                            type="tel"
                            className={inputClass}
                            placeholder="+971 XX XXX XXXX"
                            value={details.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="checkout-address" className={labelClass}>
                            Delivery Address <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="checkout-address"
                            type="text"
                            className={inputClass}
                            placeholder="Street, building, apartment"
                            value={details.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="checkout-city" className={labelClass}>
                            City <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="checkout-city"
                            type="text"
                            className={inputClass}
                            placeholder="Dubai, Abu Dhabi, Sharjah…"
                            value={details.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="checkout-notes" className={labelClass}>
                            Order Notes
                        </label>
                        <textarea
                            id="checkout-notes"
                            className={`${inputClass} resize-none`}
                            placeholder="Any special instructions? (optional)"
                            rows={2}
                            value={details.notes}
                            onChange={(e) => handleChange("notes", e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!isValid}
                        className={`w-full py-3.5 rounded-full bg-[#25D366] text-white font-heading font-bold text-sm mt-4 flex items-center justify-center gap-2 transition-opacity ${
                            !isValid ? "opacity-50 cursor-not-allowed" : "hover:brightness-105"
                        }`}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-4 h-4 fill-current flex-shrink-0"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Complete Order on WhatsApp →
                    </button>

                    <p className="text-center text-xs text-[var(--color-brand-onyx)]/40 mt-2">
                        We only use these details for your delivery
                    </p>
                </form>
            </div>
        </div>
    );
}
