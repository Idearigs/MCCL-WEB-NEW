import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LuxuryNavigationWhite from '@/components/LuxuryNavigationWhite';
import { FooterSection } from '@/components/FooterSection';
import FavoriteButton from '@/components/FavoriteButton';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL, { getMediaUrl } from '../config/api';

// ── UK ring sizes ─────────────────────────────────────────────────────────────
const UK_SIZES = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
];

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Variant {
  id: string;
  sku: string;
  variant_name: string;
  price: number | null;
  metal_type: string | null;
  metal_id: string | null;
  size: string | null;          // finish/weight or diamond_spread
  mm_width: number | null;
  carat_weight: number | null;
  ai_description: string | null; // "Sleeve: 9ct White" for Two Color
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  is_primary: boolean;
  metal_id?: string;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  base_price: number;
  description?: string;
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: Variant[];
  breadcrumbs?: Array<{ name: string; href: string }>;
  available_metals?: Array<{ id: string; name: string; color?: string }>;
  jewelry_sub_type_id?: string | null;
}

// ── Ring type detection ───────────────────────────────────────────────────────
// Diamond Set:  SKU has 6 parts  (code|metal|quality|spread|carat|mm)
// Two Color:    SKU has 5 parts, 3rd part is a metal name (not a number)
// Diamond Cut:  SKU has 5 parts, 3rd part is a number (width)
type RingType = 'diamond-cut' | 'diamond-set' | 'two-color' | 'unknown';

const detectRingType = (variants: Variant[]): RingType => {
  if (!variants.length) return 'unknown';
  const first = variants[0];
  // Two Color stores sleeve metal in ai_description
  if (first.ai_description && first.ai_description.startsWith('Sleeve:')) return 'two-color';
  // Diamond Set has carat_weight
  if (first.carat_weight !== null && first.carat_weight !== undefined) return 'diamond-set';
  return 'diamond-cut';
};

// ── SKU parsers ───────────────────────────────────────────────────────────────
const parseDiamondCutSku = (sku: string) => {
  const p = sku.split('|');
  return { metal: p[1] ?? '', width: p[2] ?? '', profile: p[3] ?? '', finish: p[4] ?? '' };
};

const parseDiamondSetSku = (sku: string) => {
  const p = sku.split('|');
  // quality stored as single char: N=Natural, L=Lab-grown
  const qualityChar = p[2] ?? '';
  const quality = qualityChar === 'N' ? 'Natural' : qualityChar === 'L' ? 'Lab-Grown' : qualityChar;
  return { metal: p[1] ?? '', quality, spread: p[3] ?? '', carat: p[4] ?? '', width: p[5] ?? '' };
};

const parseTwoColorSku = (sku: string) => {
  const p = sku.split('|');
  return { baseMetal: p[1] ?? '', sleeveMetal: p[2] ?? '', width: p[3] ?? '', weight: p[4] ?? '' };
};

// ── Utility ───────────────────────────────────────────────────────────────────
const unique = <T,>(arr: T[]): T[] => Array.from(new Set(arr));
const fmt = (n: number) =>
  `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ── Option button ─────────────────────────────────────────────────────────────
const Opt = ({
  active, onClick, children, className = ''
}: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-xs font-inter font-light border transition-all ${className} ${
      active
        ? 'border-gray-900 bg-gray-900 text-white'
        : 'border-gray-300 text-gray-700 hover:border-gray-600'
    }`}
  >
    {children}
  </button>
);

// ── Size grid button ──────────────────────────────────────────────────────────
const SizeBtn = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className={`w-9 h-9 text-xs font-inter font-light border transition-all ${
      active
        ? 'border-gray-900 bg-gray-900 text-white'
        : 'border-gray-200 text-gray-700 hover:border-gray-600'
    }`}
  >
    {label}
  </button>
);

// ── Accordion row ─────────────────────────────────────────────────────────────
const renderDescription = (text: string | undefined) => {
  if (!text) return null;
  const blocks: { type: 'title' | 'header' | 'body'; text: string }[] = [];
  let current = '';
  const flush = () => {
    const t = current.trim();
    if (!t) return;
    const isTitle = t.includes('–') && !t.includes('\n');
    const isHeader = !isTitle && t.length < 70 && !t.endsWith('.') && !t.endsWith(',') && /^[A-Z]/.test(t);
    blocks.push({ type: isTitle ? 'title' : isHeader ? 'header' : 'body', text: t });
    current = '';
  };
  for (const line of text.split('\n')) {
    if (!line.trim()) { flush(); } else { current += (current ? ' ' : '') + line.trim(); }
  }
  flush();
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'title') return <p key={i} className="font-medium text-gray-900 text-sm leading-snug">{block.text}</p>;
        if (block.type === 'header') return <p key={i} className="font-medium text-gray-800 text-xs uppercase tracking-wide pt-2">{block.text}</p>;
        return <p key={i} className="text-sm font-inter font-light text-gray-600 leading-relaxed">{block.text}</p>;
      })}
    </div>
  );
};

const AccordionRow = ({ label, content }: { label: string; content: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900">{label}</span>
        <span className="text-gray-500 text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="pb-4">{renderDescription(content)}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── CONFIGURATORS ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ── Diamond Cut Configurator ──────────────────────────────────────────────────
const DiamondCutConfigurator = ({
  variants,
  onVariantMatch,
}: {
  variants: Variant[];
  onVariantMatch: (v: Variant | null) => void;
}) => {
  const metals   = useMemo(() => unique(variants.map(v => parseDiamondCutSku(v.sku).metal).filter(Boolean)).sort(), [variants]);
  const [metal,   setMetal]   = useState(metals[0] ?? '');
  const [width,   setWidth]   = useState('');
  const [profile, setProfile] = useState('');
  const [finish,  setFinish]  = useState('');

  const widths = useMemo(() =>
    unique(variants.filter(v => parseDiamondCutSku(v.sku).metal === metal).map(v => parseDiamondCutSku(v.sku).width).filter(Boolean))
      .sort((a, b) => parseFloat(a) - parseFloat(b)),
    [variants, metal]);

  const profiles = useMemo(() =>
    unique(variants.filter(v => { const p = parseDiamondCutSku(v.sku); return p.metal === metal && p.width === width; }).map(v => parseDiamondCutSku(v.sku).profile).filter(Boolean)).sort(),
    [variants, metal, width]);

  const finishes = useMemo(() =>
    unique(variants.filter(v => { const p = parseDiamondCutSku(v.sku); return p.metal === metal && p.width === width && p.profile === profile; }).map(v => parseDiamondCutSku(v.sku).finish).filter(Boolean)).sort(),
    [variants, metal, width, profile]);

  // Cascade auto-select
  useEffect(() => { if (widths.length && !widths.includes(width)) setWidth(widths[0]); }, [widths]);
  useEffect(() => { if (profiles.length && !profiles.includes(profile)) setProfile(profiles[0]); }, [profiles]);
  useEffect(() => { if (finishes.length && !finishes.includes(finish)) setFinish(finishes[0]); }, [finishes]);

  // Match variant
  useEffect(() => {
    const matched = variants.find(v => {
      const p = parseDiamondCutSku(v.sku);
      return p.metal === metal && p.width === width && p.profile === profile && (!finish || p.finish === finish);
    }) ?? null;
    onVariantMatch(matched);
  }, [metal, width, profile, finish, variants]);

  return (
    <div className="space-y-6">
      {metals.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Metal — <span className="font-normal">{metal}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {metals.map(m => <Opt key={m} active={metal === m} onClick={() => setMetal(m)}>{m}</Opt>)}
          </div>
        </div>
      )}

      {widths.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Width — <span className="font-normal">{width ? `${width}mm` : '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {widths.map(w => <Opt key={w} active={width === w} onClick={() => setWidth(w)}>{w}mm</Opt>)}
          </div>
        </div>
      )}

      {profiles.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Profile — <span className="font-normal">{profile || '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {profiles.map(p => <Opt key={p} active={profile === p} onClick={() => setProfile(p)}>{p}</Opt>)}
          </div>
        </div>
      )}

      {finishes.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Finish — <span className="font-normal">{finish || '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {finishes.map(f => <Opt key={f} active={finish === f} onClick={() => setFinish(f)}>{f}</Opt>)}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Diamond Set Configurator ──────────────────────────────────────────────────
const DiamondSetConfigurator = ({
  variants,
  onVariantMatch,
}: {
  variants: Variant[];
  onVariantMatch: (v: Variant | null) => void;
}) => {
  const metals   = useMemo(() => unique(variants.map(v => parseDiamondSetSku(v.sku).metal).filter(Boolean)).sort(), [variants]);
  const qualities = useMemo(() => unique(variants.map(v => parseDiamondSetSku(v.sku).quality).filter(Boolean)).sort(), [variants]);

  const [metal,   setMetal]   = useState(metals[0] ?? '');
  const [quality, setQuality] = useState(qualities[0] ?? '');
  const [spread,  setSpread]  = useState('');
  const [width,   setWidth]   = useState('');

  const spreads = useMemo(() =>
    unique(variants.filter(v => { const p = parseDiamondSetSku(v.sku); return p.metal === metal && p.quality === quality; }).map(v => parseDiamondSetSku(v.sku).spread).filter(Boolean)).sort(),
    [variants, metal, quality]);

  const widths = useMemo(() =>
    unique(
      variants
        .filter(v => { const p = parseDiamondSetSku(v.sku); return p.metal === metal && p.quality === quality && p.spread === spread; })
        .map(v => parseDiamondSetSku(v.sku).width)
        .filter(Boolean)
    ).sort((a, b) => parseFloat(a) - parseFloat(b)),
    [variants, metal, quality, spread]);

  useEffect(() => { if (spreads.length && !spreads.includes(spread)) setSpread(spreads[0]); }, [spreads]);
  useEffect(() => { if (widths.length && !widths.includes(width)) setWidth(widths[0]); }, [widths]);

  useEffect(() => {
    const matched = variants.find(v => {
      const p = parseDiamondSetSku(v.sku);
      return p.metal === metal && p.quality === quality && p.spread === spread && (!width || p.width === width);
    }) ?? null;
    onVariantMatch(matched);
  }, [metal, quality, spread, width, variants]);

  return (
    <div className="space-y-6">
      {metals.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Metal — <span className="font-normal">{metal}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {metals.map(m => <Opt key={m} active={metal === m} onClick={() => setMetal(m)}>{m}</Opt>)}
          </div>
        </div>
      )}

      {qualities.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Diamond Quality — <span className="font-normal">{quality}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {qualities.map(q => <Opt key={q} active={quality === q} onClick={() => setQuality(q)}>{q}</Opt>)}
          </div>
        </div>
      )}

      {spreads.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Diamond Coverage — <span className="font-normal">{spread}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {spreads.map(s => <Opt key={s} active={spread === s} onClick={() => setSpread(s)}>{s}</Opt>)}
          </div>
          <p className="mt-2 text-[10px] font-inter font-light text-gray-400 leading-snug">
            50% = diamonds set halfway around · 100% = full eternity
          </p>
        </div>
      )}

      {widths.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Ring Width — <span className="font-normal">{width ? `${width}mm` : '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {widths.map(w => <Opt key={w} active={width === w} onClick={() => setWidth(w)}>{w}mm</Opt>)}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Two Color Configurator ────────────────────────────────────────────────────
const TwoColorConfigurator = ({
  variants,
  onVariantMatch,
}: {
  variants: Variant[];
  onVariantMatch: (v: Variant | null) => void;
}) => {
  const baseMetals = useMemo(() => unique(variants.map(v => parseTwoColorSku(v.sku).baseMetal).filter(Boolean)).sort(), [variants]);
  const [baseMetal,   setBaseMetal]   = useState(baseMetals[0] ?? '');
  const [sleeveMetal, setSleeveMetal] = useState('');
  const [width,       setWidth]       = useState('');
  const [weight,      setWeight]      = useState('');

  const sleeveMetals = useMemo(() =>
    unique(variants.filter(v => parseTwoColorSku(v.sku).baseMetal === baseMetal).map(v => parseTwoColorSku(v.sku).sleeveMetal).filter(Boolean)).sort(),
    [variants, baseMetal]);

  const widths = useMemo(() =>
    unique(variants.filter(v => { const p = parseTwoColorSku(v.sku); return p.baseMetal === baseMetal && p.sleeveMetal === sleeveMetal; }).map(v => parseTwoColorSku(v.sku).width).filter(Boolean))
      .sort((a, b) => parseFloat(a) - parseFloat(b)),
    [variants, baseMetal, sleeveMetal]);

  const weights = useMemo(() =>
    unique(variants.filter(v => { const p = parseTwoColorSku(v.sku); return p.baseMetal === baseMetal && p.sleeveMetal === sleeveMetal && p.width === width; }).map(v => parseTwoColorSku(v.sku).weight).filter(Boolean)).sort(),
    [variants, baseMetal, sleeveMetal, width]);

  useEffect(() => { if (sleeveMetals.length && !sleeveMetals.includes(sleeveMetal)) setSleeveMetal(sleeveMetals[0]); }, [sleeveMetals]);
  useEffect(() => { if (widths.length && !widths.includes(width)) setWidth(widths[0]); }, [widths]);
  useEffect(() => { if (weights.length && !weights.includes(weight)) setWeight(weights[0]); }, [weights]);

  useEffect(() => {
    const matched = variants.find(v => {
      const p = parseTwoColorSku(v.sku);
      return p.baseMetal === baseMetal && p.sleeveMetal === sleeveMetal && (!width || p.width === width) && (!weight || p.weight === weight);
    }) ?? null;
    onVariantMatch(matched);
  }, [baseMetal, sleeveMetal, width, weight, variants]);

  return (
    <div className="space-y-6">
      {baseMetals.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Base Metal — <span className="font-normal">{baseMetal}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {baseMetals.map(m => <Opt key={m} active={baseMetal === m} onClick={() => setBaseMetal(m)}>{m}</Opt>)}
          </div>
        </div>
      )}

      {sleeveMetals.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Sleeve Metal — <span className="font-normal">{sleeveMetal}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sleeveMetals.map(m => <Opt key={m} active={sleeveMetal === m} onClick={() => setSleeveMetal(m)}>{m}</Opt>)}
          </div>
          <p className="mt-2 text-[10px] font-inter font-light text-gray-400 leading-snug">
            The sleeve is the contrasting inner band visible at the edges
          </p>
        </div>
      )}

      {widths.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Width — <span className="font-normal">{width ? `${width}mm` : '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {widths.map(w => <Opt key={w} active={width === w} onClick={() => setWidth(w)}>{w}mm</Opt>)}
          </div>
        </div>
      )}

      {weights.length > 0 && (
        <div>
          <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
            Weight — <span className="font-normal">{weight || '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {weights.map(w => <Opt key={w} active={weight === w} onClick={() => setWeight(w)}>{w}</Opt>)}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN PAGE ────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const WeddingRingDetail = (): JSX.Element => {
  const { productId } = useParams<{ productId: string }>();
  const { addToCart } = useCart();

  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [matchedVariant, setMatchedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState('L');
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch product
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/products/${productId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setProductData(data.data.product);
        else setError(data.message || 'Failed to load product');
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [productId]);

  const variants = productData?.variants ?? [];
  const ringType = useMemo(() => detectRingType(variants), [variants]);
  const displayImages = productData?.images ?? [];
  const currentImage = displayImages[currentImageIndex];

  const displayPrice = matchedVariant?.price
    ? fmt(matchedVariant.price)
    : productData?.price ?? '';

  const handleAddToCart = () => {
    if (!productData) return;
    setAddingToCart(true);
    setTimeout(() => {
      addToCart({
        id: productData.id,
        name: productData.name,
        price: displayPrice,
        size: selectedSize,
        image: currentImage?.url ? getMediaUrl(currentImage.url) : '',
        type: 'jewelry',
        selectedOptions: {
          ...(matchedVariant ? buildSelectedOptions(ringType, matchedVariant) : {}),
          size: `UK ${selectedSize}`,
        },
      });
      setAddingToCart(false);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-500 font-cormorant text-lg">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-cormorant text-xl mb-4">{error || 'Product not found'}</p>
          <Link to="/wedding-rings" className="text-sm uppercase tracking-widest underline font-inter">
            Back to Wedding Rings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LuxuryNavigationWhite />

      {/* Breadcrumb */}
      <nav className="w-full px-4 lg:px-10 pt-36 lg:pt-48 pb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-inter font-light">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>›</span>
          <Link to="/wedding-rings" className="hover:text-gray-900">Wedding Rings</Link>
          <span>›</span>
          <span className="text-gray-900">{productData.name}</span>
        </div>
      </nav>

      <div className="w-full px-4 lg:px-10 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

            {/* ── Images ── */}
            <div className="flex flex-col gap-4">
              <div className="relative bg-white overflow-hidden" style={{ aspectRatio: '1' }}>
                {currentImage ? (
                  <img
                    src={getMediaUrl(currentImage.url)}
                    alt={currentImage.alt || productData.name}
                    className="w-full h-full object-contain"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <span className="text-gray-400 font-cormorant">No image available</span>
                  </div>
                )}
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => (i - 1 + displayImages.length) % displayImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors z-10"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => (i + 1) % displayImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors z-10"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                  </>
                )}
                <div className="absolute top-3 right-3 z-20">
                  <FavoriteButton productId={productData.id} productName={productData.name} imageUrl={displayImages[0]?.url} productUrl={`/${productData.category?.slug}/${productData.slug}`} size="sm" />
                </div>
              </div>

              {displayImages.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {displayImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-16 h-16 overflow-hidden flex-shrink-0 transition-all ${
                        idx === currentImageIndex
                          ? 'ring-2 ring-gray-900 ring-offset-1'
                          : 'ring-1 ring-gray-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={getMediaUrl(img.url)} alt={img.alt || `View ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: info + configurator ── */}
            <div className="flex flex-col">
              <h1 className="text-3xl lg:text-4xl font-cormorant font-light text-gray-900 leading-tight mb-2">
                {productData.name}
              </h1>
              <div className="text-xl lg:text-2xl font-cormorant font-light text-gray-800 mb-6 transition-all">
                {displayPrice}
              </div>

              {productData.description && (
                <div className="mb-8">
                  {renderDescription(productData.description)}
                </div>
              )}

              {/* Ring type badge */}
              {ringType !== 'unknown' && (
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 text-[10px] font-inter font-light uppercase tracking-[0.2em] border border-gray-200 text-gray-500">
                    {ringType === 'diamond-cut' ? 'Diamond Cut' : ringType === 'diamond-set' ? 'Diamond Set' : 'Two Colour'}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-100 mb-6" />

              {/* Configurator — type-specific */}
              {variants.length > 0 ? (
                <>
                  {ringType === 'diamond-cut' && (
                    <DiamondCutConfigurator variants={variants} onVariantMatch={setMatchedVariant} />
                  )}
                  {ringType === 'diamond-set' && (
                    <DiamondSetConfigurator variants={variants} onVariantMatch={setMatchedVariant} />
                  )}
                  {ringType === 'two-color' && (
                    <TwoColorConfigurator variants={variants} onVariantMatch={setMatchedVariant} />
                  )}
                </>
              ) : (
                <p className="text-sm font-inter font-light text-gray-400 mb-6">
                  Contact us for pricing and availability on this style.
                </p>
              )}

              {/* Ring Size */}
              {variants.length > 0 && (
                <div className="mt-6">
                  <p className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-900 mb-3">
                    Ring Size — <span className="font-normal">UK {selectedSize}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {UK_SIZES.map(s => (
                      <SizeBtn key={s} active={selectedSize === s} onClick={() => setSelectedSize(s)} label={s} />
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] font-inter font-light text-gray-400">
                    Not sure of your size?{' '}
                    <Link to="/ring-size-guide" className="underline hover:text-gray-700">
                      Ring size guide
                    </Link>
                  </p>
                </div>
              )}

              {/* Price + CTA */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-baseline justify-between mb-6">
                  <span className="text-[11px] font-inter font-light uppercase tracking-[0.18em] text-gray-500">Total</span>
                  <span className="text-2xl font-cormorant font-light text-gray-900">{displayPrice}</span>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full py-4 bg-gray-900 text-white text-xs font-inter font-light uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                  {addingToCart ? 'Adding…' : addedToCart ? '✓ Added to Bag' : 'Add to Bag'}
                </button>

                <button className="w-full mt-3 py-4 border border-gray-300 text-gray-700 text-xs font-inter font-light uppercase tracking-[0.2em] hover:border-gray-600 transition-colors">
                  Enquire
                </button>
              </div>

              {/* Accordion */}
              <div className="mt-8 space-y-0 border-t border-gray-200">
                <AccordionRow label="Product Details" content={productData.description || 'Crafted to the highest standard with exceptional attention to detail.'} />
                <AccordionRow label="Delivery & Returns" content="Complimentary UK delivery on all orders. International delivery available. Free returns within 30 days." />
                <AccordionRow label="Engraving" content="Personalise your ring with a complimentary engraving. Contact us to arrange." />
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

// ── Build cart selectedOptions from matched variant ───────────────────────────
function buildSelectedOptions(ringType: RingType, v: Variant): Record<string, string> {
  if (ringType === 'diamond-cut') {
    const p = parseDiamondCutSku(v.sku);
    return { metal: p.metal, width: `${p.width}mm`, profile: p.profile, finish: p.finish };
  }
  if (ringType === 'diamond-set') {
    const p = parseDiamondSetSku(v.sku);
    return { metal: p.metal, quality: p.quality, spread: p.spread, width: `${p.width}mm` };
  }
  if (ringType === 'two-color') {
    const p = parseTwoColorSku(v.sku);
    return { baseMetal: p.baseMetal, sleeveMetal: p.sleeveMetal, width: `${p.width}mm`, weight: p.weight };
  }
  return {};
}

export default WeddingRingDetail;
