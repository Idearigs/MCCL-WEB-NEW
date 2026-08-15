import React, { useState, useEffect } from 'react';
import { Trash2, Edit, AlertCircle, CheckCircle, Calendar, X } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import AdminLayout from '../components/AdminLayout';

/**
 * AdminAppointments — manage client consultations, fittings and services.
 * Backs the AccountV2 Appointments pane (GET/POST/PUT/DELETE /appointments, adminAuth).
 * Linking a customer by email attaches the appointment to their account automatically.
 */

interface Appointment {
  id: string;
  customerName?: string;
  customerEmail?: string;
  scheduledAt: string;
  duration?: string;
  kind: string;
  note?: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  upcoming?: boolean;
}

const STATUSES: Appointment['status'][] = ['requested', 'confirmed', 'completed', 'cancelled'];
const EMPTY = { customerName: '', customerEmail: '', scheduledAt: '', duration: '', kind: '', note: '', status: 'confirmed' as Appointment['status'] };

// ISO → value for <input type="datetime-local">
const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminAppointments(): JSX.Element {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirm, setConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const token = () => localStorage.getItem('admin_token');
  const authHeaders = () => ({ 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });
  const flash = (type: 'success' | 'error', message: string) => { setAlert({ type, message }); setTimeout(() => setAlert(null), 3500); };

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/appointments`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (e) {
      flash('error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY }); setShowForm(true); };
  const openEdit = (a: Appointment) => {
    setEditingId(a.id);
    setForm({ customerName: a.customerName || '', customerEmail: a.customerEmail || '', scheduledAt: toLocalInput(a.scheduledAt), duration: a.duration || '', kind: a.kind, note: a.note || '', status: a.status });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scheduledAt || !form.kind.trim()) { flash('error', 'A date/time and a kind are required'); return; }
    const payload = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() };
    try {
      const res = await fetch(`${API_BASE_URL}/appointments${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { flash('success', editingId ? 'Appointment updated' : 'Appointment created'); setShowForm(false); fetchItems(); }
      else flash('error', data.message || 'Save failed');
    } catch { flash('error', 'Save failed'); }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.success) { flash('success', 'Appointment deleted'); fetchItems(); }
    } catch { flash('error', 'Delete failed'); }
    setConfirm({ isOpen: false, id: null });
  };

  const badge = (s: Appointment['status']) => {
    const map: Record<string, string> = { requested: 'bg-amber-100 text-amber-800', confirmed: 'bg-green-100 text-green-800', completed: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-700' };
    return map[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-gray-900 flex items-center gap-2"><Calendar className="w-6 h-6" /> Appointments</h1>
            <p className="text-sm text-gray-500 mt-1">Consultations, fittings and services shown in each client's account.</p>
          </div>
          <button onClick={openNew} className="bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 transition-colors">New appointment</button>
        </div>

        {alert && (
          <div className={`mb-4 p-3 flex items-center gap-2 border ${alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}<span className="text-sm">{alert.message}</span>
          </div>
        )}

        {showForm && (
          <form onSubmit={submit} className="mb-6 p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-light">{editingId ? 'Edit appointment' : 'New appointment'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Customer name</span><input className="w-full border border-gray-300 px-3 py-2 text-sm" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Customer email (links to their account)</span><input type="email" className="w-full border border-gray-300 px-3 py-2 text-sm" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></label>
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Date &amp; time *</span><input type="datetime-local" className="w-full border border-gray-300 px-3 py-2 text-sm" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required /></label>
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Duration (free text)</span><input className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="about an hour" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></label>
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Kind *</span><input className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="Collection and fitting" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} required /></label>
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Status</span><select className="w-full border border-gray-300 px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Appointment['status'] })}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="block md:col-span-2"><span className="block text-xs text-gray-600 mb-1">Note</span><textarea className="w-full border border-gray-300 px-3 py-2 text-sm" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" className="bg-gray-900 text-white px-5 py-2 text-sm hover:bg-gray-800">{editingId ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-sm text-gray-600">Cancel</button>
            </div>
          </form>
        )}

        <div className="bg-white border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No appointments yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Kind</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{new Date(a.scheduledAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}{a.duration ? <span className="text-gray-400"> · {a.duration}</span> : null}</td>
                    <td className="px-4 py-3">{a.customerName || '—'}<div className="text-xs text-gray-400">{a.customerEmail}</div></td>
                    <td className="px-4 py-3">{a.kind}{a.note ? <div className="text-xs text-gray-400 max-w-xs truncate">{a.note}</div> : null}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${badge(a.status)}`}>{a.status}</span></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(a)} className="text-gray-500 hover:text-gray-900 mr-3" title="Edit"><Edit className="w-4 h-4 inline" /></button>
                      <button onClick={() => setConfirm({ isOpen: true, id: a.id })} className="text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={confirm.isOpen} onCancel={() => setConfirm({ isOpen: false, id: null })} onConfirm={() => confirm.id && remove(confirm.id)} title="Delete appointment" message="This cannot be undone." confirmText="Delete" />
    </AdminLayout>
  );
}
