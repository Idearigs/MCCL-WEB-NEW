const express = require('express');
const router = express.Router();
const c = require('../controllers/addressController');
const { authMiddleware: auth } = require('../middleware/auth');

// All address routes are user-scoped (a signed-in user manages only their own).
// Mounted at /users/addresses.
router.get('/', auth, c.getMyAddresses);
router.post('/', auth, c.createAddress);
router.put('/:id/default', auth, c.setDefault); // before '/:id' so 'default' isn't an id
router.put('/:id', auth, c.updateAddress);
router.delete('/:id', auth, c.deleteAddress);

module.exports = router;
