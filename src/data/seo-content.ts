// SEO content blocks rendered above the footer by <SeoContent />.
// Purely additive editorial copy + FAQs + internal links. No design impact.
// Written for the UAE, Dubai, Abu Dhabi, and GCC markets in a premium brand voice.

export interface SeoFaq {
    q: string;
    a: string;
}
export interface SeoLink {
    label: string;
    href: string;
}
export interface SeoBlock {
    heading: string;
    paragraphs: string[];
    links: SeoLink[];
    faqs: SeoFaq[];
}

const SHARED_LINKS: SeoLink[] = [
    { label: "Glow Skincare", href: "/category/glow" },
    { label: "Daily Essentials", href: "/category/daily" },
    { label: "Baby Care", href: "/category/baby" },
    { label: "Fragrances", href: "/category/fragrances" },
    { label: "Home & Wellness", href: "/category/home" },
];

export const SEO_CONTENT: Record<string, SeoBlock> = {
    // ─── HOMEPAGE ────────────────────────────────────────────────────────────
    homepage: {
        heading: "Premium Natural Skincare, Made for Life in the UAE and GCC",
        paragraphs: [
            "Enjoyful Life is a premium personal-care brand built around a simple belief: effective skincare should feel as good as it works. Every formula is crafted with carefully chosen, naturally derived ingredients and finished to a standard that holds its own beside the world's leading beauty houses — yet remains genuinely accessible to families across Dubai, Abu Dhabi, and throughout the UAE and GCC.",
            "Our collections are designed for real routines and real climates. The Gulf's heat and humidity, air-conditioned interiors and hard water ask a lot of your skin and hair; our lightweight, fast-absorbing textures are formulated with that daily reality in mind. From brightening facial care to nourishing body and hair essentials, gentle baby products and beautifully composed home fragrances, each range works together as a considered ritual rather than a collection of one-off purchases.",
            "We hold ourselves to high standards across the board. Our products are cruelty-free and dermatologically considered, made without unnecessary harsh additives, and presented with clear ingredient transparency so you always know what you are putting on your skin. Thoughtful formulation, honest labelling and premium presentation are not extras for us — they are the baseline.",
            "Shopping with Enjoyful Life is designed to be effortless. Browse by concern or category, explore detailed product pages with full ingredient information, and check out in moments. We offer fast, reliable delivery across the UAE — with complimentary shipping on qualifying orders — and a responsive team ready to help you build the right routine for your skin, your family and your home.",
            "Whether you are starting your first proper skincare regimen, refining an established one, or searching for a refined gift, Enjoyful Life brings together quality, care and a sense of everyday luxury. Explore the collections below and discover why customers across the UAE and GCC are making us part of their daily ritual.",
        ],
        links: [
            ...SHARED_LINKS,
            { label: "Our Story", href: "/about" },
            { label: "Skincare Journal", href: "/blog" },
        ],
        faqs: [
            { q: "Where does Enjoyful Life deliver?", a: "We deliver across the United Arab Emirates — including Dubai, Abu Dhabi, Sharjah and the Northern Emirates — and throughout the GCC region. Delivery times and any free-shipping thresholds are shown at checkout." },
            { q: "Are Enjoyful Life products cruelty-free?", a: "Yes. All of our products are cruelty-free. We do not test on animals at any stage, and we work only with suppliers who share that commitment." },
            { q: "Are your formulas suitable for sensitive skin?", a: "Many of our formulas are created with sensitive and reactive skin in mind, using gentle, naturally derived ingredients. We recommend reading each product's ingredient list and patch-testing a small area first if you have known sensitivities." },
            { q: "Do your products suit the UAE climate?", a: "They are designed for it. Our textures are lightweight, fast-absorbing and non-greasy so they perform well in heat, humidity and air-conditioned environments common across the Gulf." },
            { q: "How do I choose the right products for my routine?", a: "Start by shopping the category that matches your goal — Glow for facial care, Daily for body and hair, Baby for little ones, Fragrances for scent, and Home for wellness. Each product page lists key benefits, ingredients and usage guidance to help you build a complete routine." },
            { q: "What payment and checkout options are available?", a: "Checkout is quick and secure. You can complete your order online and confirm details directly with our team, including delivery address and any special instructions, before dispatch." },
            { q: "Are your products natural and free from harsh chemicals?", a: "We formulate with naturally derived ingredients and avoid unnecessary harsh additives. Full ingredient lists are published on every product page so you can make an informed choice." },
            { q: "Can I order Enjoyful Life products as a gift?", a: "Absolutely. Our fragrances, glow sets and body care make refined gifts. Add a delivery note at checkout and we will take care of the rest." },
            { q: "How should I store my skincare in a hot climate?", a: "Keep products out of direct sunlight and away from prolonged heat. A cool, dry cupboard or a shaded shelf is ideal; some customers refrigerate lightweight gels and mists for an extra-refreshing finish." },
            { q: "How can I contact Enjoyful Life for support?", a: "Visit our Contact page to reach us by WhatsApp, email or the enquiry form. Our team responds quickly during business hours (GST, UTC+4) and is happy to advise on products, orders and routines." },
        ],
    },

    // ─── GLOW ────────────────────────────────────────────────────────────────
    glow: {
        heading: "The Glow Collection — Radiant, Healthy-Looking Skin",
        paragraphs: [
            "Our Glow Collection is dedicated to facial care that brightens, balances and refines. From gentle cleansers and exfoliating scrubs to hydrating masks, toners and protective sunscreen, each formula is built to support a clear, luminous complexion in the demanding climate of the UAE and GCC region.",
            "Glow products are formulated with naturally derived, skin-loving ingredients and lightweight textures that absorb quickly without heaviness — ideal for Dubai and Abu Dhabi routines where heat, humidity and air conditioning can leave skin dull or dehydrated. Whether your goal is brightness, even tone, smoother texture or simple daily protection, there is a step here to anchor your regimen.",
            "For best results, layer thoughtfully: cleanse, treat with a serum or scrub suited to your concern, hydrate, and finish with sunscreen during the day. Consistency matters more than complexity, and our detailed product pages make it easy to choose formulas that work together rather than against each other.",
            "Cruelty-free, transparently labelled and crafted to a premium standard, the Glow Collection brings considered facial care to everyday life — with fast UAE delivery and a team ready to help you find your perfect routine.",
        ],
        links: [
            { label: "Daily Essentials", href: "/category/daily" },
            { label: "Baby Care", href: "/category/baby" },
            { label: "Fragrances", href: "/category/fragrances" },
            { label: "Our Story", href: "/about" },
            { label: "Skincare Journal", href: "/blog" },
        ],
        faqs: [
            { q: "What is the Glow Collection best for?", a: "It focuses on facial care — brightening, hydration, gentle exfoliation, toning and sun protection — to support a clear, radiant, healthy-looking complexion." },
            { q: "In what order should I apply Glow products?", a: "A simple sequence works best: cleanse, exfoliate or treat (a few times a week), tone, hydrate, then apply sunscreen in the morning. Night routines can skip sunscreen and add richer hydration." },
            { q: "Are Glow products suitable for oily or combination skin?", a: "Yes. The lightweight, non-greasy textures suit oily and combination skin, while hydrating formulas support drier or sensitive types. Check each product page for skin-type guidance." },
            { q: "How often should I exfoliate?", a: "For most skin types, two to three times a week is enough. Over-exfoliating can disrupt the skin barrier, so listen to your skin and reduce frequency if you notice irritation." },
            { q: "Do I really need sunscreen in the UAE?", a: "Yes — daily sun protection is essential in the Gulf's high-UV environment, even indoors near windows. It is one of the most effective steps for maintaining bright, even-toned skin." },
            { q: "Are the formulas cruelty-free and natural?", a: "All Glow products are cruelty-free and made with naturally derived ingredients, with full ingredient lists published on each product page." },
            { q: "Can I use Glow products with sensitive skin?", a: "Many are formulated to be gentle, but if your skin is reactive, introduce one product at a time and patch-test first. Our team can help you choose suitable options." },
            { q: "How long until I see results?", a: "Hydration and radiance can improve quickly, while tone and texture goals typically need consistent use over several weeks. Sticking to a routine is key." },
        ],
    },

    // ─── DAILY ───────────────────────────────────────────────────────────────
    daily: {
        heading: "Daily Essentials — Body and Hair Care for Every Day",
        paragraphs: [
            "Daily Essentials brings together the body and hair products that anchor your routine: nourishing body lotions and creams, refreshing shower gels, gentle shampoos and conditioners, replenishing hair oils and serums, and more. Each is made to leave skin and hair soft, balanced and cared for from morning to night.",
            "Life in Dubai, Abu Dhabi and across the UAE — sun, heat, frequent washing and hard water — can leave skin tight and hair dry. Our formulas are designed to restore comfort and shine without heaviness, using naturally derived ingredients and lightweight textures that suit the Gulf and GCC climates.",
            "Building a dependable daily ritual is simple: cleanse with a gel suited to your skin, lock in moisture with a body lotion or cream while skin is still damp, and treat hair with the right shampoo, conditioner and oil for your type. Small, consistent steps make a visible difference over time.",
            "Cruelty-free, transparently formulated and premium in feel, Daily Essentials makes everyday care something to look forward to — delivered quickly across the UAE with support whenever you need it.",
        ],
        links: [
            { label: "Glow Skincare", href: "/category/glow" },
            { label: "Baby Care", href: "/category/baby" },
            { label: "Home & Wellness", href: "/category/home" },
            { label: "Our Story", href: "/about" },
            { label: "Skincare Journal", href: "/blog" },
        ],
        faqs: [
            { q: "What does the Daily Essentials range include?", a: "It covers everyday body and hair care — body lotions and creams, shower gels, shampoos and conditioners, hair oils and serums, and related essentials." },
            { q: "How do I keep skin hydrated in the UAE heat?", a: "Apply a body lotion or cream while skin is still slightly damp after showering to seal in moisture, and reapply to dry areas as needed. Lightweight formulas absorb quickly without feeling heavy." },
            { q: "Which hair products suit dry or damaged hair?", a: "Pair a gentle shampoo with a nourishing conditioner and finish with a hair oil or serum to smooth, protect and add shine. Product pages indicate which formulas are best for your hair type." },
            { q: "Are these products gentle enough for daily use?", a: "Yes — they are designed for everyday use, using gentle, naturally derived ingredients suitable for regular cleansing and moisturising." },
            { q: "Do you offer products for the whole family?", a: "Many Daily Essentials are suitable for all adults, and we also offer a dedicated Baby Care range for little ones with extra-gentle formulas." },
            { q: "Are the products sulphate-free?", a: "Several of our cleansers are formulated to be gentle on skin and hair. Check the ingredient list on each product page for specific details." },
            { q: "How quickly will my order arrive?", a: "We deliver across the UAE and GCC region with fast, reliable shipping. Estimated timing and any free-shipping threshold appear at checkout." },
            { q: "Are Daily Essentials cruelty-free?", a: "Yes. Every product in the range is cruelty-free, with naturally derived ingredients and full transparency on labelling." },
        ],
    },

    // ─── BABY ────────────────────────────────────────────────────────────────
    baby: {
        heading: "Baby Care — Gentle, Naturally Derived Essentials",
        paragraphs: [
            "Our Baby Care range is created for delicate, sensitive skin, with gentle baby washes, soft lotions, soothing rash creams, calming talc and nourishing massage oils. Every formula is thoughtfully made to care for your little one through bath time, nappy changes and everyday cuddles.",
            "Baby skin is thinner and more reactive than adult skin, and the UAE climate adds heat and humidity to the equation. That is why our baby products use mild, naturally derived ingredients, avoid unnecessary harsh additives, and are designed to keep skin soft, comfortable and protected — gentle enough for daily use in Dubai, Abu Dhabi and across the Emirates.",
            "From a calming bath routine to soothing dry patches and protecting against irritation, the range is built to support parents with simple, dependable care. As always, we recommend patch-testing and consulting your paediatrician for newborns or any specific skin concerns.",
            "Cruelty-free, transparently formulated and held to the same premium standard as the rest of our collections, Enjoyful Life Baby Care brings gentle, trustworthy products to families — with fast UAE delivery and a caring team on hand.",
        ],
        links: [
            { label: "Glow Skincare", href: "/category/glow" },
            { label: "Daily Essentials", href: "/category/daily" },
            { label: "Home & Wellness", href: "/category/home" },
            { label: "Our Story", href: "/about" },
            { label: "Skincare Journal", href: "/blog" },
        ],
        faqs: [
            { q: "Are Enjoyful Life baby products gentle for newborns?", a: "Our baby range is formulated to be mild and gentle, but newborn skin is especially delicate. We recommend patch-testing and consulting your paediatrician before introducing any new product to a newborn." },
            { q: "What does the Baby Care range include?", a: "It includes baby wash, baby lotion, rash cream, baby talc and massage oil — the essentials for bath time, nappy care and daily skin comfort." },
            { q: "Are the formulas free from harsh ingredients?", a: "Yes. We use gentle, naturally derived ingredients and avoid unnecessary harsh additives. Full ingredient lists are available on each product page." },
            { q: "How do I soothe nappy rash?", a: "Keep the area clean and dry, change nappies frequently, and apply a protective rash cream at each change. If irritation persists, consult your paediatrician." },
            { q: "Can these products be used daily?", a: "Yes, they are designed for gentle daily use as part of a regular bath and care routine." },
            { q: "Are baby products suitable for sensitive skin?", a: "They are formulated with sensitive skin in mind. As with any baby product, patch-test first and discontinue use if you notice any reaction." },
            { q: "Do you deliver baby care across the UAE?", a: "Yes — we deliver throughout the UAE, including Dubai and Abu Dhabi, and ship to the UK. Details appear at checkout." },
            { q: "Are baby products cruelty-free?", a: "Yes. Like all Enjoyful Life products, our baby range is cruelty-free." },
        ],
    },

    // ─── FRAGRANCES ──────────────────────────────────────────────────────────
    fragrances: {
        heading: "Fragrances — Signature Scents and Body Mists",
        paragraphs: [
            "Our Fragrance Collection is composed for those who appreciate scent as a form of self-expression. From eau de parfums to refreshing body mists, roll-ons and deodorising sticks, each fragrance is crafted to feel refined, lasting and beautifully balanced — at home in Dubai, Abu Dhabi and throughout the GCC.",
            "Fragrance behaves differently in warm climates, so our scents are designed to hold their character through heat and humidity while remaining wearable for day and evening. Whether you prefer fresh and clean, warm and woody, or soft and floral, there is a signature here to suit your mood and the moment.",
            "For longer wear, apply to pulse points and lightly moisturised skin, and layer a matching mist for a soft trail throughout the day. Our fragrances also make elegant gifts, presented to a premium standard that reflects the care inside.",
            "Cruelty-free and thoughtfully made, the Fragrance Collection adds a finishing note to your routine — delivered quickly across the UAE with a team ready to help you find your signature scent.",
        ],
        links: [
            { label: "Glow Skincare", href: "/category/glow" },
            { label: "Daily Essentials", href: "/category/daily" },
            { label: "Home & Wellness", href: "/category/home" },
            { label: "Our Story", href: "/about" },
            { label: "Skincare Journal", href: "/blog" },
        ],
        faqs: [
            { q: "What types of fragrance do you offer?", a: "Our range includes eau de parfums, body mists, roll-ons and deodorising sticks, spanning fresh, woody and floral families to suit different preferences." },
            { q: "How can I make fragrance last longer in the heat?", a: "Apply to pulse points on lightly moisturised skin, avoid rubbing it in, and layer a matching body mist. Moisturised skin holds scent longer than dry skin." },
            { q: "What is the difference between a perfume and a body mist?", a: "Eau de parfums are more concentrated and longer-lasting, while body mists are lighter and ideal for refreshing throughout the day or for a subtle, everyday scent." },
            { q: "Are your fragrances suitable for sensitive skin?", a: "Roll-ons and mists are generally gentle, but if you have sensitive skin, apply to clothing or patch-test on a small area first." },
            { q: "Do fragrances make a good gift?", a: "Yes — our fragrances are presented to a premium standard and make refined gifts. Add a note at checkout for gift orders." },
            { q: "Are your fragrances long-lasting?", a: "Our eau de parfums are formulated for lasting wear, while mists offer a lighter, refreshable finish. Longevity varies with skin type and climate." },
            { q: "Do you deliver fragrances across the UAE and GCC?", a: "Yes. We deliver throughout the UAE and GCC region, with details shown at checkout." },
            { q: "Are your fragrances cruelty-free?", a: "Yes. All Enjoyful Life fragrances are cruelty-free." },
        ],
    },

    // ─── HOME ────────────────────────────────────────────────────────────────
    home: {
        heading: "Home & Wellness — Natural Fragrance for Your Space",
        paragraphs: [
            "Our Home & Wellness collection extends the Enjoyful Life ritual beyond personal care and into the spaces you live in. Thoughtfully composed candles, diffusers, room mists and home fragrances are designed to create calm, welcoming environments — whether in a Dubai apartment, an Abu Dhabi villa or homes throughout the UAE and GCC.",
            "Scent shapes how a space feels. Our home fragrances are crafted with carefully balanced notes that fill a room without overwhelming it, helping you transition from a busy day to a restful evening. Lightweight, clean and premium in presentation, they complement modern interiors and everyday wellness routines alike.",
            "Use diffusers and candles to anchor a signature scent in your living areas, and refresh with a room mist whenever you want an instant lift. As with all our products, we hold home fragrance to a high standard of quality and finish.",
            "Cruelty-free and beautifully made, Home & Wellness brings a sense of considered calm to your space — with fast UAE delivery and a team happy to help you choose the right ambience for every room.",
        ],
        links: [
            { label: "Glow Skincare", href: "/category/glow" },
            { label: "Daily Essentials", href: "/category/daily" },
            { label: "Fragrances", href: "/category/fragrances" },
            { label: "Our Story", href: "/about" },
            { label: "Skincare Journal", href: "/blog" },
        ],
        faqs: [
            { q: "What does the Home & Wellness collection include?", a: "It features home fragrance products such as candles, diffusers and room mists, designed to create calm, welcoming spaces." },
            { q: "How do I make a candle last longer?", a: "On the first burn, allow the wax to melt across the full surface to prevent tunnelling, and trim the wick before each use for a cleaner, longer burn." },
            { q: "Are diffusers or candles better for a large room?", a: "Reed diffusers provide a steady, flame-free scent ideal for continuous fragrance, while candles offer ambience and a stronger scent throw. Many customers use both in larger spaces." },
            { q: "Are your home fragrances overpowering?", a: "No — they are balanced to fill a room pleasantly without being overwhelming, suiting modern interiors and everyday use." },
            { q: "Can I use these products as a gift?", a: "Yes. Home fragrance makes a thoughtful, premium gift. Add a delivery note at checkout for gift orders." },
            { q: "Are home products safe to use daily?", a: "Yes, when used as directed. Always follow the safety guidance on candles and never leave a burning candle unattended." },
            { q: "Do you deliver home fragrance across the UAE and GCC?", a: "Yes — we deliver throughout the UAE, including Dubai and Abu Dhabi, and throughout the GCC region." },
            { q: "Are home products cruelty-free?", a: "Yes. All Enjoyful Life products, including home fragrance, are cruelty-free." },
        ],
    },

    // ─── ABOUT ───────────────────────────────────────────────────────────────
    about: {
        heading: "About Enjoyful Life — Considered Care, Crafted with Intent",
        paragraphs: [
            "Enjoyful Life began with a clear purpose: to make premium, naturally derived personal care that genuinely belongs in everyday life. We saw a gap between mass-market products that compromise on quality and luxury lines that feel out of reach, and we set out to bridge it — bringing thoughtful formulation, honest labelling and beautiful presentation to families across the UAE and GCC.",
            "Everything we make is shaped by the people and places we serve. Our home market — Dubai, Abu Dhabi and the wider Emirates — is hot, humid and fast-moving, so our textures are lightweight and fast-absorbing, our fragrances are built to last in the heat, and our routines are designed to be simple enough to keep. That same considered approach extends throughout the GCC, where customers value the same balance of efficacy and care.",
            "Quality and integrity guide our choices. We formulate with carefully chosen, naturally derived ingredients, avoid unnecessary harsh additives, and publish full ingredient lists so nothing is hidden. All of our products are cruelty-free, and we are continually refining our packaging and sourcing to reduce our footprint without compromising the premium experience.",
            "Our collections — Glow facial care, Daily body and hair essentials, gentle Baby care, signature Fragrances and Home wellness — are designed to work together as a complete, considered ritual rather than a scattered set of products. The result is a brand you can build a routine around and trust over time.",
            "Above all, Enjoyful Life is about how good, dependable care makes daily life feel a little more enjoyable. We are grateful to the customers across the UAE and GCC who have made us part of their routines, and we remain committed to earning that trust with every formula we create.",
        ],
        links: [
            ...SHARED_LINKS,
            { label: "Contact Us", href: "/contact" },
            { label: "Skincare Journal", href: "/blog" },
        ],
        faqs: [
            { q: "What is Enjoyful Life?", a: "Enjoyful Life is a premium personal-care brand offering naturally derived skincare, body and hair care, baby care, fragrances and home wellness, serving customers across the UAE and GCC." },
            { q: "What makes Enjoyful Life different?", a: "We combine premium quality with everyday accessibility — thoughtful, naturally derived formulations, full ingredient transparency, cruelty-free standards and refined presentation, all designed for the Gulf climate and modern routines." },
            { q: "Are all your products cruelty-free?", a: "Yes. Every Enjoyful Life product is cruelty-free, and we work only with suppliers who share that commitment." },
            { q: "Are your products natural?", a: "We formulate with naturally derived ingredients and avoid unnecessary harsh additives, publishing full ingredient lists on every product page." },
            { q: "Where are your products available?", a: "You can shop the full range on our website, with delivery and shipping across the UAE and GCC region." },
            { q: "Do you focus on sustainability?", a: "We are continually improving our packaging and sourcing to reduce our environmental impact while maintaining a premium experience." },
            { q: "How do I build a routine with your products?", a: "Shop by collection — Glow for facial care, Daily for body and hair, Baby for little ones, Fragrances for scent and Home for wellness — and follow the guidance on each product page to combine steps that work together." },
            { q: "How can I get in touch?", a: "Visit our Contact page to reach our team by WhatsApp, email or the enquiry form. We are happy to help with products, orders and routine advice." },
        ],
    },

    // ─── CONTACT (content block + links only; the page already has its own FAQ) ─
    contact: {
        heading: "We're Here to Help",
        paragraphs: [
            "Whether you have a question about a product, need help choosing the right routine for your skin, or want to check on an order, the Enjoyful Life team is here for you. We support customers across the UAE — including Dubai and Abu Dhabi — and throughout the GCC, and we aim to respond quickly and helpfully.",
            "The fastest way to reach us is by WhatsApp during business hours (GST, UTC+4), where our team can advise on products, confirm delivery details and answer any questions in real time. You can also email us or use the enquiry form, and we will get back to you as soon as possible.",
            "Looking for guidance before you buy? Explore our collections — Glow facial care, Daily body and hair essentials, gentle Baby care, signature Fragrances and Home wellness — or read more about our standards on the About page. We are always glad to help you find products that suit your skin, your family and your home.",
        ],
        links: [
            ...SHARED_LINKS,
            { label: "Our Story", href: "/about" },
        ],
        faqs: [],
    },
};
