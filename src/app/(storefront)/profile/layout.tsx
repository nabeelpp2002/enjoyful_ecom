import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your Account | Enjoyful Life",
  description: "Manage your Enjoyful Life account.",
  path: "/profile",
  index: false,
});

export default function ProfileLayout({ children }: { children: ReactNode }) { return children; }

