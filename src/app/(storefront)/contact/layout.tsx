import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import { pageMetadata, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact Enjoyful Life | Customer Support UAE',
  description:
    'Contact Enjoyful Life for product questions, order support, delivery help and returns across the United Arab Emirates.',
  path: '/contact',
});

const contactPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': `${SITE_URL}/contact#webpage`,
  url: `${SITE_URL}/contact`,
  name: 'Contact Enjoyful Life',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  about: { '@id': `${SITE_URL}/#organization` },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={contactPageJsonLd} />
      {children}
    </>
  );
}
