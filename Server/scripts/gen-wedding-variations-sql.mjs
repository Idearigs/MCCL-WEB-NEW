/*
 * Generates load2.sql: the two large price-lookup tables (wedding_variations,
 * wedding_pattern_prices) plus a price_from/price_to backfill for composed designs.
 * These are lookups the configurator reads — never flat product rows.
 *
 * Usage: node Server/scripts/gen-wedding-variations-sql.mjs <out-dir> <load2.sql>
 */
import fs from 'node:fs';
import path from 'node:path';

const AZURE = 'https://alliedstorage.blob.core.windows.net/';
const [outDir, loadPath] = process.argv.slice(2);
if (!outDir || !loadPath) { console.error('usage: gen-wedding-variations-sql.mjs <out-dir> <load2.sql>'); process.exit(1); }

const parse = (t) => {
  t = t.replace(/^﻿/, ''); const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\r') {} else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c; }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((v) => v !== ''));
};
const load = (name) => { const r = parse(fs.readFileSync(path.join(outDir, name), 'utf8')); const h = r[0].map(x => x.trim()); return r.slice(1).map(x => Object.fromEntries(h.map((k, i) => [k, (x[i] ?? '').trim()]))); };

const S = (v) => (v == null || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const N = (v) => (v == null || v === '' || isNaN(Number(v))) ? 'NULL' : Number(v);
const I = (v) => (v == null || v === '' || isNaN(parseInt(v, 10))) ? 'NULL' : parseInt(v, 10);
const urlp = (rel) => rel ? S(AZURE + rel) : 'NULL';

const variations = load('import-variations.csv');
const patterns   = load('pattern-prices.csv');

const out = [];
out.push('BEGIN;');
out.push('TRUNCATE wedding_variations, wedding_pattern_prices;');
out.push('');

// ---- variations ----
const vCols = ['design_id','category','sku','product_id','product_code','metal','metal_name','hallmark','colourway','width_mm','profile','weight_class','series','quality','carat','stone_origin','lab_grown','metal_weight_g','price','currency','hero','spin','spin_frames'];
const vTuple = (v) => `(${S(v.design_id)},${S(v.category)},${S(v.sku)},${S(v.product_id)},${S(v.product_code)},${S(v.metal)},${S(v.metal_name)},${S(v.hallmark)},${S(v.colourway)},${S(v.width_mm)},${S(v.profile)},${S(v.weight_class)},${S(v.series)},${S(v.quality)},${S(v.carat)},${S(v.stone_origin)},${S(v.lab_grown)},${S(v.metal_weight_g)},${N(v.price)},${S(v.currency||'GBP')},${urlp(v.hero)},${urlp(v.spin)},${I(v.spin_frames)})`;
for (let i = 0; i < variations.length; i += 1000) {
  const chunk = variations.slice(i, i + 1000).map(vTuple);
  out.push(`INSERT INTO wedding_variations (${vCols.join(',')}) VALUES\n${chunk.join(',\n')};`);
}
out.push('');

// ---- pattern prices ----
const pCols = ['pattern_code','category','collection','option_group','metal','metal_code','metal_colour','width_mm','profile_code','weight_class_id','base_sku','classic_price','retail_price','surcharge'];
const pTuple = (p) => `(${S(p.patternCode)},${S(p.category)},${S(p.collection)},${S(p.optionGroup)},${S(p.metal)},${S(p.metalCode)},${S(p.metalColour)},${S(p.widthMm)},${S(p.profileCode)},${S(p.weightClassId)},${S(p.baseSku)},${N(p.classicPrice)},${N(p.retailPrice)},${N(p.surcharge)})`;
for (let i = 0; i < patterns.length; i += 1000) {
  const chunk = patterns.slice(i, i + 1000).map(pTuple);
  out.push(`INSERT INTO wedding_pattern_prices (${pCols.join(',')}) VALUES\n${chunk.join(',\n')};`);
}
out.push('');

// ---- backfill composed designs' price range from the pattern grid ----
out.push(`UPDATE wedding_designs d SET price_from = s.mn, price_to = s.mx
FROM (SELECT pattern_code, MIN(retail_price) mn, MAX(retail_price) mx FROM wedding_pattern_prices GROUP BY pattern_code) s
WHERE d.design_id = s.pattern_code AND (d.price_from IS NULL OR d.pricing_model LIKE 'base%');`);

out.push('COMMIT;');
fs.writeFileSync(loadPath, out.join('\n'), 'utf8');
console.log(`wrote ${loadPath}`);
console.log(`  variations ${variations.length}, pattern-prices ${patterns.length}`);
