import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contact Us | Enjoyful Life Skincare UAE',
  description:
    'Get in touch with Enjoyful Life. Order support, product enquiries, and returns. WhatsApp available 9am–6pm GST (UTC+4). UAE customers welcome.',
  openGraph: {
    title: 'Contact Enjoyful Life | Skincare Support UAE',
    description:
      'Reach our team via WhatsApp, email, or our contact form. Order support available 9am–6pm GST.',
    url: 'https://enjoyfullife.com/contact',
  },
  alternates: { canonical: 'https://enjoyfullife.com/contact' },
};

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Enjoyful Life',
  url: 'https://enjoyfullife.com',
  image: 'https://enjoyfullife.com/enjoyfullogo.png',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'AE',
    addressRegion: 'Dubai',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['English', 'Arabic'],
    areaServed: ['AE'],
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is your shipping policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We offer free shipping on all orders over 150 AED within UAE. Standard shipping takes 2–5 business days.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are your products cruelty-free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! All Enjoyful Life products are 100% cruelty-free. We never test on animals.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I return a product?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We want you to love your purchase. If you are not satisfied, you can return unused products within 30 days for a full refund or exchange.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I know which products are right for my skin?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each product page includes detailed information about skin types and concerns. You can also reach out to our skincare specialists for personalised recommendations.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where are your products made?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All Enjoyful Life products are formulated and manufactured in facilities that meet the highest quality and safety standards.',
      },
    },
  ],
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
