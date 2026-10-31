const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { QueryTypes } = require('sequelize');
const config = require('../config');
const { postgresDB, logger } = require('../config/database');
const {
  sendViewingRequestReceivedEmail, sendViewingRequestOwnerEmail,
  sendViewingApprovedEmail, sendViewingDeclinedEmail,
} = require('../services/emailService');

/**
 * Secure viewing — a guest submits name, email, ID details and two photos of
 * their ID before a piece leaves the cabinet. The owner reviews it in a
 * PIN-protected panel (/secure-viewing/admin) and approves or declines; the
 * guest is emailed at each step and sees the result live on their phone.
 */

const PRIVATE_DIR = path.join(__dirname, '..', 'uploads', '_private', 'id-checks');
try {
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });
} catch (error) {
  // Never let this take the whole API down at startup; submissions will fail until fixed.
  logger.error('Secure viewing: could not create private ID folder:', error.message);
}

const RETENTION_DAYS = parseInt(process.env.SECURE_VIEWING_RETENTION_DAYS || '30', 10);
const APPROVAL_HOURS = 12; // only for older requests with no appointment date
const ID_TYPES = ['Passport', 'Driving licence', 'National ID card', 'Residence permit', 'Other photo ID'];
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L

const db = () => postgresDB();
const tokenSecret = () => `${config.jwt.secret}:secure-viewing`;

// ── Uploads: two images, straight to the private folder ─────────────────────
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PRIVATE_DIR),
    filename: (req, file, cb) => {
      const ext = { 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif' }[file.mimetype] || '.jpg';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, cb) => cb(null, IMAGE_TYPES.includes(file.mimetype)),
}).fields([{ name: 'id_front', maxCount: 1 }, { name: 'id_back', maxCount: 1 }]);

const uploadIdPhotos = (req, res, next) => upload(req, res, (err) => {
  if (err) return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be under 12 MB.' : 'Could not read the photos. Please try again.' });
  next();
});

const removeFiles = (...names) => names.filter(Boolean).forEach(n => fs.unlink(path.join(PRIVATE_DIR, path.basename(n)), () => {}));

// Bookable from one month after today (UK time), clamped to month end, e.g. 31 Oct -> 30 Nov.
// The one-year limit only stops typing errors keeping ID data for years.
const londonToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
const addMonths = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m + n, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(d, lastDay))).toISOString().slice(0, 10);
};
const isRealDate = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};

const newCode = () => 'MC-' + Array.from(crypto.randomBytes(6), b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');

// ── Public: submit a request ─────────────────────────────────────────────────
const submitRequest = async (req, res) => {
  const front = req.files?.id_front?.[0];
  const back = req.files?.id_back?.[0];
  const fail = (status, message) => { removeFiles(front?.filename, back?.filename); return res.status(status).json({ success: false, message }); };

  try {
    const fullName = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const idType = String(req.body.id_type || '').trim();
    const idNumber = String(req.body.id_number || '').trim();
    const appointmentDate = String(req.body.appointment_date || '').trim();

    if (fullName.length < 2 || fullName.length > 150) return fail(400, 'Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 255) return fail(400, 'Please enter a valid email address.');
    if (!ID_TYPES.includes(idType)) return fail(400, 'Please choose the type of ID.');
    if (idNumber.length < 4 || idNumber.length > 80) return fail(400, 'Please enter your ID number.');
    if (phone.length > 40) return fail(400, 'Please check your phone number.');
    const today = londonToday();
    if (!isRealDate(appointmentDate)) return fail(400, 'Please choose an appointment date.');
    if (appointmentDate < addMonths(today, 1) || appointmentDate > addMonths(today, 12)) return fail(400, 'That date is not available. Appointments start one month from today.');
    if (!front || !back) return fail(400, 'Please add a photo of the front and the back of your ID.');
    if (String(req.body.consent) !== 'true') return fail(400, 'Please confirm you agree to the ID check.');

    let row;
    for (let attempt = 0; attempt < 5 && !row; attempt++) {
      try {
        [row] = await db().query(`
          INSERT INTO viewing_requests (code, full_name, email, phone, id_type, id_number, appointment_date, id_front_path, id_back_path, ip_address, user_agent)
          VALUES (:code, :fullName, :email, :phone, :idType, :idNumber, :appointmentDate, :front, :back, :ip, :ua)
          RETURNING id, code, created_at`, {
          replacements: {
            code: newCode(), fullName, email, phone: phone || null, idType, idNumber, appointmentDate,
            front: front.filename, back: back.filename,
            ip: String(req.ip || '').slice(0, 64), ua: String(req.get('user-agent') || '').slice(0, 300),
          },
          type: QueryTypes.SELECT,
        });
      } catch (e) {
        if (!/unique/i.test(e.message)) throw e; // code collision → try another
      }
    }
    if (!row) return fail(500, 'Something went wrong. Please try again.');

    // Emails must never block or fail the submission.
    sendViewingRequestReceivedEmail({ email, fullName, code: row.code, appointmentDate }).catch(e => logger.error('Viewing email (customer) failed:', e.message));
    sendViewingRequestOwnerEmail({ fullName, email, phone, idType, code: row.code, appointmentDate, createdAt: row.created_at }).catch(e => logger.error('Viewing email (owner) failed:', e.message));

    return res.status(201).json({ success: true, data: { code: row.code } });
  } catch (error) {
    logger.error('Secure viewing submit error:', error);
    return fail(500, 'Something went wrong. Please try again.');
  }
};

// ── Public: live status for the guest's screen (status only, no personal data) ──
const getStatus = async (req, res) => {
  try {
    const [row] = await db().query(
      `SELECT status, approval_expires_at, to_char(appointment_date, 'YYYY-MM-DD') AS appointment_date FROM viewing_requests WHERE code = :code`,
      { replacements: { code: String(req.params.code || '').toUpperCase() }, type: QueryTypes.SELECT });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    const expired = row.status === 'approved' && row.approval_expires_at && new Date(row.approval_expires_at) < new Date();
    return res.json({ success: true, data: { status: expired ? 'expired' : row.status, appointment_date: row.appointment_date } });
  } catch (error) {
    logger.error('Secure viewing status error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Owner panel: PIN login → short-lived token scoped to this panel only ─────
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest();

const login = (req, res) => {
  const pin = process.env.SECURE_VIEWING_PIN;
  if (!pin) return res.status(503).json({ success: false, message: 'The viewing panel PIN has not been set up yet.' });
  if (!crypto.timingSafeEqual(hash(req.body?.pin ?? ''), hash(pin))) {
    logger.warn(`Secure viewing: wrong PIN from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Incorrect PIN.' });
  }
  const token = jwt.sign({ scope: 'secure-viewing' }, tokenSecret(), { expiresIn: '12h' });
  return res.json({ success: true, data: { token } });
};

const requirePanelToken = (req, res, next) => {
  const auth = req.headers.authorization || '';
  try {
    const payload = jwt.verify(auth.startsWith('Bearer ') ? auth.slice(7) : '', tokenSecret());
    if (payload.scope !== 'secure-viewing') throw new Error('scope');
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Please enter the PIN again.' });
  }
};

const PANEL_FIELDS = `id, code, full_name, email, phone, id_type, id_number, status, decision_note,
  to_char(appointment_date, 'YYYY-MM-DD') AS appointment_date,
  decided_at, approval_expires_at, purged_at, created_at,
  (id_front_path IS NOT NULL) AS has_front, (id_back_path IS NOT NULL) AS has_back`;

const listRequests = async (req, res) => {
  try {
    const status = ['pending', 'approved', 'declined'].includes(req.query.status) ? req.query.status : null;
    const rows = await db().query(`
      SELECT ${PANEL_FIELDS} FROM viewing_requests
      ${status ? 'WHERE status = :status' : ''}
      ORDER BY (status = 'pending') DESC, created_at DESC
      LIMIT 200`, { replacements: { status }, type: QueryTypes.SELECT });
    const [counts] = await db().query(`
      SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
             COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
             COUNT(*) FILTER (WHERE status = 'declined')::int AS declined
      FROM viewing_requests`, { type: QueryTypes.SELECT });
    return res.json({ success: true, data: { requests: rows, counts } });
  } catch (error) {
    logger.error('Secure viewing list error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPhoto = async (req, res) => {
  try {
    const col = req.params.side === 'back' ? 'id_back_path' : 'id_front_path';
    const [row] = await db().query(`SELECT ${col} AS file FROM viewing_requests WHERE id = :id`,
      { replacements: { id: req.params.id }, type: QueryTypes.SELECT });
    if (!row?.file) return res.status(404).end();
    res.set('Cache-Control', 'no-store');
    return res.sendFile(path.join(PRIVATE_DIR, path.basename(row.file)));
  } catch (error) {
    logger.error('Secure viewing photo error:', error);
    return res.status(404).end();
  }
};

const decide = (decision) => async (req, res) => {
  try {
    const note = String(req.body?.note || '').trim().slice(0, 500) || null;
    const [row] = await db().query(`
      UPDATE viewing_requests
      SET status = :decision, decision_note = :note, decided_at = NOW(), updated_at = NOW(),
          approval_expires_at = CASE WHEN :decision = 'approved'
            THEN COALESCE(appointment_date + INTERVAL '1 day', NOW() + INTERVAL '${APPROVAL_HOURS} hours') ELSE NULL END
      WHERE id = :id
      RETURNING code, full_name, email, status, to_char(appointment_date, 'YYYY-MM-DD') AS appointment_date`, {
      replacements: { id: req.params.id, decision, note }, type: QueryTypes.SELECT,
    });
    if (!row) return res.status(404).json({ success: false, message: 'Request not found' });

    const send = decision === 'approved' ? sendViewingApprovedEmail : sendViewingDeclinedEmail;
    send({ email: row.email, fullName: row.full_name, code: row.code, appointmentDate: row.appointment_date }).catch(e => logger.error('Viewing decision email failed:', e.message));

    return res.json({ success: true, data: { status: row.status } });
  } catch (error) {
    logger.error('Secure viewing decision error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Retention: delete ID photos and numbers RETENTION_DAYS after the appointment ──
const purgeOld = async () => {
  try {
    if (!postgresDB()) return;
    const rows = await db().query(`
      UPDATE viewing_requests
      SET id_number = NULL, id_front_path = NULL, id_back_path = NULL, purged_at = NOW(), updated_at = NOW()
      WHERE purged_at IS NULL
        AND GREATEST(created_at, COALESCE(appointment_date::timestamp, created_at)) < NOW() - (:days || ' days')::interval
      RETURNING id`,
    { replacements: { days: String(RETENTION_DAYS) }, type: QueryTypes.SELECT });
    if (rows.length) logger.info(`Secure viewing: purged ID data from ${rows.length} request(s)`);
  } catch (error) {
    logger.warn('Secure viewing purge failed:', error.message);
  }
  // Remove any photo file no longer referenced by a row (covers the rows purged above).
  try {
    if (!postgresDB()) return;
    const live = await db().query(`SELECT id_front_path AS a, id_back_path AS b FROM viewing_requests WHERE purged_at IS NULL`, { type: QueryTypes.SELECT });
    const keep = new Set(live.flatMap(r => [r.a, r.b]).filter(Boolean));
    const cutoff = Date.now() - 60 * 60 * 1000; // never touch files from an upload in progress
    for (const f of fs.readdirSync(PRIVATE_DIR)) {
      if (!keep.has(f) && fs.statSync(path.join(PRIVATE_DIR, f)).mtimeMs < cutoff) removeFiles(f);
    }
  } catch (error) {
    logger.warn('Secure viewing file cleanup failed:', error.message);
  }
};
setTimeout(purgeOld, 60 * 1000).unref();
setInterval(purgeOld, 6 * 60 * 60 * 1000).unref();

module.exports = {
  ID_TYPES, uploadIdPhotos, submitRequest, getStatus, login, requirePanelToken,
  listRequests, getPhoto, approve: decide('approved'), decline: decide('declined'), purgeOld,
};
