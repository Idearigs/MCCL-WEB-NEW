const VALID_CUTS      = ['EX', 'VG', 'G', 'F'];
const VALID_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'];
const VALID_COLOURS   = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

const generateSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const generateUniqueSlug = async (name, Product) => {
  const base = generateSlug(name);
  let slug = base;
  let i = 1;
  while (await Product.findOne({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
};

const generateSKU = (name, categorySlug) => {
  const prefix   = categorySlug.substring(0, 3).toUpperCase();
  const namePart = name.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const ts       = Date.now().toString().slice(-6);
  return `${prefix}-${namePart}-${ts}`;
};

const validateNivodaOptions = (config) => {
  if (!config) return null;

  const sanitize = (arr, valid) =>
    Array.isArray(arr)
      ? arr.filter(v => valid.includes(v.toUpperCase())).map(v => v.toUpperCase())
      : arr;

  return {
    ...config,
    cutOptions:     sanitize(config.cutOptions,     VALID_CUTS),
    clarityOptions: sanitize(config.clarityOptions, VALID_CLARITIES),
    colourOptions:  sanitize(config.colourOptions,  VALID_COLOURS),
  };
};

const parseNivodaConfig = (raw) => {
  if (!raw) return null;
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return validateNivodaOptions(parsed);
};

module.exports = { generateSlug, generateUniqueSlug, generateSKU, validateNivodaOptions, parseNivodaConfig };
