/**
 * Admin Wedding Rings Controller
 * Manages Diamond-cut wedding ring designs (master products) and their variants.
 *
 * Products are identified by jewelry_sub_type slug = 'diamond-cut'.
 * Variants in product_variants table hold Profile, Width, Metal, Weight (size), Price.
 */

const { getModels } = require('../models');
const { Op } = require('sequelize');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
});

const DIAMOND_CUT_SLUG = 'diamond-cut';

/** Resolve the Diamond-cut jewelry_sub_type id once per request. */
async function getDiamondCutId() {
  const { rows } = await pool.query(
    "SELECT id FROM jewelry_sub_types WHERE slug = $1 LIMIT 1",
    [DIAMOND_CUT_SLUG]
  );
  if (!rows.length) throw new Error("'diamond-cut' jewelry_sub_type not found in DB");
  return rows[0].id;
}

// ── GET /admin/wedding-rings/stats ────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const subTypeId = await getDiamondCutId();

    const [statsResult, metalResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int                                                          AS total_designs,
           COUNT(*) FILTER (WHERE p.is_active)::int                              AS active_designs,
           COALESCE(SUM(vc.variant_count), 0)::int                              AS total_variants,
           COALESCE(SUM(vc.priced_count), 0)::int                               AS priced_variants
         FROM products p
         LEFT JOIN (
           SELECT product_id,
                  COUNT(*)::int          AS variant_count,
                  COUNT(price)::int      AS priced_count
           FROM product_variants
           GROUP BY product_id
         ) vc ON vc.product_id = p.id
         WHERE p.jewelry_sub_type_id = $1`,
        [subTypeId]
      ),
      pool.query(
        `SELECT pv.metal_type, COUNT(*)::int AS cnt
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE p.jewelry_sub_type_id = $1
           AND pv.metal_type IS NOT NULL
         GROUP BY pv.metal_type
         ORDER BY pv.metal_type`,
        [subTypeId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        ...statsResult.rows[0],
        metals: metalResult.rows,
      },
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /admin/wedding-rings ───────────────────────────────────────────────────
exports.getDesigns = async (req, res) => {
  try {
    const subTypeId = await getDiamondCutId();
    const { page = 1, limit = 20, search = '', metal = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const params = [subTypeId];
    let searchClause = '';
    if (search) {
      params.push(`%${search}%`);
      searchClause = `AND (p.sku ILIKE $${params.length} OR p.name ILIKE $${params.length})`;
    }

    let metalClause = '';
    if (metal) {
      params.push(`%${metal}%`);
      metalClause = `AND EXISTS (
        SELECT 1 FROM product_variants pv2
        WHERE pv2.product_id = p.id AND pv2.metal_type ILIKE $${params.length}
      )`;
    }

    const countParams = [...params];
    const dataParams = [...params, parseInt(limit), offset];

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM products p
      WHERE p.jewelry_sub_type_id = $1 ${searchClause} ${metalClause}
    `;

    const dataSql = `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.is_active,
        p.created_at,
        COUNT(pv.id)::int                                   AS variants_count,
        COUNT(pv.id) FILTER (WHERE pv.is_active)::int      AS active_variants,
        COUNT(pv.price) FILTER (WHERE pv.price IS NOT NULL)::int AS priced_variants,
        ARRAY_AGG(DISTINCT pv.metal_type ORDER BY pv.metal_type)
          FILTER (WHERE pv.metal_type IS NOT NULL)         AS metals,
        ARRAY_AGG(DISTINCT pv.mm_width::text ORDER BY pv.mm_width::text)
          FILTER (WHERE pv.mm_width IS NOT NULL)           AS widths
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.jewelry_sub_type_id = $1 ${searchClause} ${metalClause}
      GROUP BY p.id
      ORDER BY p.sku ASC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countSql, countParams),
      pool.query(dataSql, dataParams),
    ]);

    const total = countResult.rows[0].total;

    res.json({
      success: true,
      data: {
        designs: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    console.error('getDesigns error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /admin/wedding-rings/:id/variants ─────────────────────────────────────
exports.getVariants = async (req, res) => {
  try {
    const subTypeId = await getDiamondCutId();
    const { id } = req.params;
    const { page = 1, limit = 60, metal = '', profile = '', width = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Verify the product belongs to Diamond-cut
    const { rows: productRows } = await pool.query(
      "SELECT id, name, sku, is_active FROM products WHERE id = $1 AND jewelry_sub_type_id = $2 LIMIT 1",
      [id, subTypeId]
    );
    if (!productRows.length) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    const params = [id];
    const clauses = [];

    if (metal) {
      params.push(`%${metal}%`);
      clauses.push(`metal_type ILIKE $${params.length}`);
    }
    if (profile) {
      params.push(`%${profile}%`);
      clauses.push(`variant_name ILIKE $${params.length}`);
    }
    if (width) {
      params.push(parseFloat(width));
      clauses.push(`mm_width = $${params.length}`);
    }

    const whereExtra = clauses.length ? ' AND ' + clauses.join(' AND ') : '';

    const countParams = [...params];
    const dataParams = [...params, parseInt(limit), offset];

    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total FROM product_variants WHERE product_id = $1${whereExtra}`,
        countParams
      ),
      pool.query(
        `SELECT id, variant_name, sku, metal_type, metal_id, mm_width, size,
                price, price_adjustment, is_active, ai_description, created_at
         FROM product_variants
         WHERE product_id = $1${whereExtra}
         ORDER BY metal_type ASC, mm_width ASC NULLS LAST, variant_name ASC
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      ),
    ]);

    res.json({
      success: true,
      data: {
        product: productRows[0],
        variants: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.rows[0].total,
          totalPages: Math.ceil(countResult.rows[0].total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    console.error('getVariants error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /admin/wedding-rings/variants/:variantId ────────────────────────────
exports.updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { price, is_active } = req.body;

    const sets = [];
    const params = [];

    if (price !== undefined) {
      params.push(price === '' || price === null ? null : parseFloat(price));
      sets.push(`price = $${params.length}`);
    }
    if (is_active !== undefined) {
      params.push(Boolean(is_active));
      sets.push(`is_active = $${params.length}`);
    }

    if (!sets.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(variantId);
    sets.push(`updated_at = NOW()`);

    const { rows } = await pool.query(
      `UPDATE product_variants SET ${sets.join(', ')} WHERE id = $${params.length - 1} RETURNING *`,
      params
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('updateVariant error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /admin/wedding-rings/variants/bulk ──────────────────────────────────
exports.bulkUpdateVariants = async (req, res) => {
  try {
    const { variant_ids, price, is_active } = req.body;

    if (!Array.isArray(variant_ids) || !variant_ids.length) {
      return res.status(400).json({ success: false, message: 'variant_ids required' });
    }

    const sets = [];
    const params = [variant_ids];

    if (price !== undefined) {
      params.push(price === '' || price === null ? null : parseFloat(price));
      sets.push(`price = $${params.length}`);
    }
    if (is_active !== undefined) {
      params.push(Boolean(is_active));
      sets.push(`is_active = $${params.length}`);
    }

    if (!sets.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    sets.push('updated_at = NOW()');

    const { rowCount } = await pool.query(
      `UPDATE product_variants SET ${sets.join(', ')} WHERE id = ANY($1)`,
      params
    );

    res.json({ success: true, data: { updated: rowCount } });
  } catch (err) {
    console.error('bulkUpdateVariants error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /admin/wedding-rings/:id/toggle-status ──────────────────────────────
exports.toggleDesignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE products SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 RETURNING id, sku, name, is_active`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('toggleDesignStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
