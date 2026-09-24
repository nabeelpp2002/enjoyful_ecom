import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your Wishlist | Enjoyful Life",
  description: "View products saved to your Enjoyful Life wishlist.",
  path: "/wishlist",
  index: false,
});

export default function WishlistLayout({ children }: { children: ReactNode }) { return children; }

