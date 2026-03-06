import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Gem,
  Search,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  PencilLine,
  Check,
  X,
  ChevronDown,
  Layers,
  SlidersHorizontal,
  CheckSquare,
  Square,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import API_BASE_URL from '../../config/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  total_designs: number;
  active_designs: number;
  total_variants: number;
  priced_variants: number;
  metals: Array<{ metal_type: string; cnt: number }>;
}

interface Design {
  id: string;
  name: string;
  sku: string;
  is_active: boolean;
  variants_count: number;
  active_variants: number;
  priced_variants: number;
  metals: string[] | null;
  widths: string[] | null;
  created_at: string;
}

interface Variant {
  id: string;
  variant_name: string;
  sku: string;
  metal_type: string | null;
  mm_width: string | null;
  size: string | null;
  price: string | null;
  is_active: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const token = () => localStorage.getItem('admin_token') || '';
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

function fmtPrice(v: string | null): string {
  if (v === null || v === undefined || v === '') return '';
  const n = parseFloat(v);
  return isNaN(n) ? '' : n.toFixed(2);
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide font-satoshi">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 font-satoshi">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5 font-satoshi">{sub}</p>}
    </div>
  );
}

// ── Inline price editor ────────────────────────────────────────────────────────

function PriceCell({
  variant,
  onSave,
}: {
  variant: Variant;
  onSave: (id: string, price: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(fmtPrice(variant.price));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = async () => {
    setSaving(true);
    await onSave(variant.id, val);
    setSaving(false);
    setEditing(false);
  };

  const cancel = () => {
    setVal(fmtPrice(variant.price));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-sm">£</span>
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          className="w-20 border border-gray-300 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800 font-satoshi"
        />
        <button onClick={commit} disabled={saving} className="text-green-600 hover:text-green-700">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={cancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 font-satoshi"
    >
      {val ? `£${val}` : <span className="text-gray-300 italic">—</span>}
      <PencilLine className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const AdminWeddingRings: React.FC = () => {
  // Stats
  const [stats, setStats] = useState<Stats | null>(null);

  // Designs list
  const [designs, setDesigns] = useState<Design[]>([]);
  const [designPagination, setDesignPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [designSearch, setDesignSearch] = useState('');
  const [designMetalFilter, setDesignMetalFilter] = useState('');
  const [designsLoading, setDesignsLoading] = useState(true);

  // Selected design / variants panel
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantPagination, setVariantPagination] = useState<Pagination>({
    page: 1, limit: 60, total: 0, totalPages: 0,
  });
  const [variantMetalFilter, setVariantMetalFilter] = useState('');
  const [variantProfileFilter, setVariantProfileFilter] = useState('');
  const [variantWidthFilter, setVariantWidthFilter] = useState('');
  const [variantsLoading, setVariantsLoading] = useState(false);

  // Bulk selection
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/admin/wedding-rings/stats`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setStats(d.data);
    } catch { /* silent */ }
  }, []);

  // ── Fetch designs ──────────────────────────────────────────────────────────
  const fetchDesigns = useCallback(async (page = 1) => {
    setDesignsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: designPagination.limit.toString(),
        search: designSearch,
        metal: designMetalFilter,
      });
      const r = await fetch(`${API_BASE_URL}/admin/wedding-rings?${params}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        setDesigns(d.data.designs);
        setDesignPagination(d.data.pagination);
      }
    } catch { /* silent */ }
    setDesignsLoading(false);
  }, [designSearch, designMetalFilter, designPagination.limit]);

  // ── Fetch variants ─────────────────────────────────────────────────────────
  const fetchVariants = useCallback(async (designId: string, page = 1) => {
    setVariantsLoading(true);
    setSelectedVariants(new Set());
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: variantPagination.limit.toString(),
        metal: variantMetalFilter,
        profile: variantProfileFilter,
        width: variantWidthFilter,
      });
      const r = await fetch(`${API_BASE_URL}/admin/wedding-rings/${designId}/variants?${params}`, {
        headers: authHeaders(),
      });
      const d = await r.json();
      if (d.success) {
        setVariants(d.data.variants);
        setVariantPagination(d.data.pagination);
      }
    } catch { /* silent */ }
    setVariantsLoading(false);
  }, [variantMetalFilter, variantProfileFilter, variantWidthFilter, variantPagination.limit]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchDesigns(1); }, [designSearch, designMetalFilter]);
  useEffect(() => {
    if (selectedDesign) fetchVariants(selectedDesign.id, 1);
  }, [variantMetalFilter, variantProfileFilter, variantWidthFilter, selectedDesign?.id]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const selectDesign = (design: Design) => {
    setSelectedDesign(design);
    setVariantMetalFilter('');
    setVariantProfileFilter('');
    setVariantWidthFilter('');
    setVariantPagination(p => ({ ...p, page: 1 }));
    fetchVariants(design.id, 1);
  };

  const toggleDesignStatus = async (design: Design) => {
    try {
      const r = await fetch(`${API_BASE_URL}/admin/wedding-rings/${design.id}/toggle-status`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const d = await r.json();
      if (d.success) {
        setDesigns(prev => prev.map(des => des.id === design.id ? { ...des, is_active: d.data.is_active } : des));
        if (selectedDesign?.id === design.id) setSelectedDesign(s => s ? { ...s, is_active: d.data.is_active } : s);
        showToast('success', `${design.sku} ${d.data.is_active ? 'activated' : 'deactivated'}`);
        fetchStats();
      }
    } catch { showToast('error', 'Failed to toggle status'); }
  };

  const saveVariantPrice = async (variantId: string, price: string) => {
    try {
      const r = await fetch(`${API_BASE_URL}/admin/wedding-rings/variants/${variantId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ price: price === '' ? null : parseFloat(price) }),
      });
      const d = await r.json();
      if (d.success) {
        setVariants(prev => prev.map(v => v.id === variantId ? { ...v, price: d.data.price } : v));
        fetchStats();
        showToast('success', 'Price saved');
      } else {
        showToast('error', d.message || 'Save failed');
      }
    } catch { showToast('error', 'Save failed'); }
  };

  const toggleVariantStatus = async (variant: Variant) => {
    try {
      const r = await fetch(`${API_BASE_URL}/admin/wedding-rings/variants/${variant.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !variant.is_active }),
      });
      const d = await r.json();
      if (d.success) {
        setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, is_active: d.data.is_active } : v));
        showToast('success', `Variant ${d.data.is_active ? 'activated' : 'deactivated'}`);
      }
    } catch { showToast('error', 'Failed to toggle variant'); }
  };

  // ── Bulk selection ─────────────────────────────────────────────────────────
  const toggleVariantSelect = (id: string) => {
    setSelectedVariants(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVariants.size === variants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(variants.map(v => v.id)));
    }
  };

  const applyBulkPrice = async () => {
    if (!selectedVariants.size) return;
    setBulkSaving(true);
    try {
      const r = await fetch(`${API_BASE_URL}/admin/wedding-rings/variants/bulk`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          variant_ids: [...selectedVariants],
          price: bulkPrice === '' ? null : parseFloat(bulkPrice),
        }),
      });
      const d = await r.json();
      if (d.success) {
        showToast('success', `${d.data.updated} variants updated`);
        if (selectedDesign) fetchVariants(selectedDesign.id, variantPagination.page);
        fetchStats();
        setSelectedVariants(new Set());
        setBulkPrice('');
      } else {
        showToast('error', d.message || 'Bulk update failed');
      }
    } catch { showToast('error', 'Bulk update failed'); }
    setBulkSaving(false);
  };

  // Unique metals from designs for filter dropdown
  const allMetals = stats?.metals.map(m => m.metal_type) ?? [];
  const PROFILES = ['Concave', 'D-Shape', 'Flat', 'Flat Court', 'Soft Court', 'Traditional Court'];
  const WIDTHS = ['2.5', '3', '4', '5', '6'];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white font-satoshi transition-all ${
          toast.type === 'success' ? 'bg-gray-900' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Gem className="w-6 h-6 text-gray-700" />
              <h1 className="text-2xl font-semibold text-gray-900 font-satoshi">Wedding Rings</h1>
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full font-satoshi">
                Diamond-cut
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 font-satoshi">
              Manage designs and their metal / width / profile variants
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Designs" value={stats?.total_designs ?? '—'} />
          <StatCard label="Active Designs" value={stats?.active_designs ?? '—'} />
          <StatCard label="Total Variants" value={stats?.total_variants ?? '—'} />
          <StatCard
            label="Priced Variants"
            value={stats?.priced_variants ?? '—'}
            sub={stats ? `${Math.round((stats.priced_variants / stats.total_variants) * 100)}% complete` : undefined}
          />
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-4 min-h-[600px]">

          {/* ── LEFT: Designs list ────────────────────────────────────────── */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Designs toolbar */}
            <div className="p-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search design code…"
                  value={designSearch}
                  onChange={e => setDesignSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-800 font-satoshi"
                />
              </div>
              <select
                value={designMetalFilter}
                onChange={e => setDesignMetalFilter(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-800 font-satoshi text-gray-700"
              >
                <option value="">All metals</option>
                {allMetals.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Designs count */}
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500 font-satoshi">
                {designPagination.total.toLocaleString()} design{designPagination.total !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Designs list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {designsLoading ? (
                <div className="p-6 text-center text-sm text-gray-400 font-satoshi">Loading…</div>
              ) : designs.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400 font-satoshi">No designs found</div>
              ) : designs.map(design => (
                <button
                  key={design.id}
                  onClick={() => selectDesign(design)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                    selectedDesign?.id === design.id ? 'bg-gray-100 border-l-2 border-gray-900' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 font-satoshi">{design.sku}</span>
                    <button
                      onClick={e => { e.stopPropagation(); toggleDesignStatus(design); }}
                      className={`shrink-0 ${design.is_active ? 'text-gray-900' : 'text-gray-300'}`}
                    >
                      {design.is_active
                        ? <ToggleRight className="w-4 h-4" />
                        : <ToggleLeft className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-satoshi">{design.variants_count} variants</span>
                    {design.priced_variants > 0 && (
                      <span className="text-xs text-gray-400 font-satoshi">· {design.priced_variants} priced</span>
                    )}
                  </div>
                  {design.metals && design.metals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {design.metals.slice(0, 3).map(m => (
                        <span key={m} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-satoshi">
                          {m}
                        </span>
                      ))}
                      {design.metals.length > 3 && (
                        <span className="text-[10px] text-gray-400 font-satoshi">+{design.metals.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Designs pagination */}
            {designPagination.totalPages > 1 && (
              <div className="p-2 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => fetchDesigns(designPagination.page - 1)}
                  disabled={designPagination.page <= 1}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 font-satoshi">
                  {designPagination.page} / {designPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchDesigns(designPagination.page + 1)}
                  disabled={designPagination.page >= designPagination.totalPages}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: Variants panel ──────────────────────────────────────── */}
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
            {!selectedDesign ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                <Layers className="w-10 h-10 opacity-40" />
                <p className="text-sm font-satoshi">Select a design to view its variants</p>
              </div>
            ) : (
              <>
                {/* Variants header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 font-satoshi">
                      {selectedDesign.sku}
                    </h2>
                    <p className="text-xs text-gray-500 font-satoshi">
                      {variantPagination.total.toLocaleString()} variants
                      {selectedDesign.priced_variants > 0
                        ? ` · ${selectedDesign.priced_variants} priced`
                        : ' · no prices set'}
                    </p>
                  </div>

                  {/* Bulk price bar */}
                  {selectedVariants.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-satoshi">
                        {selectedVariants.size} selected
                      </span>
                      <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-400">£</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="bulk price"
                          value={bulkPrice}
                          onChange={e => setBulkPrice(e.target.value)}
                          className="w-20 text-xs focus:outline-none font-satoshi"
                        />
                      </div>
                      <button
                        onClick={applyBulkPrice}
                        disabled={bulkSaving}
                        className="px-3 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700 font-satoshi disabled:opacity-50"
                      >
                        {bulkSaving ? 'Saving…' : 'Apply'}
                      </button>
                      <button
                        onClick={() => setSelectedVariants(new Set())}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Variant filters */}
                <div className="px-4 py-2 border-b border-gray-100 flex gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500 font-satoshi">Filter:</span>
                  </div>
                  <select
                    value={variantMetalFilter}
                    onChange={e => setVariantMetalFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-800 font-satoshi text-gray-700"
                  >
                    <option value="">All metals</option>
                    {allMetals.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={variantProfileFilter}
                    onChange={e => setVariantProfileFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-800 font-satoshi text-gray-700"
                  >
                    <option value="">All profiles</option>
                    {PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select
                    value={variantWidthFilter}
                    onChange={e => setVariantWidthFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-800 font-satoshi text-gray-700"
                  >
                    <option value="">All widths</option>
                    {WIDTHS.map(w => <option key={w} value={w}>{w}mm</option>)}
                  </select>
                  {(variantMetalFilter || variantProfileFilter || variantWidthFilter) && (
                    <button
                      onClick={() => { setVariantMetalFilter(''); setVariantProfileFilter(''); setVariantWidthFilter(''); }}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 font-satoshi"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {/* Variants table */}
                <div className="flex-1 overflow-auto">
                  {variantsLoading ? (
                    <div className="p-8 text-center text-sm text-gray-400 font-satoshi">Loading…</div>
                  ) : variants.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400 font-satoshi">No variants match the current filters</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="w-8 px-3 py-2 text-left">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-700">
                              {selectedVariants.size === variants.length && variants.length > 0
                                ? <CheckSquare className="w-4 h-4" />
                                : <Square className="w-4 h-4" />}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide font-satoshi">Metal</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide font-satoshi">Width</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide font-satoshi">Profile</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide font-satoshi">Weight</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide font-satoshi">Price</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide font-satoshi">Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {variants.map(v => (
                          <tr
                            key={v.id}
                            className={`hover:bg-gray-50 transition-colors ${selectedVariants.has(v.id) ? 'bg-gray-50' : ''}`}
                          >
                            <td className="px-3 py-2">
                              <button onClick={() => toggleVariantSelect(v.id)} className="text-gray-400 hover:text-gray-700">
                                {selectedVariants.has(v.id)
                                  ? <CheckSquare className="w-4 h-4 text-gray-700" />
                                  : <Square className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="px-3 py-2 font-satoshi text-gray-700 whitespace-nowrap">
                              {v.metal_type ?? '—'}
                            </td>
                            <td className="px-3 py-2 font-satoshi text-gray-700 whitespace-nowrap">
                              {v.mm_width ? `${v.mm_width}mm` : '—'}
                            </td>
                            <td className="px-3 py-2 font-satoshi text-gray-700">
                              {/* variant_name is "Profile (Weight)" — strip the weight part */}
                              {v.variant_name.replace(/\s*\([^)]*\)$/, '')}
                            </td>
                            <td className="px-3 py-2 font-satoshi text-gray-500">
                              {v.size ?? '—'}
                            </td>
                            <td className="px-3 py-2">
                              <PriceCell variant={v} onSave={saveVariantPrice} />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => toggleVariantStatus(v)}
                                className={v.is_active ? 'text-gray-900' : 'text-gray-300'}
                              >
                                {v.is_active
                                  ? <ToggleRight className="w-4 h-4 mx-auto" />
                                  : <ToggleLeft className="w-4 h-4 mx-auto" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Variant pagination */}
                {variantPagination.totalPages > 1 && (
                  <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-satoshi">
                      Page {variantPagination.page} of {variantPagination.totalPages}
                      {' '}· {variantPagination.total.toLocaleString()} total
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => fetchVariants(selectedDesign.id, variantPagination.page - 1)}
                        disabled={variantPagination.page <= 1}
                        className="p-1 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => fetchVariants(selectedDesign.id, variantPagination.page + 1)}
                        disabled={variantPagination.page >= variantPagination.totalPages}
                        className="p-1 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWeddingRings;
