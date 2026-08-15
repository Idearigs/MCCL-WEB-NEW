const pool = require('../config/pool');

/**
 * addressController — the client's saved delivery addresses (AccountV2 Addresses pane).
 * Backs the user_addresses table (migration 006). All routes are authenticated; a user
 * only ever sees and edits their own rows (scoped by req.user.userId).
 */

const shape = (r) => ({
  id: r.id,
  addressType: r.address_type,
  isDefault: r.is_default,
  fullName: r.full_name,
  line1: r.address_line1,
  line2: r.address_line2,
  city: r.city,
  stateProvince: r.state_province,
  postcode: r.postal_code,
  country: r.country,
  phone: r.phone,
});

// GET /users/addresses — the signed-in user's addresses, default first.
exports.getMyAddresses = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, data: rows.map(shape) });
  } catch (err) {
    console.error('Get addresses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
};

// POST /users/addresses — add an address. If flagged default (or it's the first one),
// it becomes the sole default.
exports.createAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    const b = req.body || {};
    if (!b.line1 || !b.city || !b.postcode) {
      return res.status(400).json({ success: false, message: 'Address line 1, city and postcode are required' });
    }
    await client.query('BEGIN');
    const existing = await client.query('SELECT COUNT(*)::int AS n FROM user_addresses WHERE user_id = $1', [req.user.userId]);
    const makeDefault = b.isDefault === true || existing.rows[0].n === 0;
    if (makeDefault) {
      await client.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [req.user.userId]);
    }
    const { rows } = await client.query(
      `INSERT INTO user_addresses
        (user_id, address_type, is_default, full_name, address_line1, address_line2, city, state_province, postal_code, country, phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.userId, b.addressType || 'shipping', makeDefault, b.fullName || null, b.line1, b.line2 || null,
       b.city, b.stateProvince || null, b.postcode, b.country || 'United Kingdom', b.phone || null]
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: shape(rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create address error:', err);
    res.status(500).json({ success: false, message: 'Failed to add address' });
  } finally {
    client.release();
  }
};

// PUT /users/addresses/:id — update an owned address.
exports.updateAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    const b = req.body || {};
    const { id } = req.params;
    await client.query('BEGIN');
    const owned = await client.query('SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    if (owned.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Address not found' }); }
    if (b.isDefault === true) {
      await client.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [req.user.userId]);
    }
    const { rows } = await client.query(
      `UPDATE user_addresses SET
        full_name = COALESCE($1, full_name),
        address_line1 = COALESCE($2, address_line1),
        address_line2 = $3,
        city = COALESCE($4, city),
        state_province = $5,
        postal_code = COALESCE($6, postal_code),
        country = COALESCE($7, country),
        phone = $8,
        is_default = COALESCE($9, is_default)
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [b.fullName ?? null, b.line1 ?? null, b.line2 ?? null, b.city ?? null, b.stateProvince ?? null,
       b.postcode ?? null, b.country ?? null, b.phone ?? null, b.isDefault === true ? true : null, id, req.user.userId]
    );
    await client.query('COMMIT');
    res.json({ success: true, data: shape(rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update address error:', err);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  } finally {
    client.release();
  }
};

// DELETE /users/addresses/:id — remove an owned address; promote another to default if needed.
exports.deleteAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    const del = await client.query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING is_default', [id, req.user.userId]);
    if (del.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Address not found' }); }
    if (del.rows[0].is_default) {
      await client.query(
        `UPDATE user_addresses SET is_default = TRUE
         WHERE id = (SELECT id FROM user_addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1)`,
        [req.user.userId]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete address error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove address' });
  } finally {
    client.release();
  }
};

// PUT /users/addresses/:id/default — make one address the default.
exports.setDefault = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    const owned = await client.query('SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    if (owned.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Address not found' }); }
    await client.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [req.user.userId]);
    await client.query('UPDATE user_addresses SET is_default = TRUE WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Set default address error:', err);
    res.status(500).json({ success: false, message: 'Failed to set default address' });
  } finally {
    client.release();
  }
};
