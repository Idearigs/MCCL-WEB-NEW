import React, { useState, useEffect } from 'react';
import { Trash2, Edit, AlertCircle, CheckCircle, Gem, X, Plus } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import AdminLayout from '../components/AdminLayout';

/**
 * AdminPieces — the record of everything the workshop has made for a client.
 * Backs the AccountV2 "Your pieces" pane (GET/POST/PUT/DELETE /pieces, adminAuth).
 * Linking a customer by email attaches the piece to their account. `documents` is a list
 * of { label, meta, url } — certificate / valuation / service history links.
 */

interface Doc { label: string; meta?: string; url?: string }
interface Piece {
  id: string;
  customerEmail?: string;
  name: string;
  spec?: string;
  madeOn?: string;
  maker?: string;
  image?: string;
  documents?: Doc[];
}

const EMPTY = { customerEmail: '', name: '', spec: '', madeOn: '', maker: '', image: '', documents: [] as Doc[] };

export default function AdminPieces(): JSX.Element {
  const [items, setItems] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirm, setConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const token = () => localStorage.getItem('admin_token');
  const authHeaders = () => ({ 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });
  const flash = (type: 'success' | 'error', message: string) => { setAlert({ type, message }); setTimeout(() => setAlert(null), 3500); };

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/pieces`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch { flash('error', 'Failed to fetch pieces'); } finally { setLoading(false); }
  };

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY, documents: [] }); setShowForm(true); };
  const openEdit = (p: Piece) => {
    setEditingId(p.id);
    setForm({ customerEmail: p.customerEmail || '', name: p.name, spec: p.spec || '', madeOn: p.madeOn || '', maker: p.maker || '', image: p.image || '', documents: p.documents ? [...p.documents] : [] });
    setShowForm(true);
  };

  const setDoc = (i: number, key: keyof Doc, val: string) => setForm((f) => ({ ...f, documents: f.documents.map((d, di) => (di === i ? { ...d, [key]: val } : d)) }));
  const addDoc = () => setForm((f) => ({ ...f, documents: [...f.documents, { label: '', meta: '', url: '' }] }));
  const removeDoc = (i: number) => setForm((f) => ({ ...f, documents: f.documents.filter((_, di) => di !== i) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { flash('error', 'A piece name is required'); return; }
    const payload = { ...form, documents: form.documents.filter((d) => d.label.trim()) };
    try {
      const res = await fetch(`${API_BASE_URL}/pieces${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { flash('success', editingId ? 'Piece updated' : 'Piece created'); setShowForm(false); fetchItems(); }
      else flash('error', data.message || 'Save failed');
    } catch { flash('error', 'Save failed'); }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/pieces/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.success) { flash('success', 'Piece deleted'); fetchItems(); }
    } catch { flash('error', 'Delete failed'); }
    setConfirm({ isOpen: false, id: null });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-gray-900 flex items-center gap-2"><Gem className="w-6 h-6" /> Client pieces</h1>
            <p className="text-sm text-gray-500 mt-1">The record of everything made for a client, with its documents — shown in their account.</p>
          </div>
          <button onClick={openNew} className="bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 transition-colors">New piece</button>
        </div>

        {alert && (
          <div className={`mb-4 p-3 flex items-center gap-2 border ${alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}<span className="text-sm">{alert.message}</span>
          </div>
        )}

        {showForm && (
          <form onSubmit={submit} className="mb-6 p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-light">{editingId ? 'Edit piece' : 'New piece'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Customer email (links to their account)</span><input type="email" className="w-full border border-gray-300 px-3 py-2 text-sm" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></label>
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Piece name *</span><input className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="Rosalind" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label className="block md:col-span-2"><span className="block text-xs text-gray-600 mb-1">Specification</span><input className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="Platinum 950 · 0.70ct, G VVS2" value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} /></label>
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Made (free text)</span><input className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="December 2019" value={form.madeOn} onChange={(e) => setForm({ ...form, madeOn: e.target.value })} /></label>
              <label className="block"><span className="block text-xs text-gray-600 mb-1">Maker</span><input className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="Eleanor McCulloch" value={form.maker} onChange={(e) => setForm({ ...form, maker: e.target.value })} /></label>
              <label className="block md:col-span-2"><span className="block text-xs text-gray-600 mb-1">Image URL</span><input className="w-full border border-gray-300 px-3 py-2 text-sm" placeholder="/uploads/..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
            </div>

            {/* Documents editor */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 uppercase tracking-wide">Documents (certificate, valuation, service history)</span>
                <button type="button" onClick={addDoc} className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
              </div>
              {form.documents.length === 0 && <p className="text-xs text-gray-400">No documents yet.</p>}
              {form.documents.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <input className="col-span-4 border border-gray-300 px-2 py-1.5 text-sm" placeholder="Label (GIA certificate)" value={d.label} onChange={(e) => setDoc(i, 'label', e.target.value)} />
                  <input className="col-span-3 border border-gray-300 px-2 py-1.5 text-sm" placeholder="Meta (PDF)" value={d.meta || ''} onChange={(e) => setDoc(i, 'meta', e.target.value)} />
                  <input className="col-span-4 border border-gray-300 px-2 py-1.5 text-sm" placeholder="URL (optional)" value={d.url || ''} onChange={(e) => setDoc(i, 'url', e.target.value)} />
                  <button type="button" onClick={() => removeDoc(i)} className="col-span-1 text-gray-400 hover:text-red-600 flex justify-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button type="submit" className="bg-gray-900 text-white px-5 py-2 text-sm hover:bg-gray-800">{editingId ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-sm text-gray-600">Cancel</button>
            </div>
          </form>
        )}

        <div className="bg-white border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No pieces yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr><th className="px-4 py-3">Piece</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Made</th><th className="px-4 py-3">Docs</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{p.name}{p.spec ? <div className="text-xs text-gray-400 max-w-xs truncate">{p.spec}</div> : null}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.customerEmail || '—'}</td>
                    <td className="px-4 py-3">{[p.madeOn, p.maker].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="px-4 py-3">{p.documents?.length || 0}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(p)} className="text-gray-500 hover:text-gray-900 mr-3" title="Edit"><Edit className="w-4 h-4 inline" /></button>
                      <button onClick={() => setConfirm({ isOpen: true, id: p.id })} className="text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={confirm.isOpen} onCancel={() => setConfirm({ isOpen: false, id: null })} onConfirm={() => confirm.id && remove(confirm.id)} title="Delete piece" message="This cannot be undone." confirmText="Delete" />
    </AdminLayout>
  );
}
