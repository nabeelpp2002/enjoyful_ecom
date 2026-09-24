import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'About Enjoyful Life | Personal Care Brand in the UAE',
  description:
    'Learn about Enjoyful Life, its approach to skincare and personal care, and the collections it offers to customers across the UAE.',
  path: '/about',
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
