import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import API_BASE_URL from '../../config/api';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight, Loader2, RefreshCw, ExternalLink } from 'lucide-react';

const SHAPES = ['ROUND','OVAL','PEAR','CUSHION','PRINCESS','EMERALD','RADIANT','MARQUISE','HEART','ASSCHER'];
const COLORS = ['D','E','F','G','H','I','J','K','L','M'];
const CLARITIES = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2'];
const CUTS = ['EX','VG','G','F','P'];
const POLISHES = ['EX','VG','G','F','P'];
const SYMMETRIES = ['EX','VG','G','F','P'];
const FLUORESCENCES = ['NONE','FAINT','MEDIUM','STRONG','VERY_STRONG'];
const CERTIFICATES = ['GIA','IGI','HRD','GCAL','EGL','GSI','AGS'];
const PAGE_SIZE = 20;

const shapeLabel: Record<string, string> = {
  ROUND:'Round', OVAL:'Oval', PEAR:'Pear', CUSHION:'Cushion',
  PRINCESS:'Princess', EMERALD:'Emerald', RADIANT:'Radiant',
  MARQUISE:'Marquise', HEART:'Heart', ASSCHER:'Asscher',
};

function MultiToggle({ label, options, selected, onChange, small = false }: {
  label: string; options: string[]; selected: string[];
  onChange: (v: string[]) => void; small?: boolean;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1.5 font-satoshi">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map(o => (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={`px-2 py-0.5 rounded text-xs font-satoshi border transition-colors ${
              selected.includes(o)
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600'
            } ${small ? 'text-[11px]' : ''}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ShapeGrid({ selected, onChange }: { selected: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1.5 font-satoshi">Shape</p>
      <div className="grid grid-cols-5 gap-1">
        {SHAPES.map(s => (
          <button key={s} type="button" onClick={() => onChange(selected === s ? '' : s)}
            className={`flex flex-col items-center py-1.5 px-1 rounded border text-[10px] font-satoshi transition-colors ${
              selected === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-500'
            }`}>
            <span className="text-base mb-0.5">💎</span>
            {shapeLabel[s]}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiamondCard({ item }: { item: any }) {
  const cert = item.diamond?.certificate || {};
  const priceGBP = item.price ? (item.price / 100) : 0;
  const pricePerCt = cert.carats ? priceGBP / cert.carats : 0;
  const image = item.diamond?.image;
  const video = item.diamond?.video;
  const availability = item.diamond?.availability;

  const deliveryLabel = availability === 'Memo' ? '4–6 Business days'
    : availability === 'Local' ? '1–2 Business days'
    : availability === 'Online' ? '4–6 Business days'
    : '4–6 Business days';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative bg-gray-100 aspect-square">
        {image ? (
          <img src={image} alt={`${cert.shape} diamond`}
            className="w-full h-full object-contain p-2"
            onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">💎</div>
        )}
        {video && (
          <a href={video} target="_blank" rel="noreferrer"
            className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-[10px] px-1.5 py-0.5 rounded font-satoshi flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Video
          </a>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-white text-gray-700 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-gray-200 font-satoshi">
            {cert.lab || '—'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-3">
        {/* Cert + Stock IDs */}
        <div className="flex items-center gap-2 mb-1.5 text-[10px] text-gray-500 font-satoshi">
          <span>{cert.lab} {cert.certNumber || '—'}</span>
          <span className="text-gray-300">|</span>
          <span className="truncate">Stock: {item.id?.slice(-8) || '—'}</span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-900 font-satoshi mb-1">
          {shapeLabel[cert.shape] || cert.shape || '—'} {cert.carats}ct {cert.color} {cert.clarity} {cert.cut || '—'} {cert.fluorescence || 'None'}
        </p>

        {/* Specs row */}
        <div className="text-[10px] text-gray-500 font-satoshi mb-2 space-y-0.5">
          {cert.measurements && <p>M: {cert.measurements}</p>}
          {(cert.table_pct || cert.depth_pct) && (
            <p>T: {cert.table_pct || '—'}% D: {cert.depth_pct || '—'}%</p>
          )}
        </div>

        {/* Delivery */}
        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2 font-satoshi">
          <span>🚚</span>
          <span>{deliveryLabel}</span>
        </div>

        {/* Price */}
        <div className="border-t border-gray-100 pt-2 mt-1">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-satoshi">Total Price</p>
              <p className="text-lg font-bold text-gray-900 font-satoshi">
                £{priceGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-500 font-satoshi">
                £{pricePerCt.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/ct
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AdminNivoda: React.FC = () => {
  const [tab, setTab] = useState<'natural' | 'lab'>('natural');
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(false);
  const [diamonds, setDiamonds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [shape, setShape] = useState('');
  const [minCarat, setMinCarat] = useState('0.5');
  const [maxCarat, setMaxCarat] = useState('5.0');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [clarities, setClarities] = useState<string[]>([]);
  const [cuts, setCuts] = useState<string[]>([]);
  const [polishes, setPolishes] = useState<string[]>([]);
  const [symmetries, setSymmetries] = useState<string[]>([]);
  const [fluorescences, setFluorescences] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);

  const fetchDiamonds = useCallback(async (pg = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('labgrown', tab === 'lab' ? 'true' : 'false');
      params.set('minCarat', minCarat || '0.5');
      params.set('maxCarat', maxCarat || '10');
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (shape) params.set('shape', shape);
      if (colors.length)        params.set('color',        colors.join(','));
      if (clarities.length)     params.set('clarity',      clarities.join(','));
      if (cuts.length)          params.set('cut',           cuts.join(','));
      if (polishes.length)      params.set('polish',        polishes.join(','));
      if (symmetries.length)    params.set('symmetry',      symmetries.join(','));
      if (fluorescences.length) params.set('fluorescence',  fluorescences.join(','));
      if (certificates.length)  params.set('certificate',   certificates.join(','));
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(pg * PAGE_SIZE));

      const res = await fetch(`${API_BASE_URL}/nivoda/diamonds/search?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load diamonds');
      setDiamonds(data.data?.items || []);
      setTotal(data.total || data.data?.total_count || 0);
      setPage(pg);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, shape, minCarat, maxCarat, minPrice, maxPrice, colors, clarities, cuts, polishes, symmetries, fluorescences, certificates]);

  useEffect(() => { fetchDiamonds(0); }, [tab]);

  const clearAll = () => {
    setShape(''); setMinCarat('0.5'); setMaxCarat('5.0');
    setMinPrice(''); setMaxPrice('');
    setColors([]); setClarities([]); setCuts([]);
    setPolishes([]); setSymmetries([]); setFluorescences([]);
    setCertificates([]);
  };

  const activeFilterCount = [shape, ...colors, ...clarities, ...cuts, ...polishes, ...symmetries, ...fluorescences, ...certificates]
    .filter(Boolean).length;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="max-w-full">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 font-satoshi">Nivoda Diamond Browser</h1>
          <p className="text-sm text-gray-500 font-satoshi mt-0.5">Browse and verify live diamond pricing from Nivoda</p>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 mb-4 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {(['natural','lab'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg font-satoshi transition-colors ${
                tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {t === 'natural' ? '💎 Natural Diamonds' : '🔬 Lab Grown Diamonds'}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 font-satoshi">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-satoshi flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>

                {/* Shape */}
                <ShapeGrid selected={shape} onChange={setShape} />

                {/* Carat Range */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5 font-satoshi">Carat Range</p>
                  <div className="flex items-center gap-2">
                    <input type="number" value={minCarat} onChange={e => setMinCarat(e.target.value)}
                      step="0.1" min="0.1" placeholder="Min"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-satoshi focus:outline-none focus:ring-1 focus:ring-gray-900" />
                    <span className="text-gray-400 text-xs">—</span>
                    <input type="number" value={maxCarat} onChange={e => setMaxCarat(e.target.value)}
                      step="0.1" min="0.1" placeholder="Max"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-satoshi focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5 font-satoshi">Price Range (£)</p>
                  <div className="flex items-center gap-2">
                    <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-satoshi focus:outline-none focus:ring-1 focus:ring-gray-900" />
                    <span className="text-gray-400 text-xs">—</span>
                    <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-satoshi focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  </div>
                </div>

                <MultiToggle label="Colour" options={COLORS} selected={colors} onChange={setColors} />
                <MultiToggle label="Clarity" options={CLARITIES} selected={clarities} onChange={setClarities} small />
                <MultiToggle label="Cut" options={CUTS} selected={cuts} onChange={setCuts} small />
                <MultiToggle label="Polish" options={POLISHES} selected={polishes} onChange={setPolishes} small />
                <MultiToggle label="Symmetry" options={SYMMETRIES} selected={symmetries} onChange={setSymmetries} small />
                <MultiToggle label="Fluorescence" options={FLUORESCENCES} selected={fluorescences} onChange={setFluorescences} small />
                <MultiToggle label="Certificate" options={CERTIFICATES} selected={certificates} onChange={setCertificates} small />

                <button onClick={() => fetchDiamonds(0)}
                  className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg font-satoshi hover:bg-gray-700 flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowFilters(v => !v)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-satoshi border border-gray-300 rounded-lg px-3 py-1.5 hover:border-gray-500">
                  <SlidersHorizontal className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                  {activeFilterCount > 0 && (
                    <span className="bg-gray-900 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
                  )}
                </button>
                <p className="text-sm text-gray-600 font-satoshi">
                  {loading ? 'Searching...' : `${total.toLocaleString()} results`}
                </p>
              </div>
              <button onClick={() => fetchDiamonds(page)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-satoshi">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {shape && <Chip label={`Shape: ${shapeLabel[shape] || shape}`} onRemove={() => setShape('')} />}
                {colors.map(c => <Chip key={c} label={`Colour: ${c}`} onRemove={() => setColors(v => v.filter(x => x !== c))} />)}
                {clarities.map(c => <Chip key={c} label={`Clarity: ${c}`} onRemove={() => setClarities(v => v.filter(x => x !== c))} />)}
                {cuts.map(c => <Chip key={c} label={`Cut: ${c}`} onRemove={() => setCuts(v => v.filter(x => x !== c))} />)}
                {certificates.map(c => <Chip key={c} label={`Cert: ${c}`} onRemove={() => setCertificates(v => v.filter(x => x !== c))} />)}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 font-satoshi">
                {error}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : diamonds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <span className="text-5xl mb-3">💎</span>
                <p className="font-satoshi text-sm">No diamonds found. Adjust filters and search.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {diamonds.map((item, i) => <DiamondCard key={item.id || i} item={item} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button onClick={() => fetchDiamonds(page - 1)} disabled={page === 0 || loading}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-satoshi disabled:opacity-40 hover:border-gray-600">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-sm text-gray-600 font-satoshi">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button onClick={() => fetchDiamonds(page + 1)} disabled={page >= totalPages - 1 || loading}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-satoshi disabled:opacity-40 hover:border-gray-600">
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
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

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-satoshi">
      {label}
      <button onClick={onRemove} className="text-gray-500 hover:text-gray-900"><X className="w-3 h-3" /></button>
    </span>
  );
}

export default AdminNivoda;
