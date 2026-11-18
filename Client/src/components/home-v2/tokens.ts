// Design tokens for the McCulloch homepage v2 redesign.
// Sourced from design_handoff_mcculloch_homepage/README.md → Design Tokens.

export const T = {
  // ── Brand palette, one job each (colour-usage brief, Nov 2026) ──────────────
  cream: '#F8F6F0',     // page background everywhere
  sand: '#EFEADF',      // behind product images; at most one quiet full-width band per page
  line: '#E3DDD0',      // every border and divider
  // ink (below): footer background and the one primary button on a screen
  text: '#332F2A',      // headings and body text
  textMuted: '#6E6A60', // secondary text, on cream only (never on sand)
  // gold (below): non-text accents (hairlines, icons, stars, hover underlines); text only on ink
  // ── Older names, still used by inner pages ────────────────────────────────
  // Ground
  paper: '#F8F6F0',
  tint: '#EFEADF',
  ink: '#1C1A17',
  inkDeep: '#14120F',
  // Text
  textPrimary: '#26231F',
  heading: '#332F2A',
  body: '#4A4741',
  muted: '#6E6A60',
  onDarkBody: '#A79E90',
  onDarkMuted: '#8C8375',
  onDarkSoft: '#B0A798',
  onDarkStep: '#E5DFD4',
  // Accent
  gold: '#A8813C',
  // Lines
  rule: '#E3DDD0',
  ruleSoft: '#DCD3C4',
  ruleStrong: '#CFC4B2',
  ruleDark: '#34302A',
  ruleDarkStrong: '#4A443B',
} as const;

// Headings: Marcellus. Text, labels and buttons: Instrument Sans. Two fonts only.
export const FONT_DISPLAY = "'Marcellus', Georgia, serif";
// The "McCulloch" wordmark keeps its own lettering; it is the logo, not a heading.
export const FONT_LOGO = "'Italiana', 'Marcellus', serif";
export const FONT_BODY = "'Instrument Sans', system-ui, sans-serif";

// Section rhythm (vertical spacing between major sections)
export const SP = '120px';
