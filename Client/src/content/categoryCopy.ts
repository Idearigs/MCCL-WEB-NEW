// Category-page copy shown under the products (and served to crawlers by Client/seo/server.mjs,
// which parses the JSON object below — keep it valid JSON: double quotes, no trailing commas).
// Facts only from the site's own content; draft for the client's approval.

export interface CategoryCopy {
  heading: string;
  paras: string[];
  links: [string, string][];
}

export const CATEGORY_COPY: Record<string, CategoryCopy> = {
  "/engagement-rings": {
    "heading": "Engagement rings, set by hand in Beeston",
    "paras": [
      "Every engagement ring on this page is made and set by hand in our own workshop on The Square in Beeston, Nottingham. Choose the design you love, then choose the diamond: a natural diamond, or a lab-grown diamond that is physically and optically the same stone for a gentler price.",
      "You will find classic solitaires, halo and hidden-halo settings, vintage-inspired designs with milgrain and engraving, and contemporary bypass and twist bands. Most designs can be made in platinum or in 9ct, 14ct or 18ct white, yellow or rose gold, and the price updates as you choose your metal and diamond.",
      "Not sure where to start? Our diamond guide explains cut, colour, clarity and carat in plain English, and our ring size guide helps you get the fit right — we resize in our own workshop too. Or book a private appointment and we will have stones ready for you to compare side by side."
    ],
    "links": [["Diamond guide", "/diamond-guide"], ["Ring size guide", "/ring-size-guide"], ["Bespoke engagement rings", "/bespoke-design"], ["Book an appointment", "/book-appointment"]]
  },
  "/rings": {
    "heading": "Rings for every occasion",
    "paras": [
      "Browse every ring we make and stock in one place: engagement rings, wedding bands, eternity rings and gemstone rings, alongside ready-to-ship pieces that are in our Beeston showroom today.",
      "Ready-to-ship rings are finished pieces that can be dispatched quickly with free insured UK delivery and a 30-day return. Made-to-order rings are crafted in our own workshop in your choice of metal and stone. Every ring comes with a 1-year warranty, and we size, repair and service rings on our own premises.",
      "Looking for something particular? Filter by style, stone and metal above, read our gemstone and diamond guides, or ask us to design a ring just for you."
    ],
    "links": [["Engagement rings", "/engagement-rings"], ["Wedding rings", "/wedding-rings"], ["Gemstone guide", "/gemstone-guide"], ["Repairs and resizing", "/repairs"]]
  },
  "/wedding-rings": {
    "heading": "Wedding rings made to your size",
    "paras": [
      "Choose from over a thousand wedding ring designs, from classic court bands to diamond-set, diamond-cut, two-colour and shaped rings that sit neatly against an engagement ring. Every band is made to order in your size.",
      "Most designs are available in platinum, palladium and 18ct or 9ct gold, in a range of widths and profiles: traditional court, soft court, flat court, flat, D-shape and concave. If you are not sure which profile feels right, come in and try them on — it makes all the difference.",
      "Shopping as a pair? We can help you choose two bands that belong together, and we can make a shaped band to fit around an engagement ring perfectly."
    ],
    "links": [["Ring size guide", "/ring-size-guide"], ["Engagement rings", "/engagement-rings"], ["Bespoke wedding rings", "/bespoke-design"], ["Book an appointment", "/book-appointment"]]
  },
  "/earrings": {
    "heading": "Diamond and gemstone earrings",
    "paras": [
      "From everyday diamond studs to statement drops, our earrings are chosen and finished with the same care as our rings. You will find solitaire and cluster studs, halo earrings, hoops and drops set with natural and lab-grown diamonds, sapphires, rubies, emeralds and other gemstones.",
      "Many pieces are ready to ship from our Beeston showroom with free insured UK delivery, a 30-day return on ready-to-ship items and a 1-year warranty. Earrings make a lovely gift; if you would like help choosing, we are always happy to advise in the shop or over the phone.",
      "Caring for your earrings is simple — our jewellery care guide explains how to keep diamonds bright and gold polished."
    ],
    "links": [["Jewellery care", "/jewellery-care"], ["Gemstone guide", "/gemstone-guide"], ["Necklaces and pendants", "/necklaces"], ["Contact us", "/contact"]]
  },
  "/necklaces": {
    "heading": "Necklaces and pendants",
    "paras": [
      "Our pendants range from simple diamond solitaires to halo designs and gemstone pendants set with sapphires, rubies and emeralds, in white, yellow and rose gold.",
      "Ready-to-ship pieces are in our Beeston showroom now, with free insured UK delivery and a 1-year warranty. A pendant is often the perfect match for a pair of earrings — and if you would like something unique, we can design a pendant around a stone you choose, or one you already own.",
      "Looking for a meaningful gift? Our birthstone and gemstone guides explain each stone, or visit us to see pieces in person."
    ],
    "links": [["Birthstone guide", "/birthstone-guide"], ["Earrings", "/earrings"], ["Bespoke design", "/bespoke-design"], ["Visit us", "/visit-us"]]
  },
  "/bracelets": {
    "heading": "Bracelets in gold and diamond",
    "paras": [
      "Discover gold link and chain bracelets — curb, paperclip, Byzantine and clover designs — alongside delicate station, heart, infinity and initial bracelets.",
      "Alongside ready-to-ship pieces, many of our bracelets are made to order in your choice of 9ct or 18ct yellow, white or rose gold. Bespoke bracelets are crafted individually in our own workshop — please allow up to six weeks — and personalised designs such as initial bracelets make a thoughtful gift.",
      "Every bracelet comes with a 1-year warranty and free insured UK delivery, and our team can adjust the length to fit."
    ],
    "links": [["Jewellery care", "/jewellery-care"], ["Delivery", "/delivery"], ["Bespoke design", "/bespoke-design"], ["Contact us", "/contact"]]
  },
  "/jewellery": {
    "heading": "Fine jewellery from Beeston",
    "paras": [
      "Our fine jewellery collection brings together earrings, necklaces, pendants and bracelets in gold and platinum, set with natural and lab-grown diamonds and precious gemstones.",
      "Every piece is checked and finished in our own workshop on The Square in Beeston, Nottingham, and comes with free insured UK delivery and a 1-year warranty. Ready-to-ship pieces can be returned within 30 days.",
      "If you cannot find exactly what you are looking for, we can design and make it for you, or remake a piece you already own into something new."
    ],
    "links": [["Earrings", "/earrings"], ["Necklaces and pendants", "/necklaces"], ["Bracelets", "/bracelets"], ["Bespoke design", "/bespoke-design"]]
  },
  "/watches": {
    "heading": "Watches from Roamer, Briston and Festina",
    "paras": [
      "Our watch collection brings together Roamer, Briston and Festina — from Swiss-made automatics and dress watches to sports chronographs and titanium watches for men and women.",
      "Browse by brand or collection, compare specifications such as movement, case size and water resistance, and buy online with free insured UK delivery. Prefer to try one on? Visit our Beeston showroom.",
      "We also service and repair watches, from battery changes to straps and bracelets."
    ],
    "links": [["Roamer watches", "/roamer"], ["Briston watches", "/briston"], ["Festina watches", "/festina"], ["Repairs and servicing", "/repairs"]]
  },
  "/roamer": {
    "heading": "Roamer watches",
    "paras": [
      "Roamer is a Swiss watchmaker known for well-made automatic and quartz watches with clean, classic design. Browse the Roamer collections we stock, from elegant dress watches to sporty chronographs.",
      "Buy online with free insured UK delivery, or visit our Beeston showroom to see them in person. We are always happy to advise on sizing and straps."
    ],
    "links": [["All watches", "/watches"], ["Briston watches", "/briston"], ["Festina watches", "/festina"], ["Repairs and servicing", "/repairs"]]
  },
  "/briston": {
    "heading": "Briston watches",
    "paras": [
      "Briston watches combine vintage-inspired style with a modern, sporty character — chronographs and three-hand watches with distinctive cases and interchangeable straps.",
      "Buy online with free insured UK delivery, or visit our Beeston showroom to see them in person. We are always happy to advise on sizing and straps."
    ],
    "links": [["All watches", "/watches"], ["Roamer watches", "/roamer"], ["Festina watches", "/festina"], ["Repairs and servicing", "/repairs"]]
  },
  "/festina": {
    "heading": "Festina watches",
    "paras": [
      "Festina is known for sporty chronographs, titanium watches and classic collections for men and women. Browse the full range we stock, with specifications for every model.",
      "Buy online with free insured UK delivery, or visit our Beeston showroom to see them in person. We are always happy to advise on sizing and straps."
    ],
    "links": [["All watches", "/watches"], ["Roamer watches", "/roamer"], ["Briston watches", "/briston"], ["Repairs and servicing", "/repairs"]]
  }
};
