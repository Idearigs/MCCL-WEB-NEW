const pool = require('../config/pool');

/**
 * weddingCatalogueController — the Allied Gold wedding-band catalogue (migration 019).
 *
 * A designs + option-axes + price-lookup model, served read-only to the configurator.
 * Images key on (design, colourway); colourway derives from the metal code suffix
 * (…Y → yellow, …R → red, else white — PD/PT are white). Prices are indicative,
 * account-specific trade prices captured 24 Aug 2026 — presented "confirmed at order".
 *
 * Two price shapes:
 *   • composed (Diamond Cut / Two Colour): wedding_pattern_prices, keyed
 *     (pattern_code, metal_code, width_mm, profile_code, weight_class_id).
 *   • direct (Classic / Diamond Set / Shaped / Cluster): wedding_variations, keyed
 *     on metal (+ quality / stone_origin for stone-set); width/profile/weight are
 *     fixed per design, so they are not part of the direct match.
 */

const FILTER_DIMS = ['metal', 'profile', 'width', 'weight', 'quality', 'origin', 'carat', 'coverage', 'shape', 'collection'];

// Colourway from a catalogue metal code: ends Y → Yellow, ends R → Red, else White.
const colourwayOf = (code) => {
  const c = String(code || '').toUpperCase();
  if (c.endsWith('Y')) return 'Y';
  if (c.endsWith('R')) return 'R';
  return 'W';
};

const heroBlock = (d) => ({ Y: d.hero_y || null, W: d.hero_w || null, R: d.hero_r || null });

/* GET /wedding/designs?category=&colourway=  — the listing.
 * Returns every design (optionally one category) lightweight, each with a compact
 * facet map (dimension → distinct option values) so the configurator can filter and
 * count client-side exactly like the reference. */
exports.listDesigns = async (req, res) => {
  try {
    const { category } = req.query;
    const params = [];
    let where = 'WHERE d.is_active = TRUE';
    if (category && category !== 'all') { params.push(category); where += ` AND d.category = $${params.length}`; }

    const { rows } = await pool.query(
      `SELECT d.design_id, d.category, d.design_name, d.design_family,
              COALESCE(d.product_name, d.design_name) AS product_name, d.collection,
              COALESCE(d.short_description, d.description) AS description,
              d.variations, d.price_from, d.price_to, d.currency, d.colourways,
              d.hero_y, d.hero_w, d.hero_r, d.spin_w, d.spin_frames,
              COALESCE(f.facets, '{}'::jsonb) AS facets
         FROM wedding_designs d
         LEFT JOIN (
           SELECT design_id, jsonb_object_agg(dimension, vals) AS facets
             FROM (
               SELECT design_id, dimension, jsonb_agg(DISTINCT value) AS vals
                 FROM wedding_design_options
                WHERE dimension = ANY($${params.length + 1}::text[])
                GROUP BY design_id, dimension
             ) g GROUP BY design_id
         ) f ON f.design_id = d.design_id
         ${where}
         ORDER BY d.category, d.sort_order`,
      [...params, FILTER_DIMS]
    );

    // Global value→label vocab per dimension (for facet chip labels in the UI).
    const lq = await pool.query(
      `SELECT DISTINCT dimension, value, label FROM wedding_design_options WHERE dimension = ANY($1::text[])`, [FILTER_DIMS]);
    const labels = {};
    for (const r of lq.rows) { (labels[r.dimension] = labels[r.dimension] || {})[r.value] = r.label || r.value; }

    const byCategory = {};
    const designs = rows.map((d) => {
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
      return {
        id: d.design_id,
        category: d.category,
        name: d.product_name || d.design_name,
        collection: d.collection,
        family: d.design_family,
        description: d.description,
        variations: d.variations,
        priceFrom: d.price_from != null ? Number(d.price_from) : null,
        priceTo: d.price_to != null ? Number(d.price_to) : null,
        currency: d.currency || 'GBP',
        colourways: (d.colourways || '').split(/\s+/).filter(Boolean),
        hero: heroBlock(d),
        hasSpin: !!(d.spin_w && d.spin_frames),
        facets: d.facets || {},
      };
    });

    res.json({ success: true, total: designs.length, byCategory, labels, designs });
  } catch (err) {
    console.error('wedding listDesigns:', err);
    res.status(500).json({ success: false, message: 'Failed to load wedding designs' });
  }
};

/* GET /wedding/designs/:id — full design for the configurator PDP. */
exports.getDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const dq = await pool.query('SELECT * FROM wedding_designs WHERE design_id = $1 AND is_active = TRUE', [id]);
    if (!dq.rows.length) return res.status(404).json({ success: false, message: 'Design not found' });
    const d = dq.rows[0];

    const oq = await pool.query(
      'SELECT dimension, value, label FROM wedding_design_options WHERE design_id = $1 ORDER BY dimension, value', [id]);
    const options = {};
    for (const o of oq.rows) {
      (options[o.dimension] = options[o.dimension] || []).push({ value: o.value, label: o.label || o.value });
    }

    // Direct designs carry real per-metal variations (used for the "all variations" table).
    let variations = [];
    if (!/^base/i.test(d.pricing_model || '')) {
      const vq = await pool.query(
        `SELECT DISTINCT ON (metal) metal, metal_name, hallmark, colourway, quality, carat, stone_origin, price, sku
           FROM wedding_variations WHERE design_id = $1 AND price IS NOT NULL
          ORDER BY metal, price ASC`, [id]);
      variations = vq.rows.map((v) => ({
        metal: v.metal, metalName: v.metal_name, hallmark: v.hallmark,
        colourway: v.colourway || colourwayOf(v.metal), quality: v.quality || null,
        carat: v.carat || null, origin: v.stone_origin || null,
        price: v.price != null ? Number(v.price) : null, sku: v.sku,
      }));
    }

    res.json({
      success: true,
      design: {
        id: d.design_id, category: d.category,
        name: d.product_name || d.design_name, collection: d.collection,
        subtitle: d.subtitle, displayTitle: d.display_title, seoName: d.seo_name,
        family: d.design_family,
        description: d.description, shortDescription: d.short_description,
        descriptionTemplate: d.description_template, descriptionExample: d.description_example,
        specification: d.specification, variations: d.variations,
        priceFrom: d.price_from != null ? Number(d.price_from) : null,
        priceTo: d.price_to != null ? Number(d.price_to) : null, currency: d.currency || 'GBP',
        pricingModel: d.pricing_model, composed: /^base/i.test(d.pricing_model || ''),
        widthMm: d.width_mm, profile: d.profile, profileCode: d.profile_code,
        weightClass: d.weight_class, weightClassId: d.weight_class_id, series: d.series,
        stoneShape: d.stone_shape, settingCoverage: d.setting_coverage,
        colourways: (d.colourways || '').split(/\s+/).filter(Boolean),
        hero: heroBlock(d),
        spin: { Y: d.spin_y, W: d.spin_w, R: d.spin_r, frames: d.spin_frames, start: d.spin_start },
        options, variationRows: variations,
      },
    });
  } catch (err) {
    console.error('wedding getDesign:', err);
    res.status(500).json({ success: false, message: 'Failed to load design' });
  }
};

/* GET /wedding/price?design=&metal=&width=&profile=&weight=&quality=&origin=&carat=
 * Authoritative price for a configuration. Composed → pattern grid; direct → variations. */
exports.getPrice = async (req, res) => {
  try {
    const { design, metal, width, profile, weight, quality, origin } = req.query;
    if (!design) return res.status(400).json({ success: false, message: 'design is required' });
    const dq = await pool.query('SELECT pricing_model, currency FROM wedding_designs WHERE design_id = $1', [design]);
    if (!dq.rows.length) return res.status(404).json({ success: false, message: 'Design not found' });
    const composed = /^base/i.test(dq.rows[0].pricing_model || '');
    let price = null;

    if (composed) {
      const q = await pool.query(
        `SELECT retail_price FROM wedding_pattern_prices
          WHERE pattern_code = $1 AND metal_code = $2 AND width_mm = $3 AND profile_code = $4 AND weight_class_id = $5
          LIMIT 1`, [design, metal, width, profile, weight]);
      if (q.rows.length) price = Number(q.rows[0].retail_price);
      if (price == null) { // fall back to cheapest for the metal, so the UI never dead-ends
        const f = await pool.query(
          'SELECT MIN(retail_price) mn FROM wedding_pattern_prices WHERE pattern_code = $1 AND metal_code = $2',
          [design, metal]);
        if (f.rows.length && f.rows[0].mn != null) price = Number(f.rows[0].mn);
      }
    } else {
      const params = [design]; let w = 'design_id = $1 AND price IS NOT NULL';
      if (metal) { params.push(metal); w += ` AND metal = $${params.length}`; }
      if (quality) { params.push(quality); w += ` AND quality = $${params.length}`; }
      if (origin) { params.push(origin); w += ` AND stone_origin = $${params.length}`; }
      const q = await pool.query(`SELECT MIN(price) mn FROM wedding_variations WHERE ${w}`, params);
      if (q.rows.length && q.rows[0].mn != null) price = Number(q.rows[0].mn);
    }

    res.json({ success: true, price, currency: dq.rows[0].currency || 'GBP', composed });
  } catch (err) {
    console.error('wedding getPrice:', err);
    res.status(500).json({ success: false, message: 'Failed to price configuration' });
  }
};

/* GET /wedding/attributes — shared vocab (metal colour/stamp) for labels + swatches. */
exports.getAttributes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT dimension, value, label, code_id, colour, stamp, series, availability FROM wedding_attributes ORDER BY dimension, value');
    const attributes = {};
    for (const a of rows) {
      (attributes[a.dimension] = attributes[a.dimension] || []).push({
        value: a.value, label: a.label, id: a.code_id, colour: a.colour,
        stamp: a.stamp, series: a.series, availability: a.availability || {},
      });
    }
    res.json({ success: true, attributes });
  } catch (err) {
    console.error('wedding getAttributes:', err);
    res.status(500).json({ success: false, message: 'Failed to load attributes' });
  }
};
