import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Key, Search, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import API_BASE_URL from '../../config/api';

interface StaffMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'editor';
  is_active: boolean;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
}

type ModalMode = 'create' | 'edit' | 'password' | null;

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  editor: 'bg-gray-100 text-gray-700',
};

const authHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
  'Content-Type': 'application/json',
});

const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filtered, setFiltered] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'admin' as string, is_active: true,
  });
  const [pwForm, setPwForm] = useState({ new_password: '', confirm: '' });

  useEffect(() => { fetchStaff(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(staff.filter(s =>
      s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.role.includes(q)
    ));
  }, [staff, search]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/staff`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) { setStaff(data.data); setFiltered(data.data); }
      else setError(data.error || 'Failed to load staff');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ first_name: '', last_name: '', email: '', password: '', role: 'admin', is_active: true });
    setFormError(''); setModalMode('create');
  };

  const openEdit = (s: StaffMember) => {
    setSelected(s);
    setForm({ first_name: s.first_name, last_name: s.last_name, email: s.email, password: '', role: s.role, is_active: s.is_active });
    setFormError(''); setModalMode('edit');
  };

  const openPassword = (s: StaffMember) => {
    setSelected(s); setPwForm({ new_password: '', confirm: '' }); setFormError(''); setModalMode('password');
  };

  const closeModal = () => { setModalMode(null); setSelected(null); setFormError(''); };

  const toast = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); };

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setFormError('All fields are required'); return;
    }
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/staff`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ first_name: form.first_name, last_name: form.last_name, email: form.email, password: form.password, role: form.role }),
      });
      const data = await res.json();
      if (data.success) { closeModal(); fetchStaff(); toast('Staff member created'); }
      else setFormError(data.error || 'Failed to create');
    } catch { setFormError('Network error'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!form.first_name || !form.last_name) { setFormError('Name is required'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/staff/${selected!.id}`, {
        method: 'PUT', headers: authHeader(),
        body: JSON.stringify({ first_name: form.first_name, last_name: form.last_name, role: form.role, is_active: form.is_active }),
      });
      const data = await res.json();
      if (data.success) { closeModal(); fetchStaff(); toast('Staff member updated'); }
      else setFormError(data.error || 'Failed to update');
    } catch { setFormError('Network error'); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!pwForm.new_password || pwForm.new_password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    if (pwForm.new_password !== pwForm.confirm) { setFormError('Passwords do not match'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/staff/${selected!.id}/reset-password`, {
        method: 'PATCH', headers: authHeader(),
        body: JSON.stringify({ new_password: pwForm.new_password }),
      });
      const data = await res.json();
      if (data.success) { closeModal(); toast('Password reset successfully'); }
      else setFormError(data.error || 'Failed to reset password');
    } catch { setFormError('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (s: StaffMember) => {
    if (!window.confirm(`Delete ${s.full_name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/staff/${s.id}`, { method: 'DELETE', headers: authHeader() });
      const data = await res.json();
      if (data.success) { fetchStaff(); toast('Staff member deleted'); }
      else setError(data.error || 'Failed to delete');
    } catch { setError('Network error'); }
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-satoshi flex items-center gap-2">
              <Shield className="w-7 h-7 text-gray-700" />
              Staff Management
            </h1>
            <p className="text-sm text-gray-500 font-satoshi mt-0.5">{filtered.length} team member{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 font-satoshi">
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg font-satoshi flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {successMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-satoshi">{error}</div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="font-satoshi text-sm">Loading staff…</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Logins', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide font-satoshi">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-medium font-satoshi">
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-900 font-satoshi">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-satoshi">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-satoshi ${ROLE_COLORS[s.role]}`}>
                        {ROLE_LABELS[s.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.is_active
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-700 font-satoshi"><CheckCircle className="w-3.5 h-3.5" />Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-red-600 font-satoshi"><XCircle className="w-3.5 h-3.5" />Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-satoshi">{fmt(s.last_login_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-satoshi">{s.login_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-satoshi">{fmt(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} title="Edit"
                          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openPassword(s)} title="Reset password"
                          className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded">
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(s)} title="Delete"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-satoshi text-sm">No staff members found</div>
          )}
        </div>

        {/* Role info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 font-satoshi space-y-1">
          <p><span className="font-semibold text-purple-700">Super Admin</span> — Full access including staff management</p>
          <p><span className="font-semibold text-blue-700">Admin</span> — Full product, order, and content management</p>
          <p><span className="font-semibold text-gray-700">Editor</span> — View and edit products only</p>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 font-satoshi">
                {modalMode === 'create' ? 'Add Staff Member' : 'Edit Staff Member'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 font-satoshi">First Name</label>
                  <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 font-satoshi">Last Name</label>
                  <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              {modalMode === 'create' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 font-satoshi">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 font-satoshi">Password</label>
                    <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min. 8 characters"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-satoshi">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {modalMode === 'edit' && (
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_active" checked={form.is_active}
                    onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300" />
                  <label htmlFor="is_active" className="text-sm text-gray-700 font-satoshi">Account active</label>
                </div>
              )}
              {formError && <p className="text-xs text-red-600 font-satoshi">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-satoshi">Cancel</button>
              <button onClick={modalMode === 'create' ? handleCreate : handleEdit} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 font-satoshi">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {modalMode === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {modalMode === 'password' && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 font-satoshi">Reset Password</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 font-satoshi">Resetting password for <strong>{selected.full_name}</strong></p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-satoshi">New Password</label>
                <input type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-satoshi">Confirm Password</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              {formError && <p className="text-xs text-red-600 font-satoshi">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-satoshi">Cancel</button>
              <button onClick={handleResetPassword} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 font-satoshi">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStaff;
