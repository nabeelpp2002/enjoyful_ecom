import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your Orders | Enjoyful Life",
  description: "View your Enjoyful Life order history and order details.",
  path: "/orders",
  index: false,
});

export default function OrdersLayout({ children }: { children: ReactNode }) { return children; }
