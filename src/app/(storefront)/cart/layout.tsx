import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your Cart | Enjoyful Life",
  description: "Review the products in your Enjoyful Life shopping cart.",
  path: "/cart",
  index: false,
});

export default function CartLayout({ children }: { children: ReactNode }) { return children; }

