import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#F9F5F0",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://enjoyfullife.com"),
  title: {
    default: "Enjoyful Life — Premium Natural Skincare UAE & UK | Free UAE Delivery",
    template: "%s | Enjoyful Life",
  },
  description:
    "Shop premium natural skincare in UAE and UK. Cruelty-free, dermatologist-tested face serums, body care, baby skincare, home fragrances and more. Free delivery across UAE.",
  keywords: [
    "natural skincare UAE",
    "premium skincare Dubai",
    "cruelty free skincare",
    "organic face serum UAE",
    "baby skincare UAE",
    "skincare online UAE",
    "skincare delivery Dubai",
    "buy skincare UK",
    "Enjoyful Life",
  ],
  authors: [{ name: "Enjoyful Life" }],
  creator: "Enjoyful Life",
  publisher: "Enjoyful Life",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "https://enjoyfullife.com" },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_AE",
    alternateLocale: ["en_GB", "ar_AE"],
    url: "https://enjoyfullife.com",
    siteName: "Enjoyful Life",
    title: "Enjoyful Life — Premium Natural Skincare UAE & UK",
    description:
      "Discover premium natural skincare crafted for UAE and UK customers. Free UAE delivery. Cruelty-free. Dermatologist-tested.",
    images: [
      {
        url: "/og/homepage.jpg",
        width: 1200,
        height: 630,
        alt: "Enjoyful Life Premium Natural Skincare",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@enjoyfullife",
    creator: "@enjoyfullife",
    title: "Enjoyful Life — Premium Natural Skincare UAE & UK",
    description:
      "Discover premium natural skincare crafted for UAE and UK customers. Free UAE delivery. Cruelty-free.",
    images: ["/og/homepage.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AE">
      <body
        className={`${openSans.variable} ${montserrat.variable} antialiased min-h-screen flex flex-col bg-[#fdfaff]`}
      >
        {children}
      </body>
    </html>
  );
}
