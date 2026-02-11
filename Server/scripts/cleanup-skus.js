/**
 * Cleanup product SKUs to match the expected 192 product list
 * - Normalizes SKUs (BJ-50 -> BJ-050, removes diamond size suffixes)
 * - Removes duplicates
 * - Reports missing/extra products
 */
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
});

// User's expected SKU list (raw, as provided)
const RAW_SKUS = [
  'BJ-001','BJ-002','BJ-003','BJ-004','BJ-005','BJ-006','BJ-007','BJ-008','BJ-009','BJ-010',
  'BJ-011','BJ-012','BJ-013','BJ-014','BJ-015','BJ-016','BJ-017','BJ-018','BJ-019','BJ-020',
  'BJ-021','BJ-023','BJ-024','BJ-025','BJ-026','BJ-027','BJ-028','BJ-029','BJ-030','BJ-031',
  'BJ-032','BJ-033','BJ-034','BJ-035','BJ-036','BJ-037','BJ-038','BJ-039','BJ-040','BJ-041',
  'BJ-042','BJ-043','BJ-044','BJ-045','BJ-046','BJ-047','BJ-048','BJ-049',
  'BJ-50','BJ-51','BJ-52','BJ-53',
  'BJ-054','BJ-055','BJ-056','BJ-057',
  'BJ-58','BJ-59','BJ-60',
  'BJ-061','BJ-062','BJ-063','BJ-064','BJ-065','BJ-066','BJ-067','BJ-068','BJ-069','BJ-070',
  'BJ-071','BJ-072','BJ-073','BJ-074','BJ-075',
  'BJ-073','BJ-074','BJ-075', // duplicates in user list
  'BJ-076','BJ-077','BJ-078','BJ-079','BJ-080','BJ-081','BJ-082','BJ-083','BJ-084','BJ-085',
  'BJ-086','BJ-087','BJ-088',
  // Diamond size variants - all consolidate to base SKU
  'BJ-101 (A)','BJ-101(B)','BJ-101(C)','BJ-101(D)','BJ-101(E)','BJ-101(F)',
  'BJ-102 (C)','BJ-102 (D)','BJ-102(B)','BJ-102(E)','BJ-102-(A)','BJ-102-(F)',
  'BJ-103(A)','BJ-103(B)','BJ-103(C)','BJ-103(D)','BJ-103(E)','BJ-103(F)',
  'BJ-104(A)','BJ-104(B)','BJ-104(C)','BJ-104(D)','BJ-104(E)','BJ-104(F)',
  'BJ-105(A)','BJ-105(B)','BJ-105(C)','BJ-105(D)','BJ-105(E)','BJ-105(F)',
  'BJ-107(A)','BJ-107(B)','BJ-107(C)','BJ-107(D)','BJ-107(E)','BJ-107(F)',
  'BJ-108(A)','BJ-108(B)','BJ-108(C)','BJ-108(D)','BJ-108(E)','BJ-108(F)',
  'BJ-109(A)','BJ-109(B)','BJ-109(C)','BJ-109(D)','BJ-109(E)','BJ-109(F)',
  'BJ-110(A)','BJ-110(B)','BJ-110(C)','BJ-110(D)','BJ-110(E)','BJ-110(F)',
  'BJ-111(A)','BJ-111(B)','BJ-111(C)','BJ-111(D)','BJ-111(E)','BJ-111(F)',
  'BJ-120','BJ-121','BJ-121(F)','BJ-122','BJ-122 (F)','BJ-123','BJ-124','BJ-125','BJ-126',
  'BJ-127','BJ-128','BJ-129','BJ-130','BJ-131','BJ-132','BJ-133','BJ-134','BJ-135','BJ-136',
  'BJ-137','BJ-139','BJ-140','BJ-141','BJ-142','BJ-143','BJ-144','BJ-145','BJ-146','BJ-147',
  'BJ-148','BJ-149','BJ-150','BJ-151','BJ-152',
  'BJ-50','BJ-51','BJ-52','BJ-53','BJ-58','BJ-59','BJ-60' // duplicates at end
];

/**
 * Normalize a SKU:
 * - Remove diamond size suffixes like (A), (B), etc.
 * - Normalize number padding: BJ-50 -> BJ-050
 * - Uppercase and trim
 */
function normalizeSku(raw) {
  let sku = raw.trim().toUpperCase();
  // Remove diamond size suffixes: (A), (B), etc. with optional spaces and dashes
  sku = sku.replace(/\s*-?\s*\([A-Z]\)/g, '').trim();
  // Normalize: BJ-50 -> BJ-050 (ensure 3-digit number)
  const match = sku.match(/^(BJ)-(\d+)$/);
  if (match) {
    const num = match[2].padStart(3, '0');
    sku = `BJ-${num}`;
  }
  return sku;
}

async function cleanup() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to database\n');

    // 1. Build expected unique SKU set
    const expectedSkus = new Set();
    for (const raw of RAW_SKUS) {
      expectedSkus.add(normalizeSku(raw));
    }
    const expectedList = [...expectedSkus].sort();
    console.log(`Expected unique products: ${expectedList.length}`);
    console.log('Expected SKUs:', expectedList.join(', '));

    // 2. Get current products from DB
    const dbResult = await pool.query('SELECT id, sku, name FROM products ORDER BY sku');
    console.log(`\nCurrent products in DB: ${dbResult.rows.length}`);

    // Build map of normalized SKU -> DB rows
    const dbSkuMap = {};
    for (const row of dbResult.rows) {
      const norm = normalizeSku(row.sku);
      if (!dbSkuMap[norm]) dbSkuMap[norm] = [];
      dbSkuMap[norm].push(row);
    }

    // 3. Find products in DB that are NOT in expected list
    const extraSkus = [];
    for (const norm of Object.keys(dbSkuMap)) {
      if (!expectedSkus.has(norm)) {
        extraSkus.push({ norm, rows: dbSkuMap[norm] });
      }
    }

    // 4. Find expected SKUs not in DB
    const missingSkus = [];
    for (const sku of expectedList) {
      if (!dbSkuMap[sku]) {
        missingSkus.push(sku);
      }
    }

    // 5. Find duplicates (multiple DB rows for same normalized SKU)
    const duplicates = [];
    for (const [norm, rows] of Object.entries(dbSkuMap)) {
      if (rows.length > 1) {
        duplicates.push({ norm, rows });
      }
    }

    // 6. Find products with wrong SKU format (needs normalization)
    const needsRename = [];
    for (const row of dbResult.rows) {
      const norm = normalizeSku(row.sku);
      if (row.sku !== norm && expectedSkus.has(norm)) {
        needsRename.push({ id: row.id, oldSku: row.sku, newSku: norm });
      }
    }

    console.log(`\n=== REPORT ===`);
    console.log(`Extra products (not in expected list): ${extraSkus.length}`);
    if (extraSkus.length > 0) {
      for (const e of extraSkus) {
        console.log(`  ${e.norm} -> ${e.rows.map(r => r.sku + ' (' + r.name + ')').join(', ')}`);
      }
    }

    console.log(`\nMissing products (in expected list but not in DB): ${missingSkus.length}`);
    if (missingSkus.length > 0) {
      console.log(`  ${missingSkus.join(', ')}`);
    }

    console.log(`\nDuplicate normalized SKUs: ${duplicates.length}`);
    if (duplicates.length > 0) {
      for (const d of duplicates) {
        console.log(`  ${d.norm}: ${d.rows.map(r => r.sku + ' (id:' + r.id.substr(0,8) + ')').join(', ')}`);
      }
    }

    console.log(`\nSKUs needing normalization: ${needsRename.length}`);
    if (needsRename.length > 0) {
      for (const r of needsRename) {
        console.log(`  ${r.oldSku} -> ${r.newSku}`);
      }
    }

    // Only report, don't make changes yet
    console.log('\n=== No changes made. Review and run with --apply to fix ===');

    if (process.argv.includes('--apply')) {
      console.log('\n=== APPLYING FIXES ===\n');

      // Fix duplicates: keep first, delete rest
      for (const d of duplicates) {
        const keep = d.rows[0];
        for (let i = 1; i < d.rows.length; i++) {
          const del = d.rows[i];
          // Check if it has diamond size images - if so, skip deletion
          const imgCheck = await pool.query('SELECT COUNT(*) as c FROM product_images WHERE product_id = $1 AND diamond_size_id IS NOT NULL', [del.id]);
          if (parseInt(imgCheck.rows[0].c) > 0) {
            console.log(`  Keeping ${del.sku} (has ${imgCheck.rows[0].c} diamond images), deleting ${keep.sku} instead`);
            // Swap: delete the one without diamond images
            await pool.query('DELETE FROM product_metals_junction WHERE product_id = $1', [keep.id]);
            await pool.query('DELETE FROM product_images WHERE product_id = $1', [keep.id]);
            await pool.query('DELETE FROM products WHERE id = $1', [keep.id]);
            console.log(`  Deleted: ${keep.sku} (id: ${keep.id})`);
            break;
          } else {
            await pool.query('DELETE FROM product_metals_junction WHERE product_id = $1', [del.id]);
            await pool.query('DELETE FROM product_images WHERE product_id = $1', [del.id]);
            await pool.query('DELETE FROM products WHERE id = $1', [del.id]);
            console.log(`  Deleted duplicate: ${del.sku} (id: ${del.id})`);
          }
        }
      }

      // Rename SKUs that need normalization
      for (const r of needsRename) {
        // Check if normalized SKU already exists
        const existing = await pool.query('SELECT id FROM products WHERE sku = $1 AND id != $2', [r.newSku, r.id]);
        if (existing.rows.length === 0) {
          await pool.query('UPDATE products SET sku = $1, updated_at = NOW() WHERE id = $2', [r.newSku, r.id]);
          console.log(`  Renamed: ${r.oldSku} -> ${r.newSku}`);
        } else {
          console.log(`  Skip rename ${r.oldSku}: ${r.newSku} already exists`);
        }
      }

      // Delete extra products not in expected list
      for (const e of extraSkus) {
        for (const row of e.rows) {
          await pool.query('DELETE FROM product_metals_junction WHERE product_id = $1', [row.id]);
          await pool.query('DELETE FROM product_diamond_sizes WHERE product_id = $1', [row.id]);
          await pool.query('DELETE FROM product_images WHERE product_id = $1', [row.id]);
          await pool.query('DELETE FROM products WHERE id = $1', [row.id]);
          console.log(`  Deleted extra: ${row.sku} (${row.name})`);
        }
      }

      // Final count
      const finalCount = await pool.query('SELECT COUNT(*) as c FROM products');
      console.log(`\nFinal product count: ${finalCount.rows[0].c}`);
      console.log(`Expected: ${expectedList.length}`);
    }

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

cleanup();
