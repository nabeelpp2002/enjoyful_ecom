import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy | Enjoyful Life UAE",
  description:
    "Learn how Enjoyful Life collects, uses and protects customer and website data in accordance with applicable UAE privacy requirements.",
  path: "/privacy-policy",
});

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}

