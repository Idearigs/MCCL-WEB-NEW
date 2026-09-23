import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NavigationV2 from '../components/home-v2/NavigationV2';
import FooterV2 from '../components/home-v2/FooterV2';
import { T, FONT_DISPLAY, FONT_BODY } from '../components/home-v2/tokens';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL, { getMediaUrl } from '../config/api';
import DiamondHelpNudge from '../components/DiamondHelpNudge';
import { useIsMobile } from '../hooks/use-mobile';

/**
 * Wedding ring PDP — collection-aware. One "collection" (e.g. Papplewick) is made of many
 * per-(width·weight·gender) designs in the Allied Gold catalogue (/wedding/designs). The
 * customer chooses style → width → weight → metal → size here in one simple guided flow;
 * switching a collection-level option loads the matching design. Kept intentionally minimal:
 * short labels, no walls of text.
 */

const NAV_H = 96;
const money = (n: number | null | undefined) => (n == null ? '' : '£' + Math.round(n).toLocaleString('en-GB'));
const RING_SIZES = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'];
const WEIGHT_ORDER = ['Light', 'Medium', 'Heavy', 'Ultra Heavy'];
const cleanDesc = (s?: string) => (s || '').replace(/,?\s*in \{metal\}/gi, '').replace(/\{[^}]+\}/g, '').replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
const genderOf = (m: any) => (/gents/i.test(m?.family || m?.name || '') ? 'Gents' : 'Ladies');

// colourway → swatch for the metal dots
const WAY_SWATCH: Record<string, string> = { Y: 'linear-gradient(135deg,#F4DFA6,#E3B85E)', R: 'linear-gradient(135deg,#F1D2C4,#DCA98E)', W: 'linear-gradient(135deg,#F1F0F2,#DCDBDE)' };

// Drag / swipe to rotate a 360° spin (Allied blob frame sequence, {index} → 1..frames).
const Spin360 = ({ spin, way }: { spin: any; way: string }): JSX.Element | null => {
  const total: number = spin?.frames || 144;
  const start: number = spin?.start || 1;
  const tmpl: string = spin?.[way] || spin?.W || spin?.Y || spin?.R || '';
  // Subsample to ~48 frames — smooth enough for a spin at a third of the load, so the
  // page never freezes decoding 144 full-size JPGs at once.
  const frameList = React.useMemo(() => {
    const step = Math.max(1, Math.round(total / 48));
    const list: number[] = [];
    for (let i = 0; i < total; i += step) list.push(start + i);
    return list;
  }, [total, start]);
  const N = frameList.length;
  const [pos, setPos] = useState(0);
  const [ready, setReady] = useState(false);
  const drag = React.useRef<{ x: number; p: number } | null>(null);

  // Preload the small frame set in staggered batches (smooth drag, no main-thread freeze).
  useEffect(() => {
    if (!tmpl) return;
    let alive = true; let loaded = 0; setReady(false);
    let idx = 0;
    const loadBatch = () => {
      if (!alive) return;
      const end = Math.min(idx + 6, N);
      for (; idx < end; idx++) {
        const im = new Image();
        im.onload = im.onerror = () => { loaded++; if (alive && loaded >= Math.min(12, N)) setReady(true); };
        im.src = tmpl.replace('{index}', String(frameList[idx]));
      }
      if (idx < N) setTimeout(loadBatch, 80);
    };
    loadBatch();
    return () => { alive = false; };
  }, [tmpl, frameList, N]);

  if (!tmpl) return null;
  const url = tmpl.replace('{index}', String(frameList[pos] ?? frameList[0]));
  const px = (e: any) => (e.touches?.[0]?.clientX ?? e.clientX ?? 0);
  const down = (e: any) => { drag.current = { x: px(e), p: pos }; };
  const move = (e: any) => {
    if (!drag.current) return;
    const dx = px(e) - drag.current.x;
    let np = Math.round(drag.current.p - dx / 12);
    np = ((np % N) + N) % N; // wrap
    setPos(np);
  };
  const up = () => { drag.current = null; };
  return (
    <div
      onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}
      onTouchStart={down} onTouchMove={move} onTouchEnd={up}
      style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'pan-y', userSelect: 'none' }}
    >
      <img src={url} alt="360° view" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
      {!ready && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8377', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', pointerEvents: 'none' }}>Loading 360°…</div>}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 20, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#56534D', pointerEvents: 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 12a9 4.5 0 0 0 18 0M3 12a9 4.5 0 0 1 18 0" /><path d="M8 5l-2 2 2 2" /></svg>
        Drag to spin
      </div>
    </div>
  );
};

// Small ring thumbnail with a graceful fallback when a design has no photo (or it 404s).
const RingThumb = ({ src }: { src: string }): JSX.Element => {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <span style={{ width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2EFEA' }}>
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="#C7BFB1" strokeWidth="3" aria-hidden="true"><circle cx="20" cy="21" r="12.5" /></svg>
    </span>
  );
  return <img src={src} alt="" loading="lazy" onError={() => setErr(true)} style={{ width: 54, height: 54, objectFit: 'cover' }} />;
};

const WeddingRingDetail = (): JSX.Element => {
  const { productId } = useParams<{ productId: string }>();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();

  const [design, setDesign] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [labels, setLabels] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metal, setMetal] = useState('');
  const [size, setSize] = useState('L');
  const [imgWay, setImgWay] = useState('W');
  const [added, setAdded] = useState(false);
  // Gallery is always the interactive 360 spin (with a static-photo fallback when a design
  // has no spin frames); the colourway thumbnails only switch metal — no photo/360 toggle.
  const [navH, setNavH] = useState(NAV_H); // real fixed-nav height, so the sticky image tucks flush

  useEffect(() => {
    const measure = () => { const el = document.querySelector('.v2nav'); if (el) setNavH(Math.round(el.getBoundingClientRect().height)); };
    measure();
    const t = setTimeout(measure, 400); // after the trust-bar/animation settle
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, []);

  // Current design detail
  useEffect(() => {
    if (!productId) return;
    setLoading(true); setError(null);
    fetch(`${API_BASE_URL}/wedding/designs/${encodeURIComponent(productId)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setDesign(d.design); else setError(d.message || 'Ring not found'); })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [productId]);

  // All designs in this collection (for the style/width/weight/gender selectors)
  useEffect(() => {
    const col = design?.collection; if (!col) return;
    fetch(`${API_BASE_URL}/wedding/designs`)
      .then(r => r.json())
      .then(d => { if (d.success) { setLabels(d.labels || {}); setMembers((d.designs || []).filter((x: any) => x.collection === col)); } })
      .catch(() => {});
  }, [design?.collection]);

  // Keep the chosen metal across width/weight switches; only fall back to a default
  // (prefer 18ct white) when the current metal isn't offered on the new design. No scroll
  // reset here — switching an option updates in place, it must not jump the page.
  useEffect(() => {
    if (!design) return;
    const rows = design.variationRows || [];
    setMetal(prev => {
      const keep = rows.find((r: any) => r.metal === prev);
      const pick = keep || rows.find((r: any) => r.metal === '18W') || rows.find((r: any) => r.colourway === 'W') || rows[0];
      if (pick?.colourway) setImgWay(pick.colourway);
      return pick?.metal || '';
    });
  }, [design?.id]);

  const wlabel = (code: string) => labels.weight?.[code] || code;
  const plabel = (code: string) => labels.profile?.[code] || code;
  const facet = (m: any, dim: string) => m?.facets?.[dim]?.[0];

  const me = useMemo(() => members.find(m => m.id === design?.id), [members, design?.id]);
  const curGender = design ? (/gents/i.test(design.family || '') ? 'Gents' : 'Ladies') : 'Ladies';
  const curProfile = facet(me, 'profile');
  const curWidth = design ? String(design.widthMm) : facet(me, 'width');
  const curWeight = facet(me, 'weight');

  const genders = useMemo(() => [...new Set(members.map(genderOf))], [members]);
  const profiles = useMemo(() => [...new Set(members.filter(m => genderOf(m) === curGender).map(m => facet(m, 'profile')).filter(Boolean))], [members, curGender]);
  const widths = useMemo(() => [...new Set(members.filter(m => genderOf(m) === curGender && (!curProfile || facet(m, 'profile') === curProfile)).map(m => facet(m, 'width')).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b)), [members, curGender, curProfile]);
  const weights = useMemo(() => [...new Set(members.filter(m => genderOf(m) === curGender && (!curProfile || facet(m, 'profile') === curProfile) && facet(m, 'width') === curWidth).map(m => facet(m, 'weight')).filter(Boolean))].sort((a, b) => WEIGHT_ORDER.indexOf(wlabel(a)) - WEIGHT_ORDER.indexOf(wlabel(b))), [members, curGender, curProfile, curWidth, labels]);

  const find = (g: string, p: string, w: string, wt: string) => members.find(m => genderOf(m) === g && facet(m, 'profile') === p && facet(m, 'width') === w && facet(m, 'weight') === wt);
  // Switch design IN PLACE (no route change) so choosing an option never reloads the page;
  // the URL is updated silently so the link still reflects the current selection.
  const go = (m: any) => {
    if (!m || m.id === design?.id) return;
    fetch(`${API_BASE_URL}/wedding/designs/${encodeURIComponent(m.id)}`)
      .then(r => r.json())
      .then(d => { if (d.success) { setDesign(d.design); try { window.history.replaceState(null, '', `/wedding-rings/${encodeURIComponent(m.id)}`); } catch { /* ignore */ } } })
      .catch(() => {});
  };
  const pickGender = (g: string) => go(find(g, curProfile, curWidth, curWeight) || members.find(m => genderOf(m) === g));
  const pickProfile = (p: string) => go(find(curGender, p, curWidth, curWeight) || members.find(m => facet(m, 'profile') === p && genderOf(m) === curGender));
  const pickWidth = (w: string) => go(find(curGender, curProfile, w, curWeight) || members.find(m => facet(m, 'width') === w && genderOf(m) === curGender && facet(m, 'profile') === curProfile));
  const pickWeight = (wt: string) => go(find(curGender, curProfile, curWidth, wt));

  const rows = design?.variationRows || [];
  const curRow = rows.find((r: any) => r.metal === metal) || rows[0];
  const price = curRow?.price ?? design?.priceFrom ?? null;
  const hero = design?.hero || {};
  const heroImg = hero[imgWay] || hero.W || hero.Y || hero.R;
  // A design can carry a `spin` object whose per-colour templates are all null (no 360
  // shot for it). Only treat it as spinnable when at least one real frame template exists —
  // otherwise the gallery falls back to the default hero photo.
  const hasSpin = !!(design?.spin && (design.spin.W || design.spin.Y || design.spin.R));
  // Switch the shown colourway AND select a matching metal (so price updates too).
  const pickColourway = (w: string) => { setImgWay(w); const r = rows.find((x: any) => x.colourway === w); if (r) setMetal(r.metal); };

  const handleAdd = () => {
    if (!design || !curRow) return;
    addToCart({
      id: design.id, name: design.name, price: money(price), size: `UK ${size}`,
      image: heroImg ? getMediaUrl(heroImg) : '',
      type: 'jewelry',
      selectedOptions: { metal: curRow.metalName, width: `${curWidth}mm`, weight: wlabel(curWeight), profile: plabel(curProfile), size: `UK ${size}` },
    } as any);
    setAdded(true); setTimeout(() => setAdded(false), 2200);
  };

  // ---- shared styles ----
  const stepHead = (n: string, title: string, right?: React.ReactNode): JSX.Element => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 12px' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${T.ruleStrong}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12, color: T.muted, flex: 'none' }}>{n}</span>
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: T.ink, flex: 1 }}>{title}</span>
      {right}
    </div>
  );
  const pill = (on: boolean): React.CSSProperties => ({ padding: '10px 16px', minHeight: 42, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, border: `1px solid ${on ? T.ink : T.ruleSoft}`, background: on ? T.tint : '#FFFFFF', color: T.ink, display: 'inline-flex', alignItems: 'center', gap: 8 });
  const rowWrap: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 26 };
  const prevCard = (on: boolean): React.CSSProperties => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 12px 9px', cursor: 'pointer', background: on ? T.tint : '#FFFFFF', border: `1px solid ${on ? T.ink : T.ruleSoft}`, minWidth: 74 });
  const memberThumb = (m: any) => (m && m.hero) ? getMediaUrl(m.hero[imgWay] || m.hero.W || m.hero.Y || m.hero.R || '') : '';
  const hasStyle = genders.length > 1 || profiles.length > 1;
  const sn = (i: number) => String(hasStyle ? i : i - 1); // step numbering shifts when Style is hidden

  if (loading) return (<div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: FONT_DISPLAY, color: T.muted }}>Loading…</div></div>);
  if (error || !design) return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: T.ink }}>{error || 'Ring not found'}</div>
      <Link to="/wedding" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gold }}>Back to wedding rings</Link>
    </div>
  );

  return (
    <div className="wrd" style={{ background: '#FFFFFF', minHeight: '100vh', color: T.ink, ['--navh' as any]: navH + 'px' }}>
      <NavigationV2 solid />
      <style>{`
        .wrd a{color:inherit;text-decoration:none}
        /* Desktop layout (restored to the earlier version). Mobile is overridden below and
           must not change. */
        .wrd-main{ display:grid; grid-template-columns: minmax(0,1.18fr) minmax(0,1fr); gap: clamp(28px,4vw,56px); max-width:1360px; margin:0 auto; padding: calc(${NAV_H}px + 46px) clamp(20px,4vw,56px) 80px; align-items:start; }
        .wrd-gallery{ position:sticky; top:${NAV_H + 16}px; align-self:start; }
        .wrd-metalbtn:hover{ border-color:${T.ink} !important; }
        @media (max-width: 900px){
          /* Top padding uses the MEASURED nav height (not the hardcoded 96px) so there's no gap. */
          .wrd-main{ grid-template-columns:1fr !important; gap:16px; padding: var(--navh, 84px) 16px 40px !important; }
          /* Innovative mobile flow: the ring image PINS just under the nav while the customer
             scrolls the options below, so it stays in view (and draggable to spin) the whole
             time. True full-bleed (100vw) so the image fills the width. */
          .wrd-gallery{ position:sticky !important; top:var(--navh, 84px); z-index:5; background:#F7F5F0; width:100vw; margin-left:calc(50% - 50vw); padding:0 0 6px; box-shadow:0 10px 14px -12px rgba(20,18,15,0.22); }
          .wrd-stage{ aspect-ratio:auto !important; height:40vh !important; background:#F7F5F0; }
          .wrd-stage img{ object-fit:cover !important; transform:none !important; }
          /* Clearance for the fixed price bar sits BELOW the footer and matches its dark
             colour, so there is no white strip between the footer and the bar. */
          .wrd-footpad{ display:block !important; height: calc(84px + env(safe-area-inset-bottom, 0px)); }
          .wrd-pricebar{ position:fixed !important; left:0; right:0; bottom:0; margin:0 !important; z-index:55; border-left:0; border-right:0; padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important; }
        }
      `}</style>

      <div className="wrd-main">
        {/* Gallery — MOBILE keeps the single sticky/spin stage (unchanged); DESKTOP shows a
            multi-image mosaic (hero photo + several 360 angle frames) that fills the column. */}
        <div className="wrd-gallery">
          {isMobile ? (
            <div className="wrd-stage" style={{ position: 'relative', aspectRatio: '1 / 1', background: '#F7F5F0', overflow: 'hidden' }}>
              {hasSpin
                ? <Spin360 spin={design.spin} way={imgWay} />
                : (heroImg
                  ? <img src={getMediaUrl(heroImg)} alt={design.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontFamily: FONT_DISPLAY }}>{design.name}</div>)}
              {/* Tell the shopper whether this design spins or is a photo only */}
              <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, padding: '6px 11px', background: 'rgba(255,255,255,0.9)', color: T.ink, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', pointerEvents: 'none' }}>{hasSpin ? '360°' : 'Photo only'}</span>
            </div>
          ) : (
            <>
              {/* Large main image — always the interactive 360 spin; metal label + colourway thumbnails below */}
              <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#F7F5F0', border: `1px solid ${T.rule}`, overflow: 'hidden' }}>
                {hasSpin
                  ? <Spin360 spin={design.spin} way={imgWay} />
                  : (heroImg
                    ? <img src={getMediaUrl(heroImg)} alt={design.name} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.15)' }} />
                    : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontFamily: FONT_DISPLAY }}>{design.name}</div>)}
                {curRow?.metalName && <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted }}>{curRow.metalName}</span>}
              </div>
              {(design.colourways || []).length > 1 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  {(design.colourways || []).map((w: string) => {
                    const t = design.hero?.[w] ? getMediaUrl(design.hero[w]) : '';
                    const on = imgWay === w;
                    return (
                      <button key={w} onClick={() => pickColourway(w)} aria-label={w} style={{ width: 92, aspectRatio: '1 / 1', border: `1px solid ${on ? T.ink : T.rule}`, background: '#F7F5F0', overflow: 'hidden', padding: 0, cursor: 'pointer' }}>
                        {t ? <img src={t} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ display: 'block', width: '100%', height: '100%', background: WAY_SWATCH[w] || '#eee' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Buy column */}
        <div>
          {/* Title is the COLLECTION (matches the listing card). Profile/width/weight/gender
              are configuration of this one product — switching Style must not read as jumping
              to a different, differently-named product. */}
          <div style={{ fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gold, marginBottom: 10 }}>Wedding ring</div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(30px,3.4vw,46px)', lineHeight: 1.05, margin: '0 0 10px' }}>{design.collection || design.name}</h1>
          <div style={{ padding: '2px 0 20px', marginBottom: 26, borderBottom: `1px solid ${T.rule}` }}>
            <div style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 400, fontSize: 25, fontVariantNumeric: 'tabular-nums', color: T.ink }}>{money(price)}<span style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.muted, marginLeft: 8 }}>incl. VAT</span></div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{[curRow?.metalName, `${curWidth}mm`, wlabel(curWeight), curGender].filter(Boolean).join('  ·  ')}</div>
          </div>

          {/* Style: gender + profile */}
          {(genders.length > 1 || profiles.length > 1) && (
            <div>
              {stepHead('1', 'Style')}
              {genders.length > 1 && (<><div style={{ ...rowWrap, marginBottom: 12 }}>{genders.map(g => <button key={g} className="wrd-metalbtn" onClick={() => pickGender(g)} style={pill(curGender === g)}>{g}</button>)}</div></>)}
              {profiles.length > 1 && (<div style={rowWrap}>{profiles.map(p => <button key={p} className="wrd-metalbtn" onClick={() => pickProfile(p)} style={pill(curProfile === p)}>{plabel(p)}</button>)}</div>)}
            </div>
          )}

          {/* Metal — first, so the colour change shows on the image without scrolling */}
          {rows.length > 0 && (<div>{stepHead(sn(2), 'Metal')}<div style={rowWrap}>{rows.map((r: any) => <button key={r.metal} className="wrd-metalbtn" onClick={() => { setMetal(r.metal); if (r.colourway) setImgWay(r.colourway); }} style={pill(metal === r.metal)}><span style={{ width: 15, height: 15, borderRadius: '50%', background: WAY_SWATCH[r.colourway] || '#ddd', border: '1px solid rgba(0,0,0,0.12)' }} />{r.metalName}</button>)}</div></div>)}

          {/* Width — with a preview of each band */}
          {widths.length > 0 && (<div>{stepHead(sn(3), 'Width')}<div style={rowWrap}>{widths.map(w => {
            const m = find(curGender, curProfile, w, curWeight) || members.find(x => facet(x, 'width') === w && genderOf(x) === curGender && facet(x, 'profile') === curProfile);
            const t = memberThumb(m);
            return <button key={w} className="wrd-metalbtn" onClick={() => pickWidth(w)} style={prevCard(curWidth === w)}><RingThumb src={t} /><span style={{ fontSize: 12.5 }}>{w}mm</span></button>;
          })}</div></div>)}

          {/* Weight — with a preview of each */}
          {weights.length > 0 && (<div>{stepHead(sn(4), 'Weight')}<div style={rowWrap}>{weights.map(wt => {
            const m = find(curGender, curProfile, curWidth, wt);
            const t = memberThumb(m);
            return <button key={wt} className="wrd-metalbtn" onClick={() => pickWeight(wt)} style={prevCard(curWeight === wt)}><RingThumb src={t} /><span style={{ fontSize: 12.5 }}>{wlabel(wt)}</span></button>;
          })}</div></div>)}

          {/* Size */}
          <div>
            {stepHead(sn(5), 'Ring size', <Link to="/customer-service" style={{ fontSize: 11, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Size guide</Link>)}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>{RING_SIZES.map(s => <button key={s} onClick={() => setSize(s)} style={{ ...pill(size === s), padding: '9px 0', width: 44, justifyContent: 'center' }}>{s}</button>)}</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 26 }}>Made to your finger size — complimentary resizing if it’s not quite right.</div>
          </div>

          {/* Details — styled spec block + promises (not a bare text dump) */}
          <div style={{ borderTop: `1px solid ${T.rule}`, marginTop: isMobile ? 40 : 28, paddingTop: isMobile ? 26 : 22 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>Details</div>
            {cleanDesc(design.shortDescription || design.description) && (
              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: T.body, margin: '0 0 18px' }}>{cleanDesc(design.shortDescription || design.description)}</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', columnGap: 24 }}>
              {([['Profile', plabel(curProfile)], ['Width', `${curWidth}mm`], ['Weight', `${wlabel(curWeight)}${curGender ? ` · ${curGender}` : ''}`], ['Metal', curRow?.metalName], ['Hallmark', curRow?.hallmark], ['Ring size', 'Made to your size']] as [string, string][])
                .filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, padding: '9px 0', borderBottom: `1px solid ${T.ruleSoft}` }}>
                    <span style={{ color: T.muted }}>{k}</span><span style={{ color: T.ink, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
              {['Free insured UK delivery', '1-year warranty', 'Complimentary resizing'].map(x => (
                <span key={x} style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, border: `1px solid ${T.ruleSoft}`, padding: '7px 11px' }}>{x}</span>
              ))}
            </div>
          </div>

          {/* Sticky price bar (fixed full-width on mobile) — mirrors the engagement PDP */}
          <div className="wrd-pricebar" style={{ position: 'sticky', bottom: 0, zIndex: 30, marginTop: 30, background: T.tint, border: `1px solid ${T.rule}`, boxShadow: '0 -6px 20px rgba(20,18,15,0.06)', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[curRow?.metalName, `${curWidth}mm`, wlabel(curWeight), `Size ${size}`].filter(Boolean).join('  ·  ')}</div>
              <div style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 400, fontSize: 22, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{money(price)}</div>
            </div>
            <button onClick={handleAdd} style={{ flex: 'none', padding: '14px 26px', background: T.ink, color: T.paper, border: 0, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'background .2s' }}>{added ? 'Added ✓' : 'Add to bag'}</button>
          </div>
        </div>
      </div>
      <DiamondHelpNudge productName={design.name} title="Got lost customising your ring?" subtitle="Width, weight, metal — we’ll help you choose the perfect band." />
      <FooterV2 />
      {/* Mobile-only dark clearance behind the fixed price bar (no white strip) */}
      <div className="wrd-footpad" style={{ display: 'none', background: T.ink }} />
    </div>
  );
};

export default WeddingRingDetail;
