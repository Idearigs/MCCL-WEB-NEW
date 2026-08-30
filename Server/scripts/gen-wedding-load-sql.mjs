/*
 * Generates load.sql for the Allied Gold wedding catalogue (see migration 019).
 * Reads the prepared sheets from the extractor project and emits idempotent,
 * transactional SQL (truncate + insert) into the dedicated wedding_* tables.
 *
 * Usage:  node Server/scripts/gen-wedding-load-sql.mjs <out-dir> <load.sql>
 *   out-dir : the extractor's out/ directory (import-designs.csv etc.)
 *   load.sql: path to write
 *
 * Images key on (design, colourway). Hero/spin paths are Azure-relative in the sheets;
 * we prefix the public blob base. The 4x re-host (heroes only) is a later pass that
 * updates wedding_designs.hero_* in place — hero_*_src keeps the Azure original.
 */
import fs from 'node:fs';
import path from 'node:path';

const AZURE = 'https://alliedstorage.blob.core.windows.net/';
const [outDir, loadPath] = process.argv.slice(2);
if (!outDir || !loadPath) { console.error('usage: gen-wedding-load-sql.mjs <out-dir> <load.sql>'); process.exit(1); }

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

// SQL literal helpers
const S = (v) => (v == null || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const N = (v) => (v == null || v === '' || isNaN(Number(v))) ? 'NULL' : Number(v);
const I = (v) => (v == null || v === '' || isNaN(parseInt(v, 10))) ? 'NULL' : parseInt(v, 10);
const J = (obj) => `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
const url = (rel) => rel ? AZURE + rel : '';

const designs = load('import-designs.csv');
const options = load('import-options.csv');
const matrix  = load('price-matrix.csv');
const attrs   = load('attributes.csv');

const out = [];
out.push('BEGIN;');
out.push('TRUNCATE wedding_design_options, wedding_designs, wedding_price_matrix, wedding_attributes RESTART IDENTITY CASCADE;');
out.push('');

// ---- designs ----
const dCols = ['design_id','category','design_name','design_family','description','variations','price_from','price_to','currency','pricing_model','surcharge','width_mm','profile','profile_code','weight_class','weight_class_id','series','stone_shape','setting_coverage','colourways','hero_y','hero_w','hero_r','hero_y_src','hero_w_src','hero_r_src','spin_y','spin_w','spin_r','spin_frames','spin_start','extras','sort_order'];
designs.forEach((d, i) => {
  const heroY = url(d.hero_Y), heroW = url(d.hero_W), heroR = url(d.hero_R);
  const vals = [
    S(d.design_id), S(d.category), S(d.design_name), S(d.design_family), S(d.description),
    I(d.variations), N(d.price_from), N(d.price_to), S(d.currency || 'GBP'), S(d.pricing_model),
    N(d.surcharge), S(d.width_mm), S(d.profile), S(d.profile_code), S(d.weight_class),
    S(d.weight_class_id), S(d.series), S(d.stone_shape), S(d.setting_coverage), S(d.colourways),
    S(heroY), S(heroW), S(heroR), S(heroY), S(heroW), S(heroR),
    S(url(d.spin_Y)), S(url(d.spin_W)), S(url(d.spin_R)), I(d.spin_frames), I(d.spin_start),
    S(d.extras), i,
  ];
  out.push(`INSERT INTO wedding_designs (${dCols.join(',')}) VALUES (${vals.join(',')});`);
});
out.push('');

// ---- options (batched multi-row inserts) ----
const oRows = options.filter(o => o.design_id && o.dimension && o.value);
for (let i = 0; i < oRows.length; i += 500) {
  const chunk = oRows.slice(i, i + 500).map(o => `(${S(o.design_id)},${S(o.dimension)},${S(o.value)},${S(o.label)})`);
  out.push(`INSERT INTO wedding_design_options (design_id,dimension,value,label) VALUES\n${chunk.join(',\n')};`);
}
out.push('');

// ---- price matrix ----  header: widthMm,profile,weightClass,<metal codes...>
const mHead = Object.keys(matrix[0]);
const metalCols = mHead.filter(h => !['widthMm', 'profile', 'weightClass'].includes(h));
matrix.forEach(m => {
  const prices = {}; metalCols.forEach(c => { const v = Number(m[c]); if (!isNaN(v) && m[c] !== '') prices[c] = v; });
  out.push(`INSERT INTO wedding_price_matrix (width_mm,profile,weight_class,prices) VALUES (${S(m.widthMm)},${S(m.profile)},${S(m.weightClass)},${J(prices)});`);
});
out.push('');

// ---- attributes ---- header: dimension,value,label,id,colour,stamp,series,patterns,metals,<6 categories>
const CATS = ['Classic', 'Diamond Cut', 'Two Colour', 'Diamond Set', 'Shaped', 'Cluster'];
attrs.forEach(a => {
  const avail = {}; CATS.forEach(c => { if (a[c]) avail[c] = a[c]; });
  out.push(`INSERT INTO wedding_attributes (dimension,value,label,code_id,colour,stamp,series,availability) VALUES (${S(a.dimension)},${S(a.value)},${S(a.label)},${S(a.id)},${S(a.colour)},${S(a.stamp)},${S(a.series)},${J(avail)});`);
});

out.push('');
out.push('COMMIT;');
fs.writeFileSync(loadPath, out.join('\n'), 'utf8');
console.log(`wrote ${loadPath}`);
console.log(`  designs ${designs.length}, options ${oRows.length}, price-matrix ${matrix.length}, attributes ${attrs.length}`);
