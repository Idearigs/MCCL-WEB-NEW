// Services & aftercare pages (owner's Services & SEO brief, 2026-11). Each service is offered
// through the Beeston showroom, not bought online. Wording is drawn from the owner's brief and
// the Website Essentials copy (repairs, care, valuations, remodelling, FAQs).
// Kept as plain JSON between "= {" and "\n};" — Client/seo/server.mjs reads this file too.

export interface ServicePage {
  slug: string; name: string; menuNote: string;
  title: string; metaDesc: string; h1: string; intro: string[];
  includes: string[]; sections: { heading: string; paras: string[] }[];
  subject: string; related: [string, string][];
}
export interface ServicesContent {
  landing: { eyebrow: string; heading: string; paras: string[]; title: string; metaDesc: string };
  pages: ServicePage[];
}

export const SERVICES: ServicesContent = {
  "landing": {
    "eyebrow": "Exceptional service & aftercare",
    "heading": "Our Commitment Extends Beyond Your Purchase.",
    "paras": [
      "As a fifth-generation jeweller, we believe exceptional jewellery deserves exceptional care. Our expertise extends beyond the creation of fine jewellery, offering specialist restoration, remodelling, valuations and professional aftercare.",
      "Discover our range of personalised services, available through our Beeston showroom, where you can benefit from the knowledge and craftsmanship of our expert jeweller."
    ],
    "title": "Jewellery Services & Aftercare in Beeston, Nottingham",
    "metaDesc": "Ring resizing, jewellery repairs, remodelling, valuations, watch repairs and pearl restringing at our Beeston showroom in Nottingham, from a fifth-generation jeweller."
  },
  "pages": [
    {
      "slug": "jewellery-care-aftercare",
      "name": "Jewellery Care & Aftercare",
      "menuNote": "Ring resizing, cleaning, polishing and rhodium plating.",
      "title": "Ring Resizing, Jewellery Cleaning & Aftercare in Nottingham",
      "metaDesc": "Diamond ring resizing, professional cleaning, polishing and rhodium plating at our Beeston showroom in Nottingham. Every piece assessed before work begins.",
      "h1": "Jewellery Care & Aftercare",
      "intro": [
        "Fine jewellery is designed to be worn and enjoyed for many years. With the right care and regular maintenance, your jewellery will continue to look its best while helping to protect gemstones and precious metals from unnecessary wear.",
        "From diamond ring resizing to professional cleaning, polishing and rhodium plating, our aftercare is carried out through our showroom in Beeston, Nottingham."
      ],
      "includes": ["Ring resizing, including diamond rings", "Professional cleaning", "Polishing", "Rhodium plating", "Setting and claw inspections"],
      "sections": [
        { "heading": "Ring resizing", "paras": ["Many rings can be resized, although it depends on the design and metal. We'll be happy to assess your ring and explain what is possible before any work is carried out."] },
        { "heading": "Cleaning, polishing & rhodium plating", "paras": ["Professional cleaning, polishing and routine maintenance can help keep your jewellery looking its best. Our experienced team can inspect your jewellery, check gemstone settings and advise if any maintenance is recommended."] },
        { "heading": "Regular inspections", "paras": ["We recommend having your jewellery professionally inspected on a regular basis. Claws, settings, clasps and mountings naturally wear over time and should be checked periodically to ensure gemstones remain secure."] }
      ],
      "subject": "repairs",
      "related": [["Jewellery care guide", "/jewellery-care"], ["Ring size guide", "/ring-size-guide"], ["Warranty", "/warranty"]]
    },
    {
      "slug": "jewellery-remodelling",
      "name": "Jewellery Remodelling",
      "menuNote": "Redesign treasured jewellery and family heirlooms.",
      "title": "Jewellery Remodelling in Nottingham",
      "metaDesc": "Remodel inherited rings, reset a cherished diamond or turn older jewellery into a new design, with our jeweller in Beeston, Nottingham.",
      "h1": "Jewellery Remodelling",
      "intro": [
        "Rather than replacing jewellery, we believe in restoring and reimagining it. Whether remodelling an inherited ring, resetting a cherished diamond or transforming older jewellery into a completely new design, our workshop helps extend the life of existing pieces through skilled craftsmanship and thoughtful design.",
        "Remodelling begins with a consultation at our Beeston showroom, where you can talk your ideas through directly with our jeweller."
      ],
      "includes": ["Redesigning inherited and family jewellery", "Resetting diamonds and gemstones", "Reusing your own gold where suitable", "New designs from older pieces"],
      "sections": [
        { "heading": "Using your own stones and gold", "paras": ["In many cases, your own diamonds or gemstones can be reused. We'll inspect your stones before confirming whether they're suitable.", "If you have unwanted or inherited gold, we encourage you to use it wherever it is suitable. Before manufacture, your gold is professionally refined to ensure it meets the quality and purity required for creating a new piece of jewellery."] },
        { "heading": "What to bring", "paras": ["Please bring the jewellery you would like us to assess, along with any relevant documentation such as previous valuations, diamond certificates or photographs."] }
      ],
      "subject": "bespoke",
      "related": [["Bespoke jewellery", "/bespoke-design"], ["Sustainability", "/sustainability"], ["Book an appointment", "/book-appointment"]]
    },
    {
      "slug": "jewellery-repairs",
      "name": "Jewellery Repairs & Restoration",
      "menuNote": "Re-clawing, stone security checks and specialist repairs.",
      "title": "Jewellery Repairs & Restoration in Beeston",
      "metaDesc": "Jewellery repairs in Beeston, Nottingham: re-clawing, stone security checks, chain and clasp repairs, soldering and restoration. Assessed and quoted before work begins.",
      "h1": "Jewellery Repairs & Restoration",
      "intro": [
        "We offer a comprehensive range of jewellery repair services, including ring resizing, chain and bracelet repairs, claw rebuilding, stone replacement, soldering, polishing, rhodium plating, clasp repairs and jewellery restoration.",
        "Every repair is carefully assessed at our Beeston showroom before work begins, and we will advise you of the available options before any chargeable work is carried out."
      ],
      "includes": ["Re-clawing and claw rebuilding", "Stone security checks", "Stone replacement", "Chain, bracelet and clasp repairs", "Soldering and restoration"],
      "sections": [
        { "heading": "Jewellery bought elsewhere", "paras": ["Whether your jewellery was purchased from Andrew McCulloch Jewellers or elsewhere, every item entrusted to us is treated with the utmost care, skill and attention to detail."] },
        { "heading": "Quotes and timings", "paras": ["We will provide an estimate before carrying out any chargeable work whenever possible. Repair times vary depending on the work required; we'll give you an estimated completion time when we assess your jewellery."] }
      ],
      "subject": "repairs",
      "related": [["Jewellery care & aftercare", "/services/jewellery-care-aftercare"], ["Warranty", "/warranty"], ["Repairs FAQs", "/faqs"]]
    },
    {
      "slug": "jewellery-valuations",
      "name": "Jewellery Valuations",
      "menuNote": "Insurance, probate and open market valuations.",
      "title": "Jewellery Valuations in Nottingham",
      "metaDesc": "Insurance, probate and open market jewellery valuations by appointment at our Beeston showroom in Nottingham.",
      "h1": "Jewellery Valuations",
      "intro": [
        "We offer insurance, probate and open market jewellery valuations through our showroom in Beeston, Nottingham.",
        "Appointments are recommended for valuations. Booking in advance helps us ensure we have sufficient time to assess your jewellery and answer any questions you may have."
      ],
      "includes": ["Insurance valuations", "Probate valuations", "Open market valuations"],
      "sections": [
        { "heading": "Keeping cover up to date", "paras": ["We recommend insuring valuable jewellery against accidental loss, theft or damage. Keeping your jewellery valuation up to date will help ensure appropriate insurance cover."] },
        { "heading": "What to bring", "paras": ["If possible, please bring any relevant documentation, such as previous valuations, diamond certificates, receipts or photographs of your jewellery."] }
      ],
      "subject": "valuations",
      "related": [["Book an appointment", "/book-appointment"], ["Diamond guide", "/diamond-guide"], ["Hallmark guide", "/hallmark-guide"]]
    },
    {
      "slug": "watch-repairs",
      "name": "Watch Repairs & Servicing",
      "menuNote": "Watch care, maintenance and repairs.",
      "title": "Watch Repairs & Battery Replacement in Beeston",
      "metaDesc": "Watch repairs in Beeston, Nottingham: battery replacements, pressure testing, servicing, glass replacement and bracelet adjustments. Bring your watch to our showroom for an assessment.",
      "h1": "Watch Repairs & Servicing",
      "intro": [
        "Our watch repair services include battery replacements, pressure testing, servicing, glass replacement, bracelet adjustments and specialist repairs.",
        "Every watch is assessed individually at our Beeston showroom to determine the most suitable repair solution."
      ],
      "includes": ["Battery replacements", "Pressure testing", "Servicing", "Glass replacement", "Bracelet adjustments"],
      "sections": [
        { "heading": "Which watches", "paras": ["We repair many watch brands. Please contact us or visit the showroom for an assessment."] },
        { "heading": "Guarantee", "paras": ["Our repairs are covered by our warranty. Please see our Warranty page for details and exclusions."] }
      ],
      "subject": "watches",
      "related": [["Watches", "/watches"], ["Warranty", "/warranty"], ["Watch FAQs", "/faqs"]]
    },
    {
      "slug": "pearl-restringing",
      "name": "Pearl Restringing",
      "menuNote": "Restringing and knotting of pearl and bead jewellery.",
      "title": "Pearl Restringing in Nottingham",
      "metaDesc": "Restringing and knotting of pearl and bead necklaces and bracelets, through our Beeston showroom in Nottingham.",
      "h1": "Pearl Restringing",
      "intro": [
        "We offer restringing and knotting of pearl and bead jewellery, through our showroom in Beeston, Nottingham.",
        "Pearls are delicate organic gemstones. Bring your necklace or bracelet in and we'll look at its condition, talk you through the options and confirm the cost before any work begins."
      ],
      "includes": ["Pearl necklace and bracelet restringing", "Knotting between pearls", "Bead jewellery restringing"],
      "sections": [
        { "heading": "Caring for pearls", "paras": ["Pearls should be protected from perfumes, hairsprays, cosmetics and household chemicals. Wipe pearls gently with a soft cloth after wearing and store them separately to help preserve their lustre."] }
      ],
      "subject": "repairs",
      "related": [["Jewellery care guide", "/jewellery-care"], ["Gemstone guide", "/gemstone-guide"], ["Necklaces", "/necklaces"]]
    }
  ]
};
