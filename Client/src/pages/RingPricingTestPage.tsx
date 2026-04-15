import React, { useState, useEffect } from 'react';
import { Diamond, Search, ChevronDown, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../config/api';

interface Ring {
  id: string;
  sku: string;
  name: string;
  base_price: number | null;
  nivoda_options_config: {
    stoneType?: string;
    caratRange?: { min: number; max: number };
    clarityOptions?: string[];
    colourOptions?: string[];
    cutOptions?: string[];
  } | null;
  nivoda_enabled: boolean;
  show_carat: boolean;
  show_clarity: boolean;
  show_colour: boolean;
  show_cut: boolean;
}

interface DiamondPrice {
  min: number;
  avg: number;
  max: number;
}

interface PriceResult {
  diamond: DiamondPrice;
  count: number;
  matchingDiamonds: any[];
}

const GBP = (val: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);

const RingPricingTestPage: React.FC = () => {
  const [rings, setRings] = useState<Ring[]>([]);
  const [selectedRing, setSelectedRing] = useState<Ring | null>(null);
  const [loadingRings, setLoadingRings] = useState(true);
  const [ringsError, setRingsError] = useState<string | null>(null);

  // Diamond spec fields (editable, pre-filled from ring config)
  const [carat, setCarat] = useState('1.0');
  const [clarity, setClarity] = useState('VS1');
  const [color, setColor] = useState('G');
  const [cut, setCut] = useState('EX');
  const [stoneType, setStoneType] = useState('Natural');

  // Mount price entered manually
  const [mountPrice, setMountPrice] = useState('');

  // Nivoda result
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Chosen price point from the three options
  const [chosenPrice, setChosenPrice] = useState<'min' | 'avg' | 'max'>('avg');

  // ─── Load engagement rings ───────────────────────────────────────────────
  useEffect(() => {
    const fetchRings = async () => {
      try {
        setLoadingRings(true);
        const res = await fetch(`${API_BASE_URL}/products?category=engagement-rings&limit=500`);
        const data = await res.json();
        console.log('[RingPricing] API response:', JSON.stringify(data).slice(0, 300));
        const list: Ring[] = data?.data?.products ?? [];
        const items: Ring[] = Array.isArray(list) ? list : [];
        items.sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true }));
        setRings(items);
      } catch (err: any) {
        setRingsError(err.message);
      } finally {
        setLoadingRings(false);
      }
    };
    fetchRings();
  }, []);

  // ─── When a ring is selected, pre-fill specs from its Nivoda config ──────
  const handleSelectRing = (ring: Ring) => {
    setSelectedRing(ring);
    setPriceResult(null);
    setPriceError(null);

    const cfg = ring.nivoda_options_config;
    if (cfg) {
      if (cfg.caratRange) setCarat(String(cfg.caratRange.min));
      if (cfg.clarityOptions?.length) setClarity(cfg.clarityOptions[0]);
      if (cfg.colourOptions?.length) setColor(cfg.colourOptions[0]);
      if (cfg.cutOptions?.length) setCut(cfg.cutOptions[0]);
      if (cfg.stoneType) setStoneType(cfg.stoneType);
    }
  };

  // ─── Send specs to Nivoda and get diamond price ──────────────────────────
  const handleGetDiamondPrice = async () => {
    try {
      setLoadingPrice(true);
      setPriceError(null);
      setPriceResult(null);

      const params = new URLSearchParams({ carat, clarity, color, cut });
      const res = await fetch(`${API_BASE_URL}/nivoda/diamonds/price-suggestions?${params}`);
      const data = await res.json();

      if (data.success && data.data) {
        setPriceResult({
          diamond: data.data.prices,
          count: data.data.count,
          matchingDiamonds: data.data.matchingDiamonds || [],
        });
      } else {
        setPriceError(data.error || data.message || 'No matching diamonds found in Nivoda inventory');
      }
    } catch (err: any) {
      setPriceError(err.message);
    } finally {
      setLoadingPrice(false);
    }
  };

  const diamondPrice = priceResult ? priceResult.diamond[chosenPrice] : 0;
  const mount = parseFloat(mountPrice) || 0;
  const totalPrice = diamondPrice + mount;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Diamond className="w-7 h-7 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">Ring Pricing Test — Nivoda Integration</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Select a BJ engagement ring → diamond specs auto-fill → fetch live Nivoda price → add mount cost → see total
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Column 1: Ring Selector ─────────────────────────────── */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">1. Select Ring</h2>

            {loadingRings && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading rings…
              </div>
            )}
            {ringsError && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" /> {ringsError}
              </div>
            )}

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {rings.map((ring) => (
                <button
                  key={ring.id}
                  onClick={() => handleSelectRing(ring)}
                  className={`w-full text-left px-3 py-3 rounded-lg border transition-all ${
                    selectedRing?.id === ring.id
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm">{ring.sku}</div>
                  <div className="text-xs text-gray-500 truncate">{ring.name}</div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {ring.nivoda_enabled && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Nivoda</span>
                    )}
                    {ring.nivoda_options_config && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Config set</span>
                    )}
                    {ring.base_price && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        Mount: {GBP(ring.base_price)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {!loadingRings && rings.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-6">No BJ rings found</p>
              )}
            </div>
          </div>

          {/* ── Column 2: Diamond Specs ─────────────────────────────── */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">2. Diamond Specifications</h2>

            {!selectedRing ? (
              <p className="text-gray-400 text-sm text-center py-10">← Select a ring first</p>
            ) : (
              <>
                {/* Ring info banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-800">{selectedRing.sku} — {selectedRing.name}</p>
                  {selectedRing.nivoda_options_config ? (
                    <p className="text-xs text-amber-600 mt-0.5">Specs pre-filled from ring's Nivoda config</p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-0.5">No Nivoda config — using defaults. Adjust manually.</p>
                  )}
                </div>

                {/* Stone Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stone Type</label>
                  <select
                    value={stoneType}
                    onChange={(e) => setStoneType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Natural">Natural</option>
                    <option value="Lab-Grown">Lab-Grown</option>
                  </select>
                </div>

                {/* Carat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carat Weight</label>
                  {selectedRing.nivoda_options_config?.caratRange ? (
                    <div>
                      <input
                        type="range"
                        min={selectedRing.nivoda_options_config.caratRange.min}
                        max={selectedRing.nivoda_options_config.caratRange.max}
                        step="0.05"
                        value={carat}
                        onChange={(e) => setCarat(e.target.value)}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>{selectedRing.nivoda_options_config.caratRange.min}ct</span>
                        <span className="font-semibold text-amber-700">{carat}ct selected</span>
                        <span>{selectedRing.nivoda_options_config.caratRange.max}ct</span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="10"
                      value={carat}
                      onChange={(e) => setCarat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  )}
                </div>

                {/* Clarity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clarity</label>
                  <select
                    value={clarity}
                    onChange={(e) => setClarity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {(selectedRing.nivoda_options_config?.clarityOptions || ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','SI3','I1','I2','I3']).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {(selectedRing.nivoda_options_config?.colourOptions || ['D','E','F','G','H','I','J','K','L','M','N']).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Cut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cut</label>
                  <select
                    value={cut}
                    onChange={(e) => setCut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {(selectedRing.nivoda_options_config?.cutOptions || ['EX','VG','G','F']).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Send to Nivoda */}
                <button
                  onClick={handleGetDiamondPrice}
                  disabled={loadingPrice}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  {loadingPrice ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Fetching from Nivoda…</>
                  ) : (
                    <><Search className="w-4 h-4" /> Get Diamond Price from Nivoda</>
                  )}
                </button>

                {priceError && (
                  <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{priceError}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Column 3: Pricing Summary ────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Nivoda Diamond Price */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold text-gray-800 text-lg border-b pb-2 mb-4">3. Diamond Price (Nivoda)</h2>

              {!priceResult ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  {selectedRing ? 'Click "Get Diamond Price" to fetch' : '← Select a ring first'}
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
                    <CheckCircle className="w-4 h-4" />
                    <span>{priceResult.count} matching diamonds found</span>
                  </div>

                  {/* Specs sent */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600 flex gap-3 flex-wrap">
                    <span><strong>Carat:</strong> {carat}</span>
                    <span><strong>Clarity:</strong> {clarity}</span>
                    <span><strong>Color:</strong> {color}</span>
                    <span><strong>Cut:</strong> {cut}</span>
                  </div>

                  {/* Price range cards */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(['min', 'avg', 'max'] as const).map((key) => (
                      <button
                        key={key}
                        onClick={() => setChosenPrice(key)}
                        className={`rounded-lg p-3 border-2 text-center transition-all ${
                          chosenPrice === key
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                          {key === 'min' ? 'Minimum' : key === 'avg' ? 'Average' : 'Maximum'}
                        </div>
                        <div className="font-bold text-gray-900 text-sm">
                          {GBP(priceResult.diamond[key])}
                        </div>
                        {chosenPrice === key && (
                          <div className="text-xs text-amber-600 mt-1">✓ Selected</div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Top matching diamonds */}
                  {priceResult.matchingDiamonds.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <ChevronDown className="w-3 h-3" /> View top {Math.min(5, priceResult.matchingDiamonds.length)} matching diamonds
                      </summary>
                      <div className="mt-2 space-y-1">
                        {priceResult.matchingDiamonds.slice(0, 5).map((d: any, i: number) => (
                          <div key={i} className="bg-gray-50 rounded p-2 flex justify-between">
                            <span className="text-gray-600">
                              {d.diamond?.carat || d.carat}ct {d.diamond?.clarity || d.clarity} {d.diamond?.color || d.color}
                            </span>
                            <span className="font-medium text-gray-900">
                              {GBP(d.diamond?.price?.value || d.price || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}
            </div>

            {/* Mount Price + Total */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold text-gray-800 text-lg border-b pb-2 mb-4">4. Mount Price &amp; Total</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mount / Setting Price (£)
                </label>
                {selectedRing?.base_price ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={mountPrice}
                      onChange={(e) => setMountPrice(e.target.value)}
                      placeholder={String(selectedRing.base_price)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      onClick={() => setMountPrice(String(selectedRing.base_price))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
                    >
                      Use {GBP(selectedRing.base_price)}
                    </button>
                  </div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={mountPrice}
                    onChange={(e) => setMountPrice(e.target.value)}
                    placeholder="Enter mount price in £"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">Cost of the ring setting without the diamond</p>
              </div>

              {/* Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Diamond ({chosenPrice})</span>
                  <span>{priceResult ? GBP(diamondPrice) : '—'}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Mount / Setting</span>
                  <span>{mount > 0 ? GBP(mount) : '—'}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total Ring Price</span>
                  <span className="text-amber-700 text-lg">
                    {priceResult && mount > 0 ? GBP(totalPrice) : '—'}
                  </span>
                </div>
              </div>

              {priceResult && mount > 0 && (
                <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                  <p>Min total: <strong>{GBP(priceResult.diamond.min + mount)}</strong></p>
                  <p>Avg total: <strong>{GBP(priceResult.diamond.avg + mount)}</strong></p>
                  <p>Max total: <strong>{GBP(priceResult.diamond.max + mount)}</strong></p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RingPricingTestPage;
