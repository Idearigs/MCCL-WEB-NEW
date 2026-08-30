// Wedding-ring configurator demonstration data.
// Ported from design_handoff_mcculloch_wedding (12th handoff). These 24 designs
// stand in for the real 220-design catalogue, which is not yet activated/priced.
// Names, prices, variation counts and the availability rules are the handoff's
// invented demonstration set — a design property, to be replaced with catalogue data.
// Shared between the listing (WeddingRingsV2) and the configurator PDP so a card
// click carries its design name + whether it is a stone-set band.

export type ColourwayId = "Yellow" | "White" | "Rose";

export interface Colourway {
  id: ColourwayId;
  label: string;
  swatch: string;
}

export const COLOURWAYS: Colourway[] = [
  { id: "Yellow", label: "Yellow", swatch: "#DFB23F" },
  { id: "White", label: "White", swatch: "#E1DFDA" },
  { id: "Rose", label: "Rose", swatch: "#DF9F7B" },
];

export type CategoryName =
  | "Classic"
  | "Diamond Cut"
  | "Two Colour"
  | "Diamond Set"
  | "Shaped"
  | "Cluster";

export interface WeddingDesign {
  name: string;
  cat: CategoryName;
  from: number;
  widths?: string[];
  profiles?: string[];
  weights?: string[];
  metals: number;
  spec: string;
  collection?: string;
  tag?: string;
  variants: number;
  qualities?: string[];
  carats?: string[];
}

// Categories → which filter groups each one unlocks in the rail.
export const CATEGORIES: Record<CategoryName, { scope: string[]; label: string }> = {
  Classic: { scope: ["width", "profile", "weight"], label: "Plain bands" },
  "Diamond Cut": { scope: ["width", "profile", "weight", "collection"], label: "Patterned bands" },
  "Two Colour": { scope: ["width", "profile", "weight", "collection"], label: "Patterned bands" },
  "Diamond Set": { scope: ["width", "quality", "carat", "origin"], label: "Stone-set bands" },
  Shaped: { scope: ["width", "profile", "weight"], label: "Shaped bands" },
  Cluster: { scope: ["quality", "carat", "origin"], label: "Stone-set bands" },
};

// Stone-set families become the diamond-set configurator on the PDP.
export const SET_CATEGORIES: CategoryName[] = ["Diamond Set", "Cluster"];

export const GROUP_LABELS: Record<string, string> = {
  category: "Category",
  metal: "Metal",
  width: "Width",
  profile: "Profile",
  weight: "Weight",
  quality: "Stone quality",
  carat: "Carat",
  origin: "Stone origin",
  collection: "Collection",
};

// Canonical metal list — a design offers its first N of these.
export const METAL_NAMES: string[] = [
  "9ct Yellow Gold", "9ct White Gold", "9ct Rose Gold",
  "14ct Yellow Gold", "14ct White Gold", "14ct Rose Gold",
  "18ct Yellow Gold", "18ct White Gold", "18ct Rose Gold",
  "Platinum 950", "Palladium 950", "Palladium 500", "Britannia Silver",
];

export const LISTING_OPTIONS: Record<string, string[]> = {
  category: Object.keys(CATEGORIES),
  metal: METAL_NAMES,
  width: ["2mm", "2.5mm", "3mm", "4mm", "5mm", "6mm", "7mm", "8mm"],
  profile: ["Traditional Court", "Soft Court", "Flat Court", "Premium Court", "Flat", "D-Shape", "Concave"],
  weight: ["Light", "Medium", "Heavy", "Ultra Heavy"],
  quality: ["H/I-SI", "G/H-SI", "F/G-VS", "D-VVS1"],
  carat: ["0.10ct", "0.16ct", "0.25ct", "0.40ct", "0.50ct"],
  origin: ["Natural", "Lab-grown"],
  collection: ["Ardwell", "Marchmont", "Elgin", "Ravelston", "Dunbar"],
};

export const LISTING_SORTS = ["Featured", "Price, low to high", "Price, high to low", "Width", "Newest"];
export const PRICE_MIN = 200;
export const PRICE_MAX = 4200;
export const DESIGN_TOTAL = 220;

export const DESIGNS: WeddingDesign[] = [
  { name: "Aberlady", cat: "Classic", from: 340, widths: ["2mm", "2.5mm", "3mm", "4mm", "5mm", "6mm"], profiles: ["Traditional Court", "Soft Court", "Flat Court"], weights: ["Light", "Medium", "Heavy"], metals: 13, spec: "Formed court band, all widths", tag: "Most asked for", variants: 936 },
  { name: "Braemar", cat: "Classic", from: 380, widths: ["3mm", "4mm", "5mm", "6mm", "7mm", "8mm"], profiles: ["Flat", "D-Shape", "Flat Court"], weights: ["Medium", "Heavy", "Ultra Heavy"], metals: 13, spec: "Flat band, square edges", tag: "", variants: 702 },
  { name: "Cramond", cat: "Classic", from: 420, widths: ["2mm", "3mm", "4mm", "5mm"], profiles: ["Traditional Court", "Premium Court"], weights: ["Medium", "Heavy", "Ultra Heavy"], metals: 13, spec: "Premium court, deeper section", tag: "", variants: 312 },
  { name: "Duddingston", cat: "Classic", from: 300, widths: ["2mm", "2.5mm", "3mm", "4mm"], profiles: ["Soft Court", "D-Shape"], weights: ["Light", "Medium"], metals: 13, spec: "Slim soft court", tag: "", variants: 208 },
  { name: "Ettrick", cat: "Classic", from: 460, widths: ["4mm", "5mm", "6mm", "7mm", "8mm"], profiles: ["Concave", "Flat Court"], weights: ["Medium", "Heavy", "Ultra Heavy"], metals: 13, spec: "Concave, light along the centre", tag: "New", variants: 390 },
  { name: "Fintry", cat: "Classic", from: 355, widths: ["3mm", "4mm", "5mm", "6mm"], profiles: ["Traditional Court", "Flat", "D-Shape"], weights: ["Light", "Medium", "Heavy"], metals: 13, spec: "Court band, hand polished", tag: "", variants: 468 },

  { name: "Glenlyon", cat: "Diamond Cut", from: 520, widths: ["3mm", "4mm", "5mm", "6mm"], profiles: ["Traditional Court", "Flat Court"], weights: ["Medium", "Heavy"], metals: 9, spec: "Diamond-cut bark finish", collection: "Ardwell", tag: "", variants: 288 },
  { name: "Halkirk", cat: "Diamond Cut", from: 580, widths: ["4mm", "5mm", "6mm"], profiles: ["Flat", "Flat Court"], weights: ["Medium", "Heavy", "Ultra Heavy"], metals: 9, spec: "Milled bevel edge", collection: "Marchmont", tag: "", variants: 243 },
  { name: "Inverleith", cat: "Diamond Cut", from: 495, widths: ["2.5mm", "3mm", "4mm"], profiles: ["Soft Court", "D-Shape"], weights: ["Light", "Medium"], metals: 9, spec: "Fine diamond-cut line", collection: "Ardwell", tag: "", variants: 162 },
  { name: "Jedburgh", cat: "Diamond Cut", from: 640, widths: ["5mm", "6mm", "7mm", "8mm"], profiles: ["Flat", "Concave"], weights: ["Heavy", "Ultra Heavy"], metals: 9, spec: "Deep milled channel", collection: "Elgin", tag: "New", variants: 216 },

  { name: "Kinloch", cat: "Two Colour", from: 680, widths: ["4mm", "5mm", "6mm"], profiles: ["Flat Court", "Flat"], weights: ["Medium", "Heavy"], metals: 6, spec: "Yellow inlay, white surround", collection: "Ravelston", tag: "Most asked for", variants: 216 },
  { name: "Lochranza", cat: "Two Colour", from: 720, widths: ["5mm", "6mm", "7mm"], profiles: ["Flat", "Flat Court"], weights: ["Heavy", "Ultra Heavy"], metals: 6, spec: "Rose centre line", collection: "Ravelston", tag: "", variants: 144 },
  { name: "Moffat", cat: "Two Colour", from: 640, widths: ["3mm", "4mm", "5mm"], profiles: ["Traditional Court", "Soft Court"], weights: ["Medium", "Heavy"], metals: 6, spec: "Two-colour court band", collection: "Dunbar", tag: "", variants: 180 },

  { name: "Newhaven", cat: "Diamond Set", from: 980, widths: ["3mm", "4mm", "5mm"], profiles: ["Traditional Court", "Flat Court"], weights: ["Medium", "Heavy"], metals: 11, spec: "Channel set, five stones", qualities: ["H/I-SI", "G/H-SI", "F/G-VS"], carats: ["0.16ct", "0.25ct", "0.40ct"], tag: "", variants: 1782 },
  { name: "Ochiltree", cat: "Diamond Set", from: 1240, widths: ["4mm", "5mm", "6mm"], profiles: ["Flat Court"], weights: ["Heavy", "Ultra Heavy"], metals: 11, spec: "Channel set, half band", qualities: ["G/H-SI", "F/G-VS", "D-VVS1"], carats: ["0.25ct", "0.40ct", "0.50ct"], tag: "New", variants: 1485 },
  { name: "Pitlochry", cat: "Diamond Set", from: 860, widths: ["2.5mm", "3mm", "4mm"], profiles: ["Soft Court"], weights: ["Light", "Medium"], metals: 11, spec: "Grain set, scatter", qualities: ["H/I-SI", "G/H-SI"], carats: ["0.10ct", "0.16ct", "0.25ct"], tag: "", variants: 990 },
  { name: "Queensferry", cat: "Diamond Set", from: 1680, widths: ["3mm", "4mm", "5mm", "6mm"], profiles: ["Traditional Court", "Flat Court"], weights: ["Medium", "Heavy"], metals: 11, spec: "Full eternity, channel set", qualities: ["G/H-SI", "F/G-VS", "D-VVS1"], carats: ["0.40ct", "0.50ct"], tag: "", variants: 1584 },
  { name: "Rothesay", cat: "Diamond Set", from: 1120, widths: ["3mm", "4mm"], profiles: ["Flat Court", "Flat"], weights: ["Medium", "Heavy"], metals: 11, spec: "Rub-over set, five stones", qualities: ["H/I-SI", "F/G-VS"], carats: ["0.16ct", "0.25ct"], tag: "", variants: 704 },

  { name: "Strathyre", cat: "Shaped", from: 740, widths: ["2.5mm", "3mm", "4mm"], profiles: ["Soft Court", "D-Shape"], weights: ["Light", "Medium", "Heavy"], metals: 13, spec: "Shaped to clear a solitaire", tag: "", variants: 468 },
  { name: "Tarbert", cat: "Shaped", from: 820, widths: ["3mm", "4mm", "5mm"], profiles: ["Traditional Court", "Soft Court"], weights: ["Medium", "Heavy"], metals: 13, spec: "Deep wishbone, made to your ring", tag: "Most asked for", variants: 312 },
  { name: "Ullapool", cat: "Shaped", from: 690, widths: ["2mm", "2.5mm", "3mm"], profiles: ["Soft Court"], weights: ["Light", "Medium"], metals: 13, spec: "Fine shaped band", tag: "", variants: 156 },

  { name: "Vatersay", cat: "Cluster", from: 1450, widths: ["4mm", "5mm"], metals: 9, spec: "Cluster head, eleven stones", qualities: ["G/H-SI", "F/G-VS", "D-VVS1"], carats: ["0.25ct", "0.40ct", "0.50ct"], tag: "", variants: 486 },
  { name: "Whithorn", cat: "Cluster", from: 1890, widths: ["5mm", "6mm"], metals: 9, spec: "Raised cluster, pavé shoulders", qualities: ["F/G-VS", "D-VVS1"], carats: ["0.40ct", "0.50ct"], tag: "New", variants: 288 },
  { name: "Yarrow", cat: "Cluster", from: 1280, widths: ["3mm", "4mm"], metals: 9, spec: "Low cluster, seven stones", qualities: ["H/I-SI", "G/H-SI", "F/G-VS"], carats: ["0.16ct", "0.25ct"], tag: "", variants: 432 },
];

export const designSlug = (name: string): string => name.toLowerCase();

export const findDesign = (slug: string | undefined): WeddingDesign | undefined =>
  slug ? DESIGNS.find((d) => designSlug(d.name) === slug.toLowerCase()) : undefined;
