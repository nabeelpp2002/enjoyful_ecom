import { UAE_SHIPPING_DESCRIPTION } from "@/lib/shipping";

export function TopOfferBar() {
    return (
        <div className="fixed top-0 inset-x-0 z-50 h-10 bg-[var(--color-brand-purple)] text-white flex items-center justify-center text-sm editorial-body tracking-wide">
            <p>{UAE_SHIPPING_DESCRIPTION}</p>
        </div>
    );
}
