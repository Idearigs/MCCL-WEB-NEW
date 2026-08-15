// Design tokens for the McCulloch homepage v2 redesign.
// Sourced from design_handoff_mcculloch_homepage/README.md → Design Tokens.

export const T = {
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

export const FONT_DISPLAY = "'Italiana', 'Cormorant Garamond', serif";
export const FONT_BODY = "'Instrument Sans', system-ui, sans-serif";

// Section rhythm (vertical spacing between major sections)
export const SP = '120px';
