import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'About Enjoyful Life — Our Story | Natural Skincare UAE',
  description:
    'Learn about Enjoyful Life, a UAE-founded premium natural skincare brand. Cruelty-free, dermatologist-tested formulas crafted for UAE skin types.',
  openGraph: {
    title: 'About Enjoyful Life — Our Story | Natural Skincare UAE',
    description:
      'Enjoyful Life is a UAE-founded premium natural skincare brand dedicated to cruelty-free, effective formulas for every skin type.',
    url: 'https://enjoyfullife.com/about',
    images: [
      {
        url: '/og/about.jpg',
        width: 1200,
        height: 630,
        alt: 'About Enjoyful Life Natural Skincare UAE',
      },
    ],
  },
  alternates: { canonical: 'https://enjoyfullife.com/about' },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
