import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NavigationV2 from '../components/home-v2/NavigationV2';
import FooterV2 from '../components/home-v2/FooterV2';
import { T, FONT_DISPLAY, FONT_BODY } from '../components/home-v2/tokens';
import { GROUND, TILE } from '../components/home-v2/listingShared';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import API_BASE_URL, { getMediaUrl } from '../config/api';
import DiamondHelpNudge from '../components/DiamondHelpNudge';

/**
 * Wedding ring product page, "the measure".
 *
 * One collection (e.g. Papplewick) is made of many designs in the Allied Gold catalogue
 * (/wedding/designs), one per width, weight and gender. The ring sits in a wide stage across
 * the top and turns when dragged; underneath, the decisions run side by side in one row like a
 * jeweller's order card. Width is drawn to scale. Choosing an option loads the matching design
 * in place.
 *
 * Three kinds of design come through this page:
 *  - classic bands: gender, profile, width, weight, metal
 *  - diamond-set and shaped bands: setting, width, how far the diamonds run, metal
 *  - patterned bands with no price in the catalogue: shown with an enquiry instead of a bag button
 */

const money = (n: number | null | undefined) => (n == null ? '' : '£' + Math.round(n).toLocaleString('en-GB'));
const RING_SIZES = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'];
const WEIGHT_ORDER = ['Light', 'Medium', 'Heavy', 'Ultra Heavy'];
const genderOf = (m: any) => (/gents/i.test(m?.family || m?.name || '') ? 'Gents' : 'Ladies');

// Catalogue metal codes, written out in full.
const WAY_WORD: Record<string, string> = { W: 'white', Y: 'yellow', R: 'rose' };
const PLAIN_METAL: Record<string, string> = { PT: 'Platinum', PD: 'Palladium 950', PD5: 'Palladium 500', ARG960: 'Argentium silver' };
const goldParts = (code: string) => /^(\d+)([WYR])$/.exec(code || '');
const metalFull = (code: string, fallback?: string) => {
  const g = goldParts(code);
  return g ? `${g[1]}ct ${WAY_WORD[g[2]]} gold` : PLAIN_METAL[code] || fallback || code;
};
const purityKey = (code: string) => { const g = goldParts(code); return g ? g[1] : code; };
const purityLabel = (code: string) => { const g = goldParts(code); return g ? `${g[1]}ct` : PLAIN_METAL[code] || code; };
const PURITY_ORDER = ['9', '14', '18', 'PT', 'PD', 'PD5', 'ARG960'];
// The metals a customer chooses between. Carat belongs to gold only; palladium has its own two purities.
const famOf = (code: string) => { const g = goldParts(code); return g ? `${g[2]}G` : code === 'PD5' ? 'PD' : code; };
const FAMILY: Record<string, { name: string; sw: string }> = {
  WG: { name: 'White gold', sw: 'linear-gradient(135deg, #FBFBFC 0%, #D5D6DA 52%, #F1F1F3 100%)' },
  YG: { name: 'Yellow gold', sw: 'linear-gradient(135deg, #F8E7B4 0%, #D9AE55 52%, #F3DC9C 100%)' },
  RG: { name: 'Rose gold', sw: 'linear-gradient(135deg, #F6DCCF 0%, #D69F85 52%, #EFCDBD 100%)' },
  PT: { name: 'Platinum', sw: 'linear-gradient(135deg, #F4F5F7 0%, #B9BDC4 52%, #E4E6EA 100%)' },
  PD: { name: 'Palladium', sw: 'linear-gradient(135deg, #EEEEEF 0%, #A9ABB0 52%, #D9DADD 100%)' },
  ARG960: { name: 'Silver', sw: 'linear-gradient(135deg, #FFFFFF 0%, #DCDDE0 52%, #F7F7F8 100%)' },
};
const FAMILY_ORDER = ['WG', 'YG', 'RG', 'PT', 'PD', 'ARG960'];
const gradeLabel = (code: string) => { const g = goldParts(code); return g ? `${g[1]}ct` : code === 'PD' ? '950' : code === 'PD5' ? '500' : ''; };
const WAY_ORDER = ['W', 'Y', 'R'];
// Polished metal, as on the engagement ring page.
const SW: Record<string, string> = {
  W: 'linear-gradient(135deg, #FBFBFC 0%, #D5D6DA 52%, #F1F1F3 100%)',
  Y: 'linear-gradient(135deg, #F8E7B4 0%, #D9AE55 52%, #F3DC9C 100%)',
  R: 'linear-gradient(135deg, #F6DCCF 0%, #D69F85 52%, #EFCDBD 100%)',
};
const BAR: Record<string, string> = {
  W: 'linear-gradient(90deg, #E9E9EC, #C9CACF 45%, #F4F4F6 70%, #D4D5DA)',
  Y: 'linear-gradient(90deg, #F1DCA0, #D2A54C 45%, #F8E9BC 70%, #DDB868)',
  R: 'linear-gradient(90deg, #F0D2C3, #CF977C 45%, #F7E0D4 70%, #DCAD95)',
};

// Diamond-set designs carry their width, coverage and carat in the id: RBC-200-030-009.
const setParts = (id: string) => { const m = /^[A-Z]+-(\d{3})-(\d{3})-(\d{3})$/.exec(id || ''); return m ? { w: Number(m[1]) / 100, cov: Number(m[2]), ct: Number(m[3]) / 100 } : null; };
const diamondLine = (row: any) => {
  if (!row?.quality) return '';
  const [colour, clarity] = String(row.quality).split('-');
  const origin = row.origin === 'LabGrown' ? 'Lab-grown' : row.origin === 'Natural' ? 'Natural' : '';
  return [origin ? `${origin} diamonds` : 'Diamonds', colour ? `${colour} colour` : '', clarity ? `${clarity} clarity` : ''].filter(Boolean).join(', ');
};
// The catalogue's wording, with its placeholders filled and long dashes taken out of the sentences.
const fillText = (s: string | undefined, metalName: string, hallmark?: string) => (s || '')
  .replace(/\{metalNote\}/g, '').replace(/\{metal\}/g, metalName || 'your chosen metal').replace(/\{hallmark\}/g, hallmark || '')
  .replace(/\{[^}]+\}/g, '').replace(/\s+—\s+/g, ', ').replace(/[ \t]+/g, ' ').replace(/ \./g, '.');

// Drag or swipe to turn the ring (Allied frame sequence, {index} runs 1..frames).
const Spin360 = ({ spin, way }: { spin: any; way: string }): JSX.Element | null => {
  const total: number = spin?.frames || 144;
  const start: number = spin?.start || 1;
  const tmpl: string = spin?.[way] || spin?.W || spin?.Y || spin?.R || '';
  // About 48 frames: smooth enough for a turn at a third of the load.
  const frameList = React.useMemo(() => {
    const step = Math.max(1, Math.round(total / 48));
    const list: number[] = [];
    for (let i = 0; i < total; i += step) list.push(start + i);
    return list;
  }, [total, start]);
  const N = frameList.length;
  const [pos, setPos] = useState(0);
  const [ready, setReady] = useState(false);
  // The other frames wait until the first one is on screen, so the ring itself appears first.
  const [firstShown, setFirstShown] = useState(false);
  const drag = React.useRef<{ x: number; p: number } | null>(null);

  useEffect(() => {
    if (!tmpl || !firstShown) return;
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
  }, [tmpl, frameList, N, firstShown]);

  if (!tmpl) return null;
  const url = tmpl.replace('{index}', String(frameList[pos] ?? frameList[0]));
  const px = (e: any) => (e.touches?.[0]?.clientX ?? e.clientX ?? 0);
  const down = (e: any) => { drag.current = { x: px(e), p: pos }; };
  const move = (e: any) => {
    if (!drag.current) return;
    const dx = px(e) - drag.current.x;
    let np = Math.round(drag.current.p - dx / 12);
    np = ((np % N) + N) % N;
    setPos(np);
  };
  const up = () => { drag.current = null; };
  return (
    <div className="wr-spin" onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up} onTouchStart={down} onTouchMove={move} onTouchEnd={up}>
      <img src={url} alt="The ring, turned by dragging" draggable={false} fetchPriority="high" onLoad={() => setFirstShown(true)} onError={() => setFirstShown(true)} />
      {!ready && <div className="wr-spinload">Loading</div>}
    </div>
  );
};

const pageX = 'clamp(20px, 4vw, 64px)';
const CSS = `
  .wr { background: ${GROUND}; color: ${T.text}; font-family: ${FONT_BODY}; min-height: 100vh; padding-top: var(--v2nav-h, 113px); }
  .wr a { color: inherit; text-decoration: none; }
  .wr button { font-family: ${FONT_BODY}; color: inherit; }
  .wr button:focus-visible, .wr a:focus-visible, .wr select:focus-visible { outline: 1px solid ${T.gold}; outline-offset: 4px; }

  /* the stage: the ring alone, across the page. It stays pinned under the navigation while the
     choices scroll beneath it, so every change is seen on the ring; it lets go before the About section. */
  .wr-stage { position: sticky; top: var(--v2nav-h, 113px); z-index: 5; height: clamp(260px, 44vh, 470px); background: ${TILE}; border-bottom: 1px solid ${T.line}; overflow: hidden; }
  .wr-crumb { position: absolute; z-index: 2; left: ${pageX}; top: clamp(18px, 2.2vw, 30px); display: flex; flex-wrap: wrap; gap: 6px 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }
  .wr-crumb a:hover { color: ${T.text}; }
  .wr-spin { position: absolute; inset: 0; cursor: grab; touch-action: pan-y; user-select: none; }
  .wr-spin:active { cursor: grabbing; }
  .wr-spin img, .wr-still { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; pointer-events: none; }
  .wr-still { padding: 18px 20px 44px; }
  .wr-spinload, .wr-turn { position: absolute; left: 0; right: 0; bottom: 20px; text-align: center; font-size: 10.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.textMuted}; pointer-events: none; }
  .wr-spinload { bottom: 50%; }

  /* name and price */
  .wr-head { max-width: 900px; margin: 0 auto; padding: clamp(28px, 3.4vw, 46px) ${pageX} 0; text-align: center; }
  .wr-eyebrow { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .wr-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(34px, 4vw, 56px); line-height: 1.08; margin: 12px 0 0; color: ${T.text}; text-wrap: balance; }
  .wr-price { margin-top: 12px; font-size: 20px; letter-spacing: 0.04em; line-height: 1.2; font-variant-numeric: tabular-nums lining-nums; }
  .wr-sub { margin: 10px auto 0; max-width: 46ch; font-size: 14px; line-height: 1.6; color: ${T.textMuted}; }

  /* the order card: every decision side by side */
  .wr-card { display: flex; flex-wrap: wrap; justify-content: center; gap: clamp(30px, 3.4vw, 52px) clamp(32px, 4vw, 68px); max-width: 1320px; margin: 0 auto; padding: clamp(34px, 4vw, 56px) ${pageX} 0; }
  .wr-group { min-width: 0; }
  .wr-lab { font-size: 10.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.textMuted}; }
  .wr-lab b { font-weight: 400; color: ${T.text}; }
  .wr-words { display: flex; flex-wrap: wrap; gap: 4px 22px; margin-top: 10px; }
  .wr-word { position: relative; padding: 8px 0; background: transparent; border: 0; cursor: pointer; font-size: 14.5px; line-height: 1.3; color: ${T.textMuted}; transition: color 0.25s ease; }
  .wr-word::after { content: ""; position: absolute; left: 0; right: 0; bottom: 3px; height: 1px; background: ${T.gold}; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
  .wr-word:hover, .wr-word[aria-checked="true"] { color: ${T.text}; }
  .wr-word[aria-checked="true"]::after { transform: scaleX(1); }
  /* metals: one captioned disc each; carat appears beneath only for a gold */
  .wr-metals { display: flex; flex-wrap: wrap; gap: 14px clamp(10px, 1.2vw, 18px); margin-top: 16px; }
  .wr-metal { display: grid; justify-items: center; align-content: start; gap: 11px; width: 62px; padding: 5px 0 0; background: transparent; border: 0; cursor: pointer; font-size: 12px; line-height: 1.3; text-align: center; color: ${T.textMuted}; transition: color 0.25s ease; }
  .wr-metal i { position: relative; display: block; width: 34px; height: 34px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(28,26,23,0.12); }
  .wr-metal i::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; border: 1px solid transparent; transition: border-color 0.25s ease; }
  .wr-metal:hover { color: ${T.text}; }
  .wr-metal:hover i::after { border-color: ${T.ruleStrong}; }
  .wr-metal[aria-checked="true"] { color: ${T.text}; }
  .wr-metal[aria-checked="true"] i::after { border-color: ${T.gold}; }
  .wr-grade { display: flex; align-items: center; gap: 18px; margin-top: 14px; }
  .wr-grade > span { font-size: 10.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.textMuted}; }
  .wr-grade .wr-words { margin-top: 0; }
  /* width, drawn to scale: four pixels to the millimetre */
  .wr-scale { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 10px clamp(6px, 0.9vw, 12px); margin-top: 16px; }
  .wr-bar { display: grid; justify-items: center; gap: 8px; min-width: 30px; padding: 5px 4px 2px; background: transparent; border: 0; cursor: pointer; font-size: 12.5px; color: ${T.textMuted}; font-variant-numeric: tabular-nums; }
  .wr-bar i { display: block; height: 44px; border-radius: 2px; box-shadow: 0 0 0 4px transparent, 0 0 0 5px transparent; transition: box-shadow 0.25s ease; }
  .wr-bar:hover { color: ${T.text}; }
  .wr-bar[aria-checked="true"] { color: ${T.text}; }
  .wr-bar[aria-checked="true"] i { box-shadow: 0 0 0 4px ${GROUND}, 0 0 0 5px ${T.gold}; }
  .wr-size { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
  .wr-select { appearance: none; -webkit-appearance: none; min-width: 132px; padding: 10px 28px 10px 0; border: 0; border-bottom: 1px solid ${T.ruleStrong}; border-radius: 0; background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23332F2A' stroke-width='1'/%3E%3C/svg%3E") no-repeat right 4px center; font-family: ${FONT_BODY}; font-size: 14.5px; color: ${T.text}; cursor: pointer; }
  .wr-link { position: relative; padding: 6px 0; background: transparent; border: 0; cursor: pointer; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.text}; }
  .wr-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: ${T.ruleStrong}; transition: background 0.25s ease; }
  .wr-link:hover::after { background: ${T.gold}; }
  .wr-tabs, .wr-sizes, .wr-hint { display: none; }
  .wr-fact { margin-top: 12px; max-width: 30ch; font-size: 14.5px; line-height: 1.6; color: ${T.text}; }

  /* the one button */
  .wr-buy { max-width: 620px; margin: 0 auto; padding: clamp(36px, 4.2vw, 56px) ${pageX} clamp(56px, 6vw, 92px); text-align: center; }
  .wr-btn { display: block; width: 100%; max-width: 380px; margin: 0 auto; padding: 21px 24px; border: 0; cursor: pointer; background: ${T.ink}; color: ${T.cream} !important; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
  .wr-btn:hover { background: #2E2A25; }
  .wr-note { margin: 18px auto 0; max-width: 44ch; font-size: 13.5px; line-height: 1.65; color: ${T.textMuted}; }
  .wr-quiet { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px 30px; margin-top: 16px; }

  /* about: a catalogue entry */
  .wr-about { border-top: 1px solid ${T.line}; padding: clamp(56px, 6.4vw, 100px) ${pageX}; text-align: center; }
  .wr-lead { max-width: 30em; margin: 22px auto 0; font-family: ${FONT_DISPLAY}; font-size: clamp(20px, 2vw, 26px); line-height: 1.5; color: ${T.text}; text-wrap: balance; }
  .wr-rest { display: none; max-width: 62ch; margin: 26px auto 0; text-align: left; }
  .wr-rest.is-open { display: block; }
  .wr-rest p { margin: 0 0 16px; font-size: 15px; line-height: 1.8; color: ${T.text}; }
  .wr-about .wr-link { margin-top: 24px; }
  .wr-specs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(30px, 3.4vw, 48px) 24px; max-width: 1080px; margin: clamp(44px, 5vw, 72px) auto 0; }
  .wr-specs dt { font-size: 10.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.textMuted}; }
  .wr-specs dd { margin: 9px 0 0; font-family: ${FONT_DISPLAY}; font-size: 18px; line-height: 1.3; color: ${T.text}; overflow-wrap: anywhere; }

  /* the one sand band */
  .wr-band { background: ${T.sand}; padding: clamp(52px, 6vw, 88px) ${pageX}; text-align: center; }
  .wr-band h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(28px, 3.2vw, 44px); line-height: 1.12; margin: 14px 0 0; color: ${T.text}; text-wrap: balance; }
  .wr-promise { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px 24px; max-width: 1080px; margin: clamp(34px, 4vw, 52px) auto 0; }
  .wr-promise div { padding-top: 18px; border-top: 1px solid ${T.gold}; font-family: ${FONT_DISPLAY}; font-size: 18px; line-height: 1.3; color: ${T.text}; }

  .wr-bar-fixed { display: none; }
  .wr-state { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; padding: 40px ${pageX}; text-align: center; }
  .wr-state h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(28px, 3.4vw, 44px); margin: 0; }

  @media (max-width: 860px) {
    .wr { padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)); }
    .wr-stage { height: clamp(200px, 34vh, 330px); }
    .wr-crumb { top: 12px; font-size: 9.5px; }
    .wr-turn, .wr-spinload { bottom: 10px; font-size: 9.5px; }
    .wr-still { padding: 26px 20px 28px; }
    .wr-head { padding-top: 24px; }
    /* one decision at a time: a strip of names, and only the open one beneath it */
    .wr-head { padding-top: 18px; }
    .wr-eyebrow { font-size: 10.5px; }
    .wr-h1 { font-size: 30px; margin-top: 8px; }
    .wr-head .wr-price { display: none; }
    .wr-tabs { display: flex; justify-content: space-between; gap: 24px; margin-top: 18px; padding: 0 ${pageX}; border-bottom: 1px solid ${T.line}; overflow-x: auto; scrollbar-width: none; }
    .wr-tabs::-webkit-scrollbar { display: none; }
    .wr-tabs button { position: relative; flex: none; padding: 15px 0 16px; background: transparent; border: 0; cursor: pointer; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; }
    .wr-tabs button[aria-selected="true"] { color: ${T.text}; }
    .wr-tabs button[aria-selected="true"]::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: ${T.gold}; }
    /* the open decision sits in the middle of its space, centred like the name above it */
    .wr-card { display: flex; align-items: center; justify-content: center; padding-top: 20px; padding-bottom: 8px; min-height: 204px; text-align: center; }
    .wr-group { display: none; }
    .wr-group.is-on { display: block; width: 100%; }
    .wr-words { justify-content: center; }
    .wr-hint, .wr-fact { margin-left: auto; margin-right: auto; }
    .wr-word { padding: 12px 0; font-size: 15px; }
    .wr-word::after { bottom: 6px; }
    .wr-words { gap: 0 24px; margin-top: 6px; }
    .wr-metals { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 64px); justify-content: center; gap: 0; }
    .wr-metal { width: auto; font-size: 11px; gap: 10px; }
    .wr-metal i { width: 36px; height: 36px; }
    .wr-grade { justify-content: center; margin-top: 12px; }
    .wr-bar { min-width: 30px; padding: 6px 1px 6px; font-size: 12.5px; }
    .wr-scale { gap: 8px 4px; justify-content: space-between; max-width: 420px; margin-left: auto; margin-right: auto; }
    .wr-hint { display: block; margin: 14px 0 0; font-size: 13px; line-height: 1.55; color: ${T.textMuted}; }
    .wr-select { display: none; }
    .wr-sizes { display: block; }
    .wr-size { display: block; margin-top: 0; }
    .wr-size .wr-link { display: inline-block; margin-top: 10px; }
    .wr-buy .wr-btn { display: none; }
    .wr-buy { padding-top: 26px; }
    .wr-note { margin-top: 0; }
    .wr-specs { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 16px; }
    .wr-specs dd { font-size: 16.5px; }
    .wr-promise { grid-template-columns: 1fr; gap: 20px; }
    .wr-promise div { font-size: 16.5px; }
    .wr-bar-fixed { display: flex; align-items: center; gap: 16px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 55; padding: 12px ${pageX} calc(12px + env(safe-area-inset-bottom, 0px)); background: ${GROUND}; border-top: 1px solid ${T.line}; }
    .wr-bar-fixed > div { flex: 1; min-width: 0; }
    .wr-bar-fixed strong { display: block; font-weight: 400; font-size: 18px; letter-spacing: 0.03em; font-variant-numeric: tabular-nums; }
    .wr-bar-fixed span { display: block; font-size: 11.5px; color: ${T.textMuted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wr-bar-fixed .wr-btn { display: block; width: auto; flex: none; margin: 0; padding: 16px 26px; }
  }
  @media (prefers-reduced-motion: reduce) { .wr * { transition: none !important; } }
`;

const WeddingRingDetail = (): JSX.Element => {
  const { productId } = useParams<{ productId: string }>();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [design, setDesign] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [labels, setLabels] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metal, setMetal] = useState('');
  const [size, setSize] = useState('L');
  const [imgWay, setImgWay] = useState('W');
  const [added, setAdded] = useState(false);
  const [fullStory, setFullStory] = useState(false);
  const [tab, setTab] = useState('metal'); // phone only: which decision is open

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

  // All designs in this collection (for the width, weight and other selectors)
  useEffect(() => {
    const col = design?.collection; if (!col) return;
    fetch(`${API_BASE_URL}/wedding/designs`)
      .then(r => r.json())
      .then(d => { if (d.success) { setLabels(d.labels || {}); setMembers((d.designs || []).filter((x: any) => x.collection === col && (x.category !== "Cluster" || x.category === design?.category))); } })
      .catch(() => {});
  }, [design?.collection]);

  // Keep the chosen metal across switches; fall back to 18ct white only when the current metal
  // is not offered on the new design. No scroll reset: an option updates in place.
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
  const rows: any[] = design?.variationRows || [];
  // Patterned designs have no price list in the catalogue; they are sold by enquiry.
  const onRequest = !!design && rows.length === 0;
  // Diamond-set and shaped bands: no weight classes, the design itself fixes width and carat.
  const isSet = !!design && !onRequest && !design.weightClassId && rows.some(r => r.carat);
  const isClassic = !!design && !onRequest && !isSet;

  // ── classic bands: gender, profile, width, weight ──
  const curGender = design ? (/gents/i.test(design.family || '') ? 'Gents' : 'Ladies') : 'Ladies';
  const curProfile = facet(me, 'profile');
  const curWidth = design ? String(design.widthMm) : facet(me, 'width');
  const curWeight = facet(me, 'weight');

  const genders = useMemo(() => [...new Set(members.map(genderOf))], [members]);
  const profiles = useMemo(() => [...new Set(members.filter(m => genderOf(m) === curGender).map(m => facet(m, 'profile')).filter(Boolean))], [members, curGender]);
  const widths = useMemo(() => [...new Set(members.filter(m => genderOf(m) === curGender && (!curProfile || facet(m, 'profile') === curProfile)).map(m => facet(m, 'width')).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b)), [members, curGender, curProfile]);
  const weights = useMemo(() => [...new Set(members.filter(m => genderOf(m) === curGender && (!curProfile || facet(m, 'profile') === curProfile) && facet(m, 'width') === curWidth).map(m => facet(m, 'weight')).filter(Boolean))].sort((a, b) => WEIGHT_ORDER.indexOf(wlabel(a)) - WEIGHT_ORDER.indexOf(wlabel(b))), [members, curGender, curProfile, curWidth, labels]);

  const find = (g: string, p: string, w: string, wt: string) => members.find(m => genderOf(m) === g && facet(m, 'profile') === p && facet(m, 'width') === w && facet(m, 'weight') === wt);
  // Switch design in place (no route change); the address is updated quietly so the link still
  // reflects the current selection.
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

  // ── diamond-set bands: setting, width, how far the diamonds run ──
  const setName = (family?: string) => (family || '').split(';').pop()!.trim();
  const settings = useMemo(() => (isSet ? [...new Set(members.map(m => m.family).filter(Boolean))] : []), [members, isSet]);
  const sibs = useMemo(() => (isSet ? members.filter(m => m.family === (me?.family || design?.family) && setParts(m.id)) : []), [members, isSet, me?.family, design?.family]);
  const mine = setParts(design?.id || '');
  const setWidths = useMemo(() => [...new Set(sibs.map(m => setParts(m.id)!.w))].sort((a, b) => a - b), [sibs]);
  const coverages = useMemo(() => [...new Set(sibs.map(m => setParts(m.id)!.cov))].sort((a, b) => a - b), [sibs]);
  const nearest = (list: any[], w: number, cov: number) => [...list].sort((a, b) => {
    const pa = setParts(a.id)!, pb = setParts(b.id)!;
    return (Math.abs(pa.w - w) * 10 + Math.abs(pa.cov - cov) / 10) - (Math.abs(pb.w - w) * 10 + Math.abs(pb.cov - cov) / 10);
  })[0];
  const pickSetWidth = (w: number) => go(nearest(sibs.filter(m => setParts(m.id)!.w === w), w, mine?.cov ?? 0));
  const pickCoverage = (c: number) => go(nearest(sibs.filter(m => setParts(m.id)!.cov === c), mine?.w ?? 0, c));
  const pickSetting = (family: string) => {
    const list = members.filter(m => m.family === family);
    const parsed = list.filter(m => setParts(m.id));
    go(parsed.length && mine ? nearest(parsed, mine.w, mine.cov) : list[0]);
  };

  // ── metal: a colour, then how pure ──
  const curRow = rows.find((r: any) => r.metal === metal) || rows[0];
  const curFam = curRow ? famOf(curRow.metal) : '';
  const fams = FAMILY_ORDER.filter(f => rows.some(r => famOf(r.metal) === f));
  // Patterned designs have no metal list, only the colours they are photographed in.
  const ways: string[] = rows.length ? [] : WAY_ORDER.filter(w => (design?.colourways || []).includes(w));
  const curWay = curRow?.colourway || imgWay;
  const grades = rows.filter(r => famOf(r.metal) === curFam).sort((a, b) => PURITY_ORDER.indexOf(purityKey(a.metal)) - PURITY_ORDER.indexOf(purityKey(b.metal)));
  const pickFam = (f: string) => {
    const list = rows.filter(r => famOf(r.metal) === f);
    if (!list.length) return;
    // keep the same carat when moving between golds; otherwise the finest offered
    const same = list.find(r => purityKey(r.metal) === purityKey(metal));
    const pick = same || list.find(r => purityKey(r.metal) === '18') || list.find(r => r.metal === 'PD') || list[list.length - 1];
    setMetal(pick.metal); if (pick.colourway) setImgWay(pick.colourway);
  };
  const pickMetal = (r: any) => { setMetal(r.metal); if (r.colourway) setImgWay(r.colourway); };
  const metalName = curRow ? metalFull(curRow.metal, curRow.metalName) : '';
  const diamonds = isSet ? diamondLine(curRow) : '';

  const price = curRow?.price ?? design?.priceFrom ?? null;
  const hero = design?.hero || {};
  const heroImg = hero[imgWay] || hero.W || hero.Y || hero.R;
  // A design can carry a spin object whose templates are all empty; only treat it as turnable
  // when a real frame template exists.
  const hasSpin = !!(design?.spin && (design.spin.W || design.spin.Y || design.spin.R));

  const handleAdd = () => {
    if (!design || !curRow) return;
    // Wedding designs live in the Allied Gold catalogue, not the products table. Keep the exact
    // design id, collection and every chosen value in the options so the order records the
    // precise catalogue reference for fulfilment.
    const opts: Record<string, string> = { weddingDesignId: String(design.id), collection: design.collection || design.name, metal: metalName, width: `${curWidth}mm` };
    if (isClassic) { opts.weight = wlabel(curWeight); opts.profile = plabel(curProfile); }
    if (isSet) { if (curRow.carat) opts.diamondWeight = `${curRow.carat}ct`; if (diamonds) opts.diamonds = diamonds; if (design.settingCoverage) opts.coverage = design.settingCoverage; }
    if (curRow.sku) opts.sku = curRow.sku;
    opts.size = `UK ${size}`;
    addToCart({
      id: design.id, name: design.name, price: money(price), size: `UK ${size}`,
      image: heroImg ? getMediaUrl(heroImg) : '',
      type: 'jewelry',
      selectedOptions: opts,
    } as any);
    setAdded(true); setTimeout(() => setAdded(false), 2200);
  };

  if (loading) return (<div className="wr"><style>{CSS}</style><NavigationV2 solid /><div className="wr-state"><div className="wr-eyebrow">Loading</div></div></div>);
  if (error || !design) return (
    <div className="wr"><style>{CSS}</style><NavigationV2 solid />
      <div className="wr-state">
        <h1>We couldn't find that ring.</h1>
        <Link to="/wedding" className="wr-link">Back to wedding rings</Link>
      </div>
      <FooterV2 />
    </div>
  );

  const title = onRequest ? design.name : (design.collection || design.name);
  const kind = onRequest ? design.collection : isSet ? setName(design.family) : plabel(curProfile) || design.profile;
  const saved = isFavorite(String(design.id));
  const summary = onRequest ? `${design.collection || 'Wedding ring'} pattern` : [metalName, `${curWidth}mm`, isClassic ? wlabel(curWeight) : curRow?.carat ? `${curRow.carat}ct` : '', onRequest ? '' : `Size ${size}`].filter(Boolean).join(' · ');
  const story = fillText(design.descriptionTemplate || design.shortDescription || design.description, metalName, curRow?.hallmark).split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  // The catalogue lists every grade it offers; show only the grade of the ring being bought.
  const soldGrade = (() => { const [c, cl] = String(curRow?.quality || '').split('-'); return c && cl ? `${c} colour, ${cl} clarity` : ''; })();
  const specs = fillText(design.specification, metalName, curRow?.hallmark).split('\n').map(l => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : null; })
    .filter((p): p is string[] => !!p && !!p[1] && !/^ring size$/i.test(p[0]))
    .map(([k, v]) => /^diamond (clarity|colour|color|grade|quality)$/i.test(k) && soldGrade ? ['Diamond grade', soldGrade] : [k, v]);
  const bar = (mm: number) => <i style={{ width: Math.max(6, Math.round(mm * 4)), background: BAR[curWay] || BAR.W }} />;
  const lab = (name: string, value?: string) => <div className="wr-lab">{name}{value ? <>: <b>{value}</b></> : null}</div>;

  // Every decision, in order. Side by side on a laptop; one at a time behind a strip on a phone.
  const groups: { key: string; name: string; node: React.ReactNode }[] = [];
  const words = (key: string, label: string, items: { id: string | number; text: string; on: boolean; pick: () => void }[]) => (
    <div className="wr-words" role="radiogroup" aria-label={label}>{items.map(it => <button key={it.id} type="button" role="radio" aria-checked={it.on} data-radio={key} className="wr-word" onClick={it.pick}>{it.text}</button>)}</div>
  );
  if (isClassic && genders.length > 1) groups.push({ key: 'for', name: 'For', node: <>{lab('For', curGender)}{words('for', 'For', genders.map(g => ({ id: g, text: g, on: curGender === g, pick: () => pickGender(g) })))}</> });
  if (isClassic && profiles.length > 1) groups.push({ key: 'profile', name: 'Profile', node: <>{lab('Profile', plabel(curProfile))}{words('profile', 'Profile', profiles.map(p => ({ id: p, text: plabel(p), on: curProfile === p, pick: () => pickProfile(p) })))}</> });
  if (isSet && settings.length > 1) groups.push({ key: 'setting', name: 'Setting', node: <>{lab('Setting', setName(design.family))}{words('setting', 'Setting', settings.map(f => ({ id: f, text: setName(f), on: design.family === f, pick: () => pickSetting(f) })))}</> });
  if (fams.length > 0) groups.push({ key: 'metal', name: 'Metal', node: (
    <>{lab('Metal', metalName)}
      <div className="wr-metals" role="radiogroup" aria-label="Metal">
        {fams.map(f => <button key={f} type="button" role="radio" aria-checked={curFam === f} data-fam={f} data-way={(rows.find(r => famOf(r.metal) === f) || {}).colourway || 'W'} data-name={FAMILY[f].name} className="wr-metal" onClick={() => pickFam(f)}><i style={{ background: FAMILY[f].sw }} /><span>{FAMILY[f].name.split(' ').map((w, i) => <React.Fragment key={i}>{i > 0 && <br />}{w}</React.Fragment>)}</span></button>)}
      </div>
      {grades.length > 1 && (
        <div className="wr-grade">
          <span>{goldParts(metal) ? 'Carat' : 'Purity'}</span>
          {words('purity', goldParts(metal) ? 'Gold carat' : 'Palladium purity', grades.map(r => ({ id: r.metal, text: gradeLabel(r.metal), on: metal === r.metal, pick: () => pickMetal(r) })))}
        </div>
      )}
    </>) });
  else if (ways.length > 0) groups.push({ key: 'metal', name: 'Metal', node: (
    <>{lab('Colour', (WAY_WORD[curWay] || '').replace(/^./, c => c.toUpperCase()))}
      <div className="wr-metals" role="radiogroup" aria-label="Metal colour">
        {ways.map(w => <button key={w} type="button" role="radio" aria-checked={curWay === w} data-way={w} className="wr-metal" onClick={() => setImgWay(w)}><i style={{ background: SW[w] }} />{WAY_WORD[w].replace(/^./, c => c.toUpperCase())}</button>)}
      </div>
    </>) });
  const scale = (items: { id: string | number; mm: number; on: boolean; pick: () => void }[]) => (
    <><div className="wr-scale" role="radiogroup" aria-label="Width in millimetres">
      {items.map(it => <button key={it.id} type="button" role="radio" aria-checked={it.on} aria-label={`${it.mm} millimetres`} data-radio="width" className="wr-bar" onClick={it.pick}>{bar(it.mm)}{it.mm}</button>)}
    </div><p className="wr-hint">Drawn to scale, so the bars show how each width compares.</p></>
  );
  if (isClassic && widths.length > 0) groups.push({ key: 'width', name: 'Width', node: <>{lab('Width', `${curWidth} mm`)}{scale(widths.map(w => ({ id: w, mm: parseFloat(w), on: curWidth === w, pick: () => pickWidth(w) })))}</> });
  if (isSet && setWidths.length > 1) groups.push({ key: 'width', name: 'Width', node: <>{lab('Width', `${mine?.w ?? curWidth} mm`)}{scale(setWidths.map(w => ({ id: w, mm: w, on: mine?.w === w, pick: () => pickSetWidth(w) })))}</> });
  if (isSet && coverages.length > 1) groups.push({ key: 'diamonds', name: 'Diamonds', node: <>{lab('Diamonds around the band')}{words('coverage', 'Diamonds around the band', coverages.map(c => ({ id: c, text: c >= 100 ? 'All the way' : `${c}%`, on: mine?.cov === c, pick: () => pickCoverage(c) })))}</> });
  if (isClassic && weights.length > 0) groups.push({ key: 'weight', name: 'Weight', node: <>{lab('Weight', wlabel(curWeight))}{words('weight', 'Weight', weights.map(wt => ({ id: wt, text: wlabel(wt), on: curWeight === wt, pick: () => pickWeight(wt) })))}</> });
  if (onRequest) specs.filter(([k]) => /^available/i.test(k)).forEach(([k, v]) => { const name = k.replace(/^available\s+/i, '').replace(/^./, c => c.toUpperCase()); groups.push({ key: name.toLowerCase(), name, node: <>{lab(name)}<p className="wr-fact">{v}</p></> }); });
  if (!onRequest) groups.push({ key: 'size', name: 'Size', node: (
    <>{lab('Finger size', `UK ${size}`)}
      <div className="wr-size">
        <select className="wr-select" aria-label="Finger size" value={size} onChange={e => setSize(e.target.value)}>{RING_SIZES.map(sz => <option key={sz} value={sz}>UK {sz}</option>)}</select>
        <div className="wr-sizes">{words('size', 'Finger size', RING_SIZES.map(sz => ({ id: sz, text: sz, on: size === sz, pick: () => setSize(sz) })))}</div>
        <Link to="/ring-size-guide" className="wr-link">Size guide</Link>
      </div>
    </>) });
  const openTab = groups.some(g => g.key === tab) ? tab : (groups.find(g => g.key === 'metal') || groups[0])?.key;

  return (
    <div className="wr">
      <style>{CSS}</style>
      <NavigationV2 solid />

      <main>
        <div className="wr-top">
        <div className="wr-stage">
          <nav className="wr-crumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/wedding">Wedding</Link><span>/</span><span>{design.collection || design.name}</span></nav>
          {hasSpin
            ? <Spin360 spin={design.spin} way={imgWay} />
            : heroImg ? <img className="wr-still" src={getMediaUrl(heroImg)} alt={`${title} wedding ring${metalName ? ` in ${metalName}` : ''}`} /> : null}
          {hasSpin && <div className="wr-turn">Drag to turn</div>}
        </div>

        <header className="wr-head">
          <div className="wr-eyebrow">Wedding ring{kind ? ` · ${kind}` : ''}</div>
          <h1 className="wr-h1">{title}</h1>
          <div className="wr-price" data-total>{onRequest ? 'Price on request' : money(price)}</div>
          {diamonds && <p className="wr-sub">{curRow?.carat ? `${curRow.carat}ct in total. ` : ''}{diamonds}.</p>}
          {onRequest && <p className="wr-sub">This pattern is cut to order across several widths and profiles, so we price it for you personally.</p>}
        </header>

        {/* On a phone only one decision is open at a time; this strip names them. */}
        <div className="wr-tabs" role="tablist" aria-label="Choices">
          {groups.map(g => <button key={g.key} type="button" role="tab" aria-selected={openTab === g.key} data-tab={g.key} onClick={() => setTab(g.key)}>{g.name}</button>)}
        </div>
        <div className="wr-card">
          {groups.map(g => <section key={g.key} className={`wr-group${openTab === g.key ? ' is-on' : ''}`} data-group={g.key}>{g.node}</section>)}
        </div>

        <div className="wr-buy">
          {onRequest
            ? <Link to="/contact" className="wr-btn">Enquire about this ring</Link>
            : <button type="button" className="wr-btn" data-addbag onClick={handleAdd}>{added ? 'Added to bag' : 'Add to bag'}</button>}
          <p className="wr-note">Made to order in your finger size. Free insured UK delivery.</p>
          <div className="wr-quiet">
            <button type="button" className="wr-link" aria-pressed={saved} data-savebtn onClick={() => toggleFavorite(String(design.id), design.name, heroImg ? getMediaUrl(heroImg) : '', window.location.pathname)}>{saved ? 'Saved' : 'Save'}</button>
            <Link to="/book-appointment" className="wr-link">Try it on in the showroom</Link>
          </div>
        </div>

        </div>

        {(story.length > 0 || specs.length > 0) && (
          <section className="wr-about">
            <div className="wr-eyebrow">About this ring</div>
            {story[0] && <p className="wr-lead">{story[0]}</p>}
            {story.length > 1 && (
              <>
                <div className={`wr-rest${fullStory ? ' is-open' : ''}`}>{story.slice(1).map((p, i) => <p key={i}>{p}</p>)}</div>
                <button type="button" className="wr-link" data-catmore aria-expanded={fullStory} onClick={() => setFullStory(v => !v)}>{fullStory ? 'Show less' : 'Read the full description'}</button>
              </>
            )}
            {specs.length > 0 && <dl className="wr-specs">{specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
          </section>
        )}

        <section className="wr-band">
          <div className="wr-eyebrow">With every wedding ring</div>
          <h2>Made for one finger, to be worn every day.</h2>
          <div className="wr-promise"><div>Made to your size</div><div>Hallmarked in the UK</div><div>Free insured UK delivery</div></div>
        </section>
      </main>

      <DiamondHelpNudge productName={design.name} title="Got lost customising your ring?" subtitle="Width, weight, metal: we’ll help you choose the perfect band." />
      <FooterV2 />

      <div className="wr-bar-fixed">
        <div><strong>{onRequest ? 'Price on request' : money(price)}</strong><span>{summary}</span></div>
        {onRequest
          ? <Link to="/contact" className="wr-btn">Enquire</Link>
          : <button type="button" className="wr-btn" onClick={handleAdd}>{added ? 'Added' : 'Add to bag'}</button>}
      </div>
    </div>
  );
};

export default WeddingRingDetail;
