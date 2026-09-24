import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions | Enjoyful Life UAE",
  description:
    "Review the terms governing orders, pricing, payments, intellectual property and use of the Enjoyful Life UAE online store.",
  path: "/terms-of-service",
});

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}

