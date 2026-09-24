import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "UAE Shipping, Delivery & Returns | Enjoyful Life",
  description:
    "Read Enjoyful Life shipping times and fees for Dubai, Abu Dhabi and the other UAE Emirates, plus the 14-day returns process.",
  path: "/shipping-returns",
});

export default function ShippingReturnsLayout({ children }: { children: ReactNode }) {
  return children;
}

