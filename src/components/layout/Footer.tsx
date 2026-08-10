import Link from "next/link";
import { Instagram, Facebook, Youtube } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-white py-12 md:py-16 border-t border-[var(--color-brand-onyx)]/5">
            <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-8">

                {/* Brand Info */}
                <div className="col-span-2 md:col-span-1 flex flex-row md:flex-col items-start md:items-start text-left gap-3 md:gap-6">
                    <img src="/assets/Enjoyful_logo_transparent.png" alt="enJoyful Life Logo" className="h-[5rem] md:h-[6.5rem] w-auto opacity-90 -ml-2 flex-shrink-0" />
                    <p className="font-sans text-sm text-[var(--color-brand-onyx)]/70 leading-relaxed max-w-sm md:max-w-sm self-center md:self-start">
                        Premium natural skincare and daily essentials crafted to protect and nourish your skin every single day.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="flex flex-col gap-3 md:gap-4 text-left items-start col-span-1">
                    <h4 className="font-heading font-bold text-[var(--color-brand-onyx)] tracking-wider uppercase text-sm mb-1 md:mb-2">Shop</h4>
                    <Link href="/category/glow" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Glow Collection</Link>
                    <Link href="/category/daily" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Daily Essentials</Link>
                    <Link href="/category/baby" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Baby Care</Link>
                    <Link href="/category/fragrances" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Fragrances</Link>
                    <Link href="/category/home-care" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Home Care</Link>
                </div>

                {/* Customer Service */}
                <div className="flex flex-col gap-3 md:gap-4 text-left items-start col-span-1">
                    <h4 className="font-heading font-bold text-[var(--color-brand-onyx)] tracking-wider uppercase text-sm mb-1 md:mb-2">Support</h4>
                    <Link href="/about" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">About Us</Link>
                    <Link href="/contact" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Contact Us</Link>
                    <Link href="/shipping-returns" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Shipping &amp; Returns</Link>
                    <Link href="/faq" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">FAQ</Link>
                    <Link href="/privacy-policy" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Privacy Policy</Link>
                    <Link href="/terms-of-service" className="font-sans text-sm text-[var(--color-brand-onyx)]/70 hover:text-[var(--color-brand-purple)] transition-colors">Terms of Service</Link>
                </div>

                {/* Newsletter / Social */}
                {/* Newsletter / Social */}
                <div className="flex flex-col gap-3 md:gap-4 text-left items-start col-span-2 md:col-span-1 mt-2 md:mt-0">
                    <h4 className="font-heading font-bold text-[var(--color-brand-onyx)] tracking-wider uppercase text-sm mb-1 md:mb-2">Stay Connected</h4>
                    <p className="font-sans text-sm text-[var(--color-brand-onyx)]/70 leading-relaxed max-w-sm md:max-w-none">
                        Join our mailing list for updates on new collections and exclusive offers.
                    </p>
                    <div className="flex flex-col md:flex-row gap-2 mt-2 w-full max-w-sm md:max-w-none">
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="bg-[var(--color-brand-sand)] border-none rounded-md px-4 py-3 md:py-2 font-sans text-sm flex-1 outline-none focus:ring-1 focus:ring-[var(--color-brand-purple)]"
                        />
                        <button className="bg-[var(--color-brand-onyx)] text-white px-4 py-3 md:py-2 rounded-md font-sans text-sm font-semibold hover:bg-[var(--color-brand-purple)] transition-colors text-center w-full md:w-auto">
                            Subscribe
                        </button>
                    </div>
                </div>

            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-8 mt-12 md:mt-16 pt-6 md:pt-8 border-t border-[var(--color-brand-onyx)]/5 flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-4">
                <p className="font-sans text-xs text-[var(--color-brand-onyx)]/50">
                    © {new Date().getFullYear()} enJoyful Life. All rights reserved. Dubai, UAE &nbsp;|&nbsp; GST (UTC+4) &nbsp;|&nbsp; +971 XX XXX XXXX (UAE)
                </p>
                <div className="flex gap-4">
                    <a href="https://instagram.com/enjoyfullife" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-purple)] transition-colors" aria-label="Instagram">
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a href="https://facebook.com/enjoyfullife" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-purple)] transition-colors" aria-label="Facebook">
                        <Facebook className="w-5 h-5" />
                    </a>
                    <a href="https://youtube.com/enjoyfullife" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-purple)] transition-colors" aria-label="YouTube">
                        <Youtube className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
