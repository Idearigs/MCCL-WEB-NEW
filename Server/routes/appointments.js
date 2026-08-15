const express = require('express');
const router = express.Router();
const c = require('../controllers/appointmentController');
const { authMiddleware: auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// User: their own appointments.
router.get('/mine', auth, c.getMyAppointments);

// Admin: full management.
router.get('/', adminAuth, c.getAllAppointments);
router.post('/', adminAuth, c.createAppointment);
router.put('/:id', adminAuth, c.updateAppointment);
router.delete('/:id', adminAuth, c.deleteAppointment);

module.exports = router;
