const pool = require('../config/pool');

/**
 * appointmentController — client consultations, fittings and services.
 * Backs the appointments table (migration 017). Users see their own (matched by user_id
 * OR the email on their account, the same way orders match). Admins manage all of them.
 */

const ALLOWED_STATUS = ['requested', 'confirmed', 'completed', 'cancelled'];

const shape = (r) => ({
  id: r.id,
  userId: r.user_id,
  customerName: r.customer_name,
  customerEmail: r.customer_email,
  scheduledAt: r.scheduled_at,
  duration: r.duration,
  kind: r.kind,
  note: r.note,
  status: r.status,
  upcoming: r.scheduled_at ? new Date(r.scheduled_at) >= new Date() && r.status !== 'completed' && r.status !== 'cancelled' : false,
  createdAt: r.created_at,
});

const emailForUser = async (userId) => {
  const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
  return rows[0]?.email || null;
};

// GET /users/appointments — the signed-in user's appointments (upcoming first).
exports.getMyAppointments = async (req, res) => {
  try {
    const email = await emailForUser(req.user.userId);
    const { rows } = await pool.query(
      `SELECT * FROM appointments WHERE user_id = $1 OR (customer_email IS NOT NULL AND LOWER(customer_email) = LOWER($2))
       ORDER BY scheduled_at DESC`,
      [req.user.userId, email]
    );
    res.json({ success: true, data: rows.map(shape) });
  } catch (err) {
    console.error('Get my appointments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /appointments/all — every appointment (admin).
exports.getAllAppointments = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM appointments ORDER BY scheduled_at DESC`);
    res.json({ success: true, data: rows.map(shape) });
  } catch (err) {
    console.error('Get all appointments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// POST /appointments/admin — create; links to a user by email when one exists.
exports.createAppointment = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.scheduledAt || !b.kind) {
      return res.status(400).json({ success: false, message: 'A date/time and a kind are required' });
    }
    let userId = b.userId || null;
    if (!userId && b.customerEmail) {
      const u = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [b.customerEmail]);
      userId = u.rows[0]?.id || null;
    }
    const status = ALLOWED_STATUS.includes(b.status) ? b.status : 'confirmed';
    const { rows } = await pool.query(
      `INSERT INTO appointments (user_id, customer_name, customer_email, scheduled_at, duration, kind, note, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [userId, b.customerName || null, b.customerEmail || null, b.scheduledAt, b.duration || null, b.kind, b.note || null, status]
    );
    res.status(201).json({ success: true, data: shape(rows[0]) });
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ success: false, message: 'Failed to create appointment' });
  }
};

// PUT /appointments/:id — update (admin).
exports.updateAppointment = async (req, res) => {
  try {
    const b = req.body || {};
    const { id } = req.params;
    if (b.status && !ALLOWED_STATUS.includes(b.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    let userId = b.userId ?? null;
    if (userId === null && b.customerEmail) {
      const u = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [b.customerEmail]);
      userId = u.rows[0]?.id || null;
    }
    const { rows } = await pool.query(
      `UPDATE appointments SET
        customer_name = COALESCE($1, customer_name),
        customer_email = COALESCE($2, customer_email),
        scheduled_at = COALESCE($3, scheduled_at),
        duration = COALESCE($4, duration),
        kind = COALESCE($5, kind),
        note = COALESCE($6, note),
        status = COALESCE($7, status),
        user_id = COALESCE($8, user_id)
       WHERE id = $9 RETURNING *`,
      [b.customerName ?? null, b.customerEmail ?? null, b.scheduledAt ?? null, b.duration ?? null,
       b.kind ?? null, b.note ?? null, b.status ?? null, userId, id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: shape(rows[0]) });
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ success: false, message: 'Failed to update appointment' });
  }
};

// DELETE /appointments/:id (admin).
exports.deleteAppointment = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete appointment error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete appointment' });
  }
};
