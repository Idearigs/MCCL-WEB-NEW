const { getAdminModels } = require('../models/adminModels');

async function listStaff(req, res) {
  try {
    const { AdminUser } = getAdminModels();
    const staff = await AdminUser.findAll({
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'last_login_at', 'login_count', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    return res.json({ success: true, data: staff.map(u => u.toSafeObject()) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function createStaff(req, res) {
  try {
    const { AdminUser } = getAdminModels();
    const { email, password, first_name, last_name, role = 'admin' } = req.body;
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ success: false, error: 'email, password, first_name and last_name are required' });
    }
    if (!['super_admin', 'admin', 'editor'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    const existing = await AdminUser.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });

    const user = await AdminUser.create({ email, password, first_name, last_name, role, is_active: true });
    return res.status(201).json({ success: true, data: user.toSafeObject(), message: 'Staff member created' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function updateStaff(req, res) {
  try {
    const { AdminUser } = getAdminModels();
    const { id } = req.params;
    const { first_name, last_name, role, is_active } = req.body;

    const user = await AdminUser.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: 'Staff member not found' });

    // Prevent demoting the only super_admin
    if (user.role === 'super_admin' && role && role !== 'super_admin') {
      const superAdmins = await AdminUser.count({ where: { role: 'super_admin', is_active: true } });
      if (superAdmins <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot change role of the only active super admin' });
      }
    }

    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name  !== undefined) updates.last_name  = last_name;
    if (role       !== undefined && ['super_admin', 'admin', 'editor'].includes(role)) updates.role = role;
    if (is_active  !== undefined) updates.is_active = is_active;

    await user.update(updates);
    return res.json({ success: true, data: user.toSafeObject(), message: 'Staff member updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { AdminUser } = getAdminModels();
    const { id } = req.params;
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    const user = await AdminUser.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: 'Staff member not found' });
    await user.update({ password: new_password });
    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteStaff(req, res) {
  try {
    const { AdminUser } = getAdminModels();
    const { id } = req.params;

    // Don't allow deleting yourself
    if (req.admin?.id === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    const user = await AdminUser.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: 'Staff member not found' });

    // Prevent deleting the only super_admin
    if (user.role === 'super_admin') {
      const superAdmins = await AdminUser.count({ where: { role: 'super_admin', is_active: true } });
      if (superAdmins <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot delete the only active super admin' });
      }
    }

    await user.destroy();
    return res.json({ success: true, message: 'Staff member deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { listStaff, createStaff, updateStaff, resetPassword, deleteStaff };
