export interface FaqItem {
  q: string;
  a: string;
  category: string;
}

export const FAQ_DATA: FaqItem[] = [
  { category: "Shipping & Delivery", q: "Where does Enjoyful Life deliver?", a: "We deliver across all seven Emirates in the UAE: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah and Umm Al Quwain." },
  { category: "Shipping & Delivery", q: "How long does shipping take in the UAE?", a: "Standard delivery in Dubai and Abu Dhabi typically takes 1–2 business days. Delivery to other Emirates typically takes 2–3 business days." },
  { category: "Shipping & Delivery", q: "Is shipping free?", a: "Standard UAE shipping is complimentary on orders of AED 200 or more. Orders below AED 200 have a flat AED 15 shipping fee." },
  { category: "Shipping & Delivery", q: "Can I track my order?", a: "Yes. Once an order is dispatched, we send its tracking details by SMS and email." },
  { category: "Products & Usage", q: "Are Enjoyful Life products cruelty-free?", a: "Yes. Enjoyful Life states that its ingredients and finished products are not tested on animals." },
  { category: "Products & Usage", q: "Are your formulas suitable for the UAE climate?", a: "Our range includes lightweight, non-greasy and fast-absorbing products suited to daily routines in the UAE's warm climate and air-conditioned interiors." },
  { category: "Products & Usage", q: "Where can I find product ingredients and usage instructions?", a: "Each product page provides the available ingredient, benefit, size and usage information for that item." },
  { category: "Products & Usage", q: "How should I store skincare products in a warm climate?", a: "Keep products in a cool, dry place away from direct sunlight and excessive heat, and follow any storage instructions on the packaging." },
  { category: "Returns & Refunds", q: "What is your return policy?", a: "We offer a 14-day return window for unopened, sealed products in their original packaging and assist when an item arrives damaged or defective." },
  { category: "Returns & Refunds", q: "How do I request a return?", a: "Contact our customer-care team through the Contact page or email hello@enjoyfullife.com with your order details." },
  { category: "Returns & Refunds", q: "When will I receive my refund?", a: "After the returned items are received and inspected, eligible card refunds are processed to the original payment method. Bank processing times may vary." },
  { category: "Payments & Orders", q: "What payment methods do you accept?", a: "The available payment methods are shown during checkout and may include cards, digital wallets and Cash on Delivery within the UAE." },
  { category: "Payments & Orders", q: "How are online payments handled?", a: "Online card payments are handled by the site's payment provider. Enjoyful Life does not store complete card details on its own servers." },
  { category: "Payments & Orders", q: "Can I cancel or modify my order after placing it?", a: "Orders are processed quickly. Contact customer support as soon as possible after ordering and the team will confirm whether a change is still possible." },
];

export const FAQ_CATEGORIES = [
  "All",
  "Shipping & Delivery",
  "Products & Usage",
  "Returns & Refunds",
  "Payments & Orders",
];

