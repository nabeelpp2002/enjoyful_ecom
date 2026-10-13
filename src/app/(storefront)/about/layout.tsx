import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  FOUNDER_NAME,
  FOUNDER_ROLE,
  pageMetadata,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Enjoyful Life | Personal Care Brand in the UAE",
  description:
    "Learn about Enjoyful Life, founder and CEO Aslam, the brand’s approach to skincare and personal care, and its collections for customers across the UAE.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#about-page`,
    url: `${SITE_URL}/about`,
    name: `About ${SITE_NAME}`,
    description: metadata.description,
    about: [
      { "@id": `${SITE_URL}/#organization` },
      { "@id": `${SITE_URL}/about#founder` },
    ],
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE_URL}/about#founder`,
      name: FOUNDER_NAME,
      jobTitle: FOUNDER_ROLE,
      image: `${SITE_URL}/assets/aslam_ceo.png`,
      url: `${SITE_URL}/about#founder`,
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
  };

  return (
    <>
      <JsonLd data={aboutPageJsonLd} />
      {children}
    </>
  );
}
