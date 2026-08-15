const pool = require('../config/pool');

/**
 * pieceController — the record of everything the workshop has made for a client
 * (AccountV2 "Your pieces" pane). Backs the client_pieces table (migration 017).
 * Users see their own (matched by user_id OR account email); admins manage all.
 * `documents` is a JSONB array of { label, meta, url }.
 */

const normDocs = (docs) => {
  if (!Array.isArray(docs)) return [];
  return docs
    .filter((d) => d && d.label)
    .map((d) => ({ label: String(d.label), meta: d.meta ? String(d.meta) : '', url: d.url ? String(d.url) : '' }));
};

const shape = (r) => ({
  id: r.id,
  userId: r.user_id,
  customerEmail: r.customer_email,
  name: r.name,
  spec: r.spec,
  madeOn: r.made_on,
  maker: r.maker,
  image: r.image_url,
  documents: Array.isArray(r.documents) ? r.documents : [],
  createdAt: r.created_at,
});

const emailForUser = async (userId) => {
  const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
  return rows[0]?.email || null;
};

// GET /users/pieces — the signed-in user's pieces (newest first).
exports.getMyPieces = async (req, res) => {
  try {
    const email = await emailForUser(req.user.userId);
    const { rows } = await pool.query(
      `SELECT * FROM client_pieces WHERE user_id = $1 OR (customer_email IS NOT NULL AND LOWER(customer_email) = LOWER($2))
       ORDER BY created_at DESC`,
      [req.user.userId, email]
    );
    res.json({ success: true, data: rows.map(shape) });
  } catch (err) {
    console.error('Get my pieces error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch pieces' });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /pieces/all (admin).
exports.getAllPieces = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM client_pieces ORDER BY created_at DESC`);
    res.json({ success: true, data: rows.map(shape) });
  } catch (err) {
    console.error('Get all pieces error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch pieces' });
  }
};

// POST /pieces/admin — create; links to a user by email when one exists.
exports.createPiece = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name) return res.status(400).json({ success: false, message: 'A piece name is required' });
    let userId = b.userId || null;
    if (!userId && b.customerEmail) {
      const u = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [b.customerEmail]);
      userId = u.rows[0]?.id || null;
    }
    const { rows } = await pool.query(
      `INSERT INTO client_pieces (user_id, customer_email, name, spec, made_on, maker, image_url, documents)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *`,
      [userId, b.customerEmail || null, b.name, b.spec || null, b.madeOn || null, b.maker || null, b.image || null, JSON.stringify(normDocs(b.documents))]
    );
    res.status(201).json({ success: true, data: shape(rows[0]) });
  } catch (err) {
    console.error('Create piece error:', err);
    res.status(500).json({ success: false, message: 'Failed to create piece' });
  }
};

// PUT /pieces/:id (admin).
exports.updatePiece = async (req, res) => {
  try {
    const b = req.body || {};
    const { id } = req.params;
    let userId = b.userId ?? null;
    if (userId === null && b.customerEmail) {
      const u = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [b.customerEmail]);
      userId = u.rows[0]?.id || null;
    }
    const docs = b.documents !== undefined ? JSON.stringify(normDocs(b.documents)) : null;
    const { rows } = await pool.query(
      `UPDATE client_pieces SET
        customer_email = COALESCE($1, customer_email),
        name = COALESCE($2, name),
        spec = COALESCE($3, spec),
        made_on = COALESCE($4, made_on),
        maker = COALESCE($5, maker),
        image_url = COALESCE($6, image_url),
        documents = COALESCE($7::jsonb, documents),
        user_id = COALESCE($8, user_id)
       WHERE id = $9 RETURNING *`,
      [b.customerEmail ?? null, b.name ?? null, b.spec ?? null, b.madeOn ?? null, b.maker ?? null, b.image ?? null, docs, userId, id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Piece not found' });
    res.json({ success: true, data: shape(rows[0]) });
  } catch (err) {
    console.error('Update piece error:', err);
    res.status(500).json({ success: false, message: 'Failed to update piece' });
  }
};

// DELETE /pieces/:id (admin).
exports.deletePiece = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM client_pieces WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ success: false, message: 'Piece not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete piece error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete piece' });
  }
};
