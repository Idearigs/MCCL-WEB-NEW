/*
 * Generates copy.sql — real names + descriptions + authoritative prices for wedding_designs,
 * read from AlliedGold-Products.xlsx (Designs sheet). Run migration 020 first.
 *
 * Usage: node Server/scripts/gen-wedding-copy-sql.mjs <AlliedGold-Products.xlsx> <copy.sql>
 */
import ExcelJS from 'exceljs';
import fs from 'node:fs';

const [xlsx, outPath] = process.argv.slice(2);
if (!xlsx || !outPath) { console.error('usage: gen-wedding-copy-sql.mjs <xlsx> <copy.sql>'); process.exit(1); }

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(xlsx);
const D = wb.getWorksheet('Designs');
const head = D.getRow(1).values.slice(1).map((v) => (v && v.text) ? v.text : v);
const col = (name) => head.indexOf(name);
const cell = (row, name) => { const v = row[col(name)]; return (v && v.text) ? v.text : (v && v.result != null ? v.result : v); };

const S = (v) => (v == null || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const N = (v) => (v == null || v === '' || isNaN(Number(v))) ? 'NULL' : Number(v);

const out = ['BEGIN;'];
let n = 0;
for (let r = 2; r <= D.rowCount; r++) {
  const row = D.getRow(r).values.slice(1);
  const id = cell(row, 'Design ID');
  if (!id) continue;
  n++;
  out.push(`UPDATE wedding_designs SET
    product_name = ${S(cell(row, 'PRODUCT NAME'))},
    collection = ${S(cell(row, 'Collection'))},
    subtitle = ${S(cell(row, 'Subtitle'))},
    display_title = ${S(cell(row, 'Display title'))},
    seo_name = ${S(cell(row, 'Search / SEO name'))},
    short_description = ${S(cell(row, 'Short description'))},
    description_template = ${S(cell(row, 'Description'))},
    description_example = ${S(cell(row, 'Description (18ct White example)'))},
    specification = ${S(cell(row, 'Specification'))},
    price_from = ${N(cell(row, 'Price from'))},
    price_to = ${N(cell(row, 'Price to'))},
    updated_at = NOW()
   WHERE design_id = ${S(id)};`);
}
out.push('COMMIT;');
fs.writeFileSync(outPath, out.join('\n'), 'utf8');
console.log(`wrote ${outPath} — ${n} design updates`);
