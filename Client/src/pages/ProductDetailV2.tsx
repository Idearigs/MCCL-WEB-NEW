
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Heart, Phone, MessageCircle, ChevronDown, ChevronUp, Plus, X, Minus, ZoomIn, ZoomOut, Play, Pause, Volume2, VolumeX, Check } from 'lucide-react';
import LuxuryNavigationWhite from '@/components/LuxuryNavigationWhite';
import { FooterSection } from '@/components/FooterSection';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL, { getMediaUrl } from '../config/api';
import NavigationV2 from '../components/home-v2/NavigationV2';
import FooterV2 from '../components/home-v2/FooterV2';
import { T, FONT_DISPLAY, FONT_BODY } from '../components/home-v2/tokens';
import { trackViewContent, trackAddToCart } from '../services/pixelService';
import { useCountry } from '../hooks/useCountry';
import DiamondHelpNudge from '../components/DiamondHelpNudge';
// Redesign (Nov 2026): the listing pages' ground and tile, and the saved-pieces heart.
import { GROUND, TILE } from '../components/home-v2/listingShared';
import { useFavorites } from '../contexts/FavoritesContext';
import { useGoogleRating } from '../components/home-v2/GoogleReviewsV2';

/**
 * The primary product film.
 *
 * iOS/WebKit only plays a <video> whose server answers HTTP Range requests with
 * 206 Partial Content. Cloudflare (in front of api.buymediamonds.co.uk) buffers
 * cacheable `.mp4` responses and answers ranges with a rangeless 200 that iOS
 * refuses to play (Android Chrome tolerates it — hence "plays on Android, black
 * on iPhone"). The server exposes the same files on an extensionless path
 * (/media/videos/<sku>) that Cloudflare treats as dynamic and passes byte ranges
 * through, so native playback gets its required 206 everywhere. See Server/index.js.
 */
function toStreamUrl(url: string): string {
  // Videos are uploaded under /uploads/products/ (and some under /uploads/videos/).
  // Route both through the extensionless, range-capable /media/videos/ path so iOS
  // gets its required 206 Partial Content (Cloudflare strips ranges from cached .mp4).
  return url.replace(/\/uploads\/(?:videos|products)\/(.+?)\.mp4(\?.*)?$/i, '/media/videos/$1');
}

function FilmVideo({ url, poster }: { url: string; poster?: string }) {
  return (
    <video
      src={toStreamUrl(url)}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

const metalTypeOptions = [
  { value: 'silver',           label: 'Silver',           overrideKey: 'silver'          },
  { value: '9ct-white-gold',   label: '9ct White Gold',   overrideKey: 'gold_9kt'        },
  { value: '9ct-yellow-gold',  label: '9ct Yellow Gold',  overrideKey: 'gold_9kt_yellow' },
  { value: '9ct-rose-gold',    label: '9ct Rose Gold',    overrideKey: 'gold_9kt_rose'   },
  { value: '14ct-white-gold',  label: '14ct White Gold',  overrideKey: 'gold_14kt'       },
  { value: '14ct-yellow-gold', label: '14ct Yellow Gold', overrideKey: 'gold_14kt_yellow'},
  { value: '14ct-rose-gold',   label: '14ct Rose Gold',   overrideKey: 'gold_14kt_rose'  },
  { value: '18ct-white-gold',  label: '18ct White Gold',  overrideKey: 'gold_18kt'       },
  { value: '18ct-yellow-gold', label: '18ct Yellow Gold', overrideKey: 'gold_18kt_yellow'},
  { value: '18ct-rose-gold',   label: '18ct Rose Gold',   overrideKey: 'gold_18kt_rose'  },
  { value: 'platinum',         label: 'Platinum',         overrideKey: 'platinum'        },
];

function getMetalBase(value: string): string {
  if (!value || value === 'silver') return 'silver';
  if (value === 'platinum') return 'platinum';
  if (value.includes('white')) return 'white-gold';
  if (value.includes('yellow')) return 'yellow-gold';
  if (value.includes('rose')) return 'rose-gold';
  return '';
}
function getMetalKarat(value: string): string {
  if (value.startsWith('9ct')) return '9ct';
  if (value.startsWith('14ct')) return '14ct';
  if (value.startsWith('18ct')) return '18ct';
  return '';
}
function buildMetalValue(base: string, karat: string): string {
  if (base === 'silver' || base === 'platinum') return base;
  return karat ? `${karat}-${base}` : `18ct-${base}`;
}
const METAL_BASE_LABELS: Record<string, string> = {
  'silver': 'Silver',
  'white-gold': 'White Gold',
  'yellow-gold': 'Yellow Gold',
  'rose-gold': 'Rose Gold',
  'platinum': 'Platinum',
};

const ringSizes = [
  { value: 'A', label: 'UK Size A (US 0, EU 37.5)' },
  { value: 'B', label: 'UK Size B (US 0.5, EU 38.2)' },
  { value: 'C', label: 'UK Size C (US 1, EU 38.8)' },
  { value: 'D', label: 'UK Size D (US 1.5, EU 39.5)' },
  { value: 'E', label: 'UK Size E (US 2, EU 40.1)' },
  { value: 'F', label: 'UK Size F (US 2.5, EU 40.8)' },
  { value: 'G', label: 'UK Size G (US 3, EU 41.4)' },
  { value: 'H', label: 'UK Size H (US 3.5, EU 42.1)' },
  { value: 'I', label: 'UK Size I (US 4, EU 42.8)' },
  { value: 'J', label: 'UK Size J (US 4.5, EU 43.4)' },
  { value: 'K', label: 'UK Size K (US 5, EU 44.1)' },
  { value: 'L', label: 'UK Size L (US 5.5, EU 44.8)' },
  { value: 'M', label: 'UK Size M (US 6, EU 45.4)' },
  { value: 'N', label: 'UK Size N (US 6.5, EU 46.1)' },
  { value: 'O', label: 'UK Size O (US 7, EU 46.8)' },
  { value: 'P', label: 'UK Size P (US 7.5, EU 47.4)' },
  { value: 'Q', label: 'UK Size Q (US 8, EU 48.1)' },
  { value: 'R', label: 'UK Size R (US 8.5, EU 48.7)' },
  { value: 'S', label: 'UK Size S (US 9, EU 49.4)' },
  { value: 'T', label: 'UK Size T (US 9.5, EU 50.1)' },
  { value: 'U', label: 'UK Size U (US 10, EU 50.7)' },
  { value: 'V', label: 'UK Size V (US 10.5, EU 51.4)' },
  { value: 'W', label: 'UK Size W (US 11, EU 52.1)' },
  { value: 'X', label: 'UK Size X (US 11.5, EU 52.7)' },
  { value: 'Y', label: 'UK Size Y (US 12, EU 53.4)' },
  { value: 'Z', label: 'UK Size Z (US 12.5, EU 54.1)' }
];

const renderDescription = (text: string | undefined) => {
  if (!text) return null;

  const isSectionHeader = (line: string) =>
    line.length < 65 &&
    !line.endsWith('.') &&
    !line.endsWith(':') &&
    /^[A-Z]/.test(line) &&
    line.split(' ').length >= 2;

  const blocks: { type: 'title' | 'header' | 'body'; text: string }[] = [];
  let bodyAccum = '';

  const flushBody = () => {
    const t = bodyAccum.trim();
    if (t) { blocks.push({ type: 'body', text: t }); bodyAccum = ''; }
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { flushBody(); continue; }
    if (line.includes('–') && line.length < 120) { flushBody(); blocks.push({ type: 'title', text: line }); continue; }
    if (isSectionHeader(line)) { flushBody(); blocks.push({ type: 'header', text: line }); continue; }
    bodyAccum += (bodyAccum ? ' ' : '') + line;
  }
  flushBody();

  return (
    <div>
      {blocks.map((block, i) => {
        if (block.type === 'title') return (
          <p key={i} className="font-medium text-gray-900 text-sm leading-snug mb-4">
            {block.text}
          </p>
        );
        if (block.type === 'header') return (
          <p key={i} className="font-medium text-gray-800 text-[11px] uppercase tracking-[0.14em] mt-5 mb-2">
            {block.text}
          </p>
        );
        return (
          <p key={i} className="text-sm font-futura-pt font-light text-gray-600 leading-[1.75] mb-3">
            {block.text}
          </p>
        );
      })}
    </div>
  );
};


// ── Redesign (Nov 2026): the client's own description, read into its parts so the page can
// set it properly: a tagline, an introduction, then titled chapters. A chapter holds
// paragraphs and/or a specification ("Key: Value" lines). Nothing is reworded.
interface StoryChapter { title: string; paras: string[]; specs: [string, string][] }
const parseDescription = (text: string | undefined, productName?: string): { tagline: string; intro: string[]; chapters: StoryChapter[] } => {
  const out = { tagline: '', intro: [] as string[], chapters: [] as StoryChapter[] };
  if (!text) return out;
  const isSectionHeader = (line: string) =>
    /^specifications?:?$/i.test(line) ||
    (line.length < 65 && !line.endsWith('.') && !line.endsWith(':') && /^[A-Z]/.test(line) && line.split(' ').length >= 2 && !/:\s/.test(line));
  let body = '';
  const flush = () => {
    const t = body.trim(); body = '';
    if (!t) return;
    if (out.chapters.length) out.chapters[out.chapters.length - 1].paras.push(t); else out.intro.push(t);
  };
  for (const raw of String(text).split('\n')) {
    const line = raw.trim().replace(/^[•·*]\s*/, '');
    if (!line) { flush(); continue; }
    // "Rosalind – Hand-Engraved Heritage, Timeless Form": the part after the dash is the tagline.
    if (!out.tagline && !out.chapters.length && !out.intro.length && line.includes('–') && line.length < 120) { out.tagline = line.split('–').slice(1).join('–').trim() || line; continue; }
    // Stock pieces often open by repeating their own name; the page already shows it.
    if (productName && !out.intro.length && !out.chapters.length && line.toLowerCase() === productName.trim().toLowerCase()) continue;
    if (isSectionHeader(line)) { flush(); out.chapters.push({ title: line.replace(/:$/, ''), paras: [], specs: [] }); continue; }
    // "Clasp: Lobster Clasp" inside a chapter is a line of the specification.
    const spec = line.match(/^([A-Z][A-Za-z /&-]{1,34}):\s+(.{1,180})$/);
    if (spec && !/^(please )?note$/i.test(spec[1])) {
      flush();
      // "Metal: 18ct White Gold" lines with no heading above them still make a specification.
      if (!out.chapters.length) out.chapters.push({ title: 'Specifications', paras: [], specs: [] });
      out.chapters[out.chapters.length - 1].specs.push([spec[1], spec[2]]);
      continue;
    }
    body += (body ? ' ' : '') + line;
  }
  flush();
  out.chapters = out.chapters.filter(c => c.paras.length || c.specs.length);
  return out;
};

const PD_X = 'clamp(20px, 4vw, 64px)';
const PD_CSS = `
  .pd a { color: inherit; text-decoration: none; }
  .pd-wrap { max-width: 1400px; margin: 0 auto; padding-left: ${PD_X}; padding-right: ${PD_X}; }
  .pd-crumb { display: flex; flex-wrap: wrap; gap: 6px 10px; padding: clamp(24px, 2.8vw, 40px) 0 clamp(26px, 3vw, 44px); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }
  .pd-crumb a:hover { color: ${T.text}; }
  .pd-main { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(420px, 0.88fr); align-items: start; }
  .pd-eyebrow { display: flex; align-items: center; gap: 12px; font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .pd-eyebrow i { width: 18px; height: 1px; background: ${T.gold}; }
  .pd-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(34px, 3.4vw, 50px); line-height: 1.06; margin: 0; color: ${T.text}; }
  .pd-h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(26px, 2.6vw, 38px); line-height: 1.18; margin: 0; color: ${T.text}; text-wrap: balance; }
  .pd-link { display: inline-block; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; padding: 0 0 3px; font-family: ${FONT_BODY}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; white-space: nowrap; transition: border-color 0.2s ease; }
  .pd-link:hover { border-bottom-color: ${T.gold}; }
  .pd-btn { display: inline-block; padding: 17px clamp(24px, 3vw, 44px); background: ${T.ink}; color: ${T.cream} !important; border: 0; cursor: pointer; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; white-space: nowrap; transition: background 0.3s ease; }
  .pd-btn:hover { background: ${T.text}; }
  .pd-btn[disabled] { opacity: 0.7; cursor: default; }

  /* ── the plate ── */
  .pd-plate { position: sticky; top: var(--v2nav-h, 113px); height: calc(100vh - var(--v2nav-h, 113px)); min-height: 480px; background: ${TILE}; overflow: hidden; }
  .pd-stage { position: absolute; inset: 0; }
  .pd-slide { position: absolute; inset: 0; opacity: 0; pointer-events: none; transition: opacity 0.9s ease; }
  .pd-slide[data-on="1"] { opacity: 1; pointer-events: auto; }
  .pd-slide img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 6% 8% 84px; mix-blend-mode: multiply; cursor: zoom-in; }
  .pd-slide video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  /* stock pieces are photographed, not rendered: the photograph fills the plate edge to edge */
  .pd-plate.is-photo .pd-slide img { object-fit: cover; padding: 0; mix-blend-mode: normal; }
  .pd-index { position: absolute; left: ${PD_X}; right: clamp(20px, 3vw, 44px); bottom: 26px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
  .pd-index > div { display: flex; gap: clamp(18px, 2.4vw, 36px); }
  .pd-index button { position: relative; padding: 8px 0 10px; cursor: pointer; background: transparent; border: 0; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; font-variant-numeric: tabular-nums; transition: color 0.3s ease; }
  .pd-index button::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: ${T.gold}; transform: scaleX(0); transform-origin: left; transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); }
  .pd-index button:hover, .pd-index button[aria-selected="true"] { color: ${T.text}; }
  .pd-index button[aria-selected="true"]::after { transform: scaleX(1); }
  .pd-index .pd-enlarge { cursor: zoom-in; }
  .pd-index .pd-enlarge:hover::after { transform: scaleX(1); }
  .pd-dots { display: none; }

  /* ── buy column ── */
  .pd-buy { min-width: 0; padding: 0 ${PD_X} clamp(48px, 5vw, 80px) clamp(32px, 4.6vw, 80px); }
  .pd-buy-in { max-width: 520px; }
  .pd-status { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .pd-status i { width: 6px; height: 6px; border-radius: 50%; background: ${T.gold}; }
  .pd-h1.is-long { font-size: clamp(28px, 2.6vw, 38px); line-height: 1.14; }
  .pd-facts { margin: 30px 0 0; display: grid; gap: 12px; }
  .pd-facts > div { display: flex; align-items: baseline; gap: 10px; font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .pd-facts dt::after { content: ":"; }
  .pd-facts dd { margin: 0; }
  .pd-titlerow { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .pd-save { flex: none; width: 44px; height: 44px; margin: 4px -11px 0 0; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; border: 0; color: ${T.text}; transition: opacity 0.2s ease; }
  .pd-save:hover { opacity: 0.55; }
  .pd-tagline { margin: 12px 0 0; font-size: 16px; line-height: 1.6; color: ${T.textMuted}; }
  .pd-priceline { margin-top: 18px; }
  .pd-price { font-family: ${FONT_BODY}; font-size: 20px; letter-spacing: 0.04em; line-height: 1.2; color: ${T.text}; font-variant-numeric: tabular-nums lining-nums; }
  .pd-bar-price { font-family: ${FONT_DISPLAY}; font-size: 30px; line-height: 1; color: ${T.text}; font-variant-numeric: tabular-nums lining-nums; }
  .pd-bar-price small { margin-left: 10px; font-family: ${FONT_BODY}; font-size: 12px; color: ${T.textMuted}; }
  .pd-notice { margin-top: 16px; padding: 14px 16px; border: 1px solid ${T.line}; border-left: 1px solid ${T.gold}; }
  .pd-notice p { margin: 0; font-size: 14px; line-height: 1.65; color: ${T.text}; }
  .pd-suggest { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .pd-suggest button { text-align: left; cursor: pointer; background: transparent; border: 1px solid ${T.line}; padding: 10px 13px; font-family: ${FONT_BODY}; transition: border-color 0.2s ease; }
  .pd-suggest button:hover { border-color: ${T.text}; }
  .pd-suggest b { display: block; font-weight: 400; font-size: 13.5px; color: ${T.text}; }
  .pd-suggest span { display: block; margin-top: 3px; font-size: 12.5px; color: ${T.textMuted}; }
  .pd-estimate { display: flex; align-items: baseline; gap: 10px; margin-top: 12px; font-size: 13.5px; line-height: 1.55; color: ${T.text}; }
  .pd-estimate i { flex: none; width: 6px; height: 6px; border-radius: 50%; border: 1px solid ${T.gold}; transform: translateY(-1px); }


  /* the choices: as little as possible on show, and no rules between them */
  .pd-line { padding: 34px 0 0; }
  .pd-linehead { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
  .pd-linename, .pd-optname { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .pd-linename b, .pd-optname b { font-weight: 400; }
  .pd-optname span { margin-left: 14px; letter-spacing: 0; text-transform: none; font-size: 13px; color: ${T.textMuted}; }
  .pd-words { display: flex; flex-wrap: wrap; align-items: center; gap: 2px clamp(18px, 2vw, 28px); margin-top: 8px; }
  .pd-word { position: relative; display: inline-flex; align-items: center; gap: 9px; min-height: 40px; padding: 6px 0 8px; cursor: pointer; background: transparent; border: 0; font-family: ${FONT_BODY}; font-size: 15px; color: ${T.textMuted}; transition: color 0.25s ease; }
  .pd-word::after { content: ""; position: absolute; left: 0; right: 0; bottom: 4px; height: 1px; background: ${T.gold}; transform: scaleX(0); transform-origin: left; transition: transform 0.45s cubic-bezier(0.22,1,0.36,1); }
  .pd-word:hover, .pd-word[aria-checked="true"] { color: ${T.text}; }
  .pd-word[aria-checked="true"]::after { transform: scaleX(1); }
  .pd-word[disabled] { opacity: 0.4; cursor: default; }
  .pd-optnote { font-size: 13px; color: ${T.textMuted}; font-variant-numeric: tabular-nums; }

  /* things to pick: a medallion each, a fine gold ring round the one chosen */
  .pd-tray { display: flex; flex-wrap: wrap; gap: 14px 14px; margin-top: 16px; }
  .pd-tray.is-four { display: grid; grid-template-columns: repeat(4, 68px); gap: 12px 10px; }
  .pd-stone { display: flex; flex-direction: column; align-items: center; padding: 0; cursor: pointer; background: transparent; border: 0; font-family: ${FONT_BODY}; }
  .pd-disc { position: relative; display: block; width: 58px; height: 58px; padding: 5px; border-radius: 50%; border: 1px solid transparent; transition: border-color 0.3s ease; }
  .pd-disc.is-photo { width: 70px; height: 70px; }
  .pd-disc img, .pd-disc svg, .pd-metal { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .pd-disc.is-photo img { background: ${TILE}; mix-blend-mode: multiply; }
  .pd-disc.is-photo::before { content: ""; position: absolute; inset: 5px; border-radius: 50%; background: ${TILE}; }
  .pd-disc.is-photo img { position: relative; }
  .pd-metal { box-shadow: inset 0 0 0 1px rgba(51,47,42,0.10), inset 0 -3px 6px rgba(51,47,42,0.10); }
  .pd-stone:hover .pd-disc { border-color: ${T.ruleStrong}; }
  .pd-stone[aria-checked="true"] .pd-disc { border-color: ${T.gold}; }
  .pd-stone b { margin-top: 6px; font-weight: 400; font-size: 13px; letter-spacing: 0.04em; color: ${T.textMuted}; transition: color 0.25s ease; }
  .pd-stone[aria-checked="true"] b, .pd-stone:hover b { color: ${T.text}; }
  .pd-stone[data-off] { cursor: default; opacity: 0.32; }
  .pd-stone[data-off]:hover .pd-disc { border-color: transparent; }
  .pd-stone[data-off]:hover b { color: ${T.textMuted}; }
  .pd-karats { display: flex; align-items: center; gap: 22px; margin-top: 18px; }
  .pd-karats .pd-words { margin-top: 0; }
  .pd-karats.is-idle { opacity: 0.45; }
  .pd-word[disabled] { opacity: 0.32; }
  .pd-stone small { min-height: 15px; font-size: 11px; color: ${T.textMuted}; font-variant-numeric: tabular-nums; }

  /* the diamond's choices */
  .pd-diamond { padding: 0 0 6px; }
  .pd-opt { padding-top: 24px; }

  .carat-slider { position: relative; height: 30px; margin-top: 16px; }
  .carat-track { position: absolute; left: 11px; right: 11px; top: 50%; height: 1px; background: ${T.ruleStrong}; }
  .carat-fill { position: absolute; left: 11px; top: 50%; height: 1px; background: ${T.gold}; }
  .carat-tick { position: absolute; top: 50%; width: 1px; height: 9px; transform: translate(-50%, -50%); background: ${T.ruleStrong}; }
  .carat-tick[data-on="1"] { background: ${T.gold}; }
  .carat-handle { position: absolute; top: 50%; width: 20px; height: 20px; transform: translate(-50%, -50%); border-radius: 50%; background: ${GROUND}; border: 1px solid ${T.text}; box-shadow: 0 1px 6px rgba(51,47,42,0.14); pointer-events: none; z-index: 3; }
  .carat-handle::after { content: ""; position: absolute; inset: 6px; border-radius: 50%; background: ${T.gold}; }
  .carat-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: grab; z-index: 4; -webkit-appearance: none; appearance: none; background: transparent; }
  .carat-input:active { cursor: grabbing; }
  .carat-input:focus-visible ~ .carat-handle, .carat-slider:focus-within .carat-handle { outline: 2px solid ${T.text}; outline-offset: 3px; }
  .carat-input::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 30px; height: 30px; cursor: grab; }
  .carat-input::-moz-range-thumb { width: 30px; height: 30px; border: 0; background: transparent; cursor: grab; }
  .carat-labels { position: relative; height: 18px; margin-top: 6px; }
  .carat-labels span { position: absolute; transform: translateX(-50%); font-size: 12px; cursor: pointer; white-space: nowrap; color: ${T.textMuted}; font-variant-numeric: tabular-nums; }
  .carat-labels span[data-on="1"] { color: ${T.text}; font-weight: 500; }

  /* ring size */
  .pd-size { position: relative; }
  .pd-sizebtn { width: 100%; height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 18px; cursor: pointer; background: transparent; border: 1px solid ${T.ruleStrong}; font-family: ${FONT_BODY}; color: ${T.text}; text-align: left; transition: border-color 0.2s ease; }
  .pd-sizebtn:hover, .pd-sizebtn[aria-expanded="true"] { border-color: ${T.text}; }
  .pd-sizebtn > span:last-child { display: inline-flex; align-items: center; gap: 14px; }
  .pd-sizebtn b { font-weight: 400; font-size: 15px; letter-spacing: 0.04em; }
  .pd-actions { display: grid; gap: 12px; margin-top: 34px; }
  .pd-add { width: 100%; padding: 21px 24px; }
  .pd-btn2 { display: block; padding: 19px 24px; border: 1px solid ${T.ruleStrong}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; color: ${T.text}; transition: border-color 0.2s ease; }
  .pd-btn2:hover { border-color: ${T.text}; }
  .pd-rating { display: inline-flex; align-items: baseline; gap: 8px; margin-top: 30px; font-size: 13.5px; color: ${T.text}; border-bottom: 1px solid transparent; }
  .pd-rating:hover { border-bottom-color: ${T.gold}; }
  .pd-rating + .pd-actions { margin-top: 14px; }
  .pd-reassure { list-style: none; margin: 20px 0 0; padding: 18px 0 0; border-top: 1px solid ${T.line}; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px 20px; font-size: 13px; line-height: 1.45; color: ${T.text}; }
  .pd-reassure li { position: relative; padding-left: 14px; }
  .pd-reassure li::before { content: ""; position: absolute; left: 0; top: 0.55em; width: 5px; height: 5px; border-radius: 50%; background: ${T.gold}; }
  .pd-reassure a { border-bottom: 1px solid ${T.ruleStrong}; }
  .pd-reassure a:hover { border-bottom-color: ${T.gold}; }
  .pd-note { margin: 18px 0 0; font-size: 13.5px; line-height: 1.6; color: ${T.textMuted}; }
  .pd-note a { color: ${T.text}; border-bottom: 1px solid ${T.ruleStrong}; padding-bottom: 1px; white-space: nowrap; }
  .pd-sizemenu { display: none; position: absolute; top: calc(100% + 8px); left: 0; right: 0; max-height: 296px; overflow-y: auto; z-index: 40; padding: 5px; background: #FFFFFF; border: 1px solid ${T.ruleStrong}; box-shadow: 0 18px 40px -18px rgba(51,47,42,0.28); scrollbar-width: thin; scrollbar-color: ${T.ruleStrong} transparent; }
  .pd-sizemenu.is-open { display: block; }
  .pd-sizemenu button { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 12px; cursor: pointer; background: transparent; border: 0; border-left: 1px solid transparent; font-family: ${FONT_BODY}; text-align: left; transition: background 0.12s ease; }
  .pd-sizemenu button:hover { background: ${TILE}; }
  .pd-sizemenu button[aria-selected="true"] { background: ${TILE}; border-left-color: ${T.gold}; }
  .pd-sizemenu b { font-weight: 400; font-size: 14.5px; color: ${T.text}; }
  .pd-sizemenu button[aria-selected="true"] b { font-weight: 500; }
  .pd-sizemenu span { font-size: 13px; color: ${T.textMuted}; font-variant-numeric: tabular-nums; }

  /* reassurance, other ways to buy, accordions */
  .pd-assure { list-style: none; margin: 16px 0 0; padding: 30px 0 26px; border-top: 1px solid ${T.line}; display: grid; gap: 11px; }
  .pd-assure li { display: flex; align-items: baseline; gap: 12px; font-size: 14.5px; line-height: 1.5; color: ${T.text}; }
  .pd-assure .pd-tick { flex: none; width: 12px; }
  .pd-ways { display: flex; flex-wrap: wrap; gap: 10px 28px; padding: 0 0 30px; }
  .pd-ways a { padding-bottom: 3px; border-bottom: 1px solid ${T.ruleStrong}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
  .pd-ways a:hover { border-bottom-color: ${T.gold}; }
  .pd-accs { margin-top: 44px; border-top: 1px solid ${T.line}; }
  .pd-accitem { border-bottom: 1px solid ${T.line}; }
  .pd-acc { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 19px 0; cursor: pointer; background: transparent; border: 0; text-align: left; font-family: ${FONT_BODY}; font-size: 15px; color: ${T.text}; }
  .pd-row > .pd-acc { padding: 0; }
  .pd-plus { position: relative; flex: none; width: 13px; height: 13px; }
  .pd-plus::before, .pd-plus::after { content: ""; position: absolute; left: 0; top: 6px; width: 13px; height: 1px; background: ${T.text}; transition: transform 0.3s ease; }
  .pd-plus::after { transform: rotate(90deg); }
  .pd-acc[aria-expanded="true"] .pd-plus::after { transform: rotate(0deg); }
  .pd-accbody { display: none; padding: 0 0 22px; }
  .pd-row > .pd-accbody { padding: 14px 0 0; }
  .pd-accbody.is-open { display: block; }
  .pd-accbody p { margin: 0; max-width: 56ch; font-size: 14.5px; line-height: 1.75; color: ${T.text}; }
  .pd-spec { margin: 0; display: grid; grid-template-columns: 1fr; }
  .pd-spec > div { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; font-size: 14px; }
  .pd-spec > div:first-child { padding-top: 0; }
  .pd-spec dt { color: ${T.textMuted}; }
  .pd-spec dd { margin: 0; text-align: right; color: ${T.text}; }

  /* price bar */
  .pd-bar { display: none; position: sticky; bottom: 0; z-index: 30; margin-top: 28px; background: rgba(255,254,253,0.96); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid ${T.line}; }
  .pd-bar-in { display: flex; align-items: center; gap: 16px; padding: 14px 0 calc(14px + env(safe-area-inset-bottom)); }
  .pd-bar-sum { font-size: 12.5px; color: ${T.textMuted}; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pd-bar-price { font-size: 26px; }

  /* ── below the fold ── */
  .pd-story { border-top: 1px solid ${T.line}; padding: clamp(64px, 7vw, 112px) 0; }
  .pd-story-open { max-width: 660px; margin: 0 auto; text-align: center; }
  .pd-story-open .pd-h2 { margin-top: 18px; font-size: clamp(30px, 3.4vw, 48px); line-height: 1.12; }
  .pd-story-open p { margin: 18px 0 0; font-size: 16px; line-height: 1.8; color: ${T.text}; text-align: left; }
  .pd-story-open p.is-lead { margin-top: 26px; font-size: 18px; line-height: 1.75; text-align: center; }
  /* the catalogue entry: the specification as a grid of facts */
  .pd-catalogue { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 36px 24px; max-width: 1080px; margin: clamp(48px, 5.4vw, 76px) auto 0; text-align: center; }
  .pd-catalogue dt { font-size: 10.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.textMuted}; }
  .pd-catalogue dd { margin: 10px 0 0; font-family: ${FONT_DISPLAY}; font-size: 18px; line-height: 1.3; color: ${T.text}; overflow-wrap: anywhere; }
  .pd-catmore { margin-top: clamp(40px, 4.6vw, 64px); text-align: center; }
  .pd-catrest { display: none; max-width: 660px; margin: 30px auto 0; text-align: left; }
  .pd-catrest.is-open { display: block; animation: pdFade 0.5s ease; }
  .pd-catrest p { margin: 0 0 16px; font-size: 16px; line-height: 1.8; color: ${T.text}; }
  .pd-catrest p:last-child { margin-bottom: 0; }
  @media (max-width: 1000px) { .pd-catalogue { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .pd-catalogue { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 14px; } .pd-catalogue dd { font-size: 16.5px; } }
  /* chapters: titles down the left, the open one's text beside them */
  .pd-chapters { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); column-gap: clamp(32px, 6vw, 104px); max-width: 1040px; margin: clamp(48px, 5.4vw, 84px) auto 0; align-items: start; }
  .pd-chapter { display: contents; }
  .pd-chaptitle { grid-column: 1; display: flex; align-items: baseline; gap: 18px; padding: 11px 0; cursor: pointer; background: transparent; border: 0; text-align: left; font-family: ${FONT_DISPLAY}; font-size: clamp(19px, 1.8vw, 23px); line-height: 1.3; color: ${T.textMuted}; transition: color 0.3s ease; }
  .pd-chaptitle span { flex: none; width: 22px; font-family: ${FONT_BODY}; font-size: 11.5px; letter-spacing: 0.12em; color: ${T.textMuted}; font-variant-numeric: tabular-nums; transition: color 0.3s ease; }
  .pd-chaptitle:hover, .pd-chapter[data-on="1"] .pd-chaptitle { color: ${T.text}; }
  .pd-chapter[data-on="1"] .pd-chaptitle span { color: ${T.gold}; }
  .pd-chaptext { display: none; grid-column: 2; grid-row: 1 / span 12; padding-top: 12px; max-width: 58ch; }
  .pd-chapter[data-on="1"] .pd-chaptext { display: block; animation: pdFade 0.6s ease; }
  .pd-chaptext p { margin: 0 0 16px; font-size: 16px; line-height: 1.8; color: ${T.text}; }
  .pd-chaptext p.is-note { margin: 22px 0 0; font-size: 14.5px; line-height: 1.7; color: ${T.textMuted}; }
  .pd-chaptext > :last-child { margin-bottom: 0; }
  .pd-specs { margin: 0; display: grid; gap: 11px; }
  .pd-specs > div { display: grid; grid-template-columns: minmax(120px, 0.7fr) minmax(0, 1.3fr); gap: 18px; font-size: 15px; line-height: 1.55; }
  .pd-specs dt { color: ${T.textMuted}; }
  .pd-specs dd { margin: 0; color: ${T.text}; }
  .pd-chapters.is-one { grid-template-columns: minmax(0, 1fr); max-width: 660px; }
  .pd-chapters.is-one .pd-chaptitle { cursor: default; justify-content: center; color: ${T.text}; font-size: 11.5px; font-family: ${FONT_BODY}; letter-spacing: 0.2em; text-transform: uppercase; }
  .pd-chapters.is-one .pd-chaptitle span { display: none; }
  .pd-chapters.is-one .pd-chaptext { grid-column: 1; grid-row: auto; max-width: none; padding-top: 14px; }
  .pd-promise { background: ${T.sand}; padding: clamp(64px, 7vw, 112px) 0; text-align: center; }
  .pd-promise-open { max-width: 620px; margin: 0 auto; }
  .pd-promise-open .pd-h2 { margin-top: 18px; font-size: clamp(30px, 3.4vw, 48px); line-height: 1.12; }
  .pd-promise-open p { margin: 22px 0 0; font-size: 16px; line-height: 1.8; color: ${T.text}; }
  .pd-promise-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px clamp(20px, 3vw, 48px); max-width: 1120px; margin: clamp(48px, 5.4vw, 80px) auto 0; }
  .pd-promise-grid svg { display: block; margin: 0 auto; }
  .pd-promise-grid b { display: block; margin: 18px 0 8px; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 20px; line-height: 1.25; color: ${T.text}; }
  .pd-promise-grid p { margin: 0 auto; max-width: 26ch; font-size: 14.5px; line-height: 1.65; color: ${T.text}; }
  .pd-promise-acts { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px 34px; margin-top: clamp(40px, 4.4vw, 60px); }
  .pd-recs { padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(64px, 7vw, 112px); }
  .pd-recs { text-align: center; }
  .pd-recs .pd-rec-card { text-align: left; }
  .pd-recgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(28px, 3vw, 44px) clamp(12px, 1.6vw, 24px); margin-top: clamp(30px, 3.4vw, 48px); }
  .pd-rec-card { display: block; }
  .pd-rec-card > div { position: relative; aspect-ratio: 1 / 1.1; background: ${TILE}; overflow: hidden; }
  .pd-rec-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 9%; mix-blend-mode: multiply; transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
  .pd-rec-card:hover img { transform: scale(1.035); }
  .pd-rec-card p { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin: 14px 0 0; font-size: 14.5px; line-height: 1.45; color: ${T.text}; }
  .pd-rec-card p span:last-child { flex: none; }

  /* ── enlarged view ── */
  @keyframes pdFade { from { opacity: 0; } }
  .pd-lb { position: fixed; inset: 0; z-index: 300; display: flex; flex-direction: column; background: ${TILE}; animation: pdFade 0.3s ease; }
  .pd-lb-x { position: absolute; top: 14px; right: 14px; z-index: 2; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; border: 0; color: ${T.text}; }
  .pd-lb-stage { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 16px; }
  .pd-lb-stage img { max-width: 100%; max-height: 100%; object-fit: contain; mix-blend-mode: multiply; cursor: zoom-in; transition: transform 0.35s cubic-bezier(0.22,1,0.36,1); }
  .pd-lb-stage img[data-zoom="1"] { cursor: zoom-out; }
  .pd-lb-stage video { max-width: 100%; max-height: 100%; }
  .pd-lb-nav { display: flex; align-items: center; justify-content: center; gap: 26px; padding: 12px 16px calc(18px + env(safe-area-inset-bottom)); font-size: 12.5px; letter-spacing: 0.1em; color: ${T.text}; font-variant-numeric: tabular-nums; }
  .pd-lb-nav button { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; border: 1px solid ${T.line}; color: ${T.text}; transition: border-color 0.2s ease; }
  .pd-lb-nav button:hover { border-color: ${T.text}; }

  @media (max-width: 900px) {
    .pd-main { grid-template-columns: minmax(0, 1fr); }
    /* phone: the plate becomes a full-width square that swipes sideways through the views */
    .pd-plate { position: relative; top: auto; height: auto; min-height: 0; aspect-ratio: 1; }
    .pd-stage { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .pd-stage::-webkit-scrollbar { display: none; }
    .pd-slide { position: relative; inset: auto; flex: 0 0 100%; scroll-snap-align: center; opacity: 1; pointer-events: auto; transition: none; }
    .pd-slide img { padding: 4% 6% 40px; }
    .pd-index { left: auto; right: 8px; bottom: 6px; }
    .pd-index > div { display: none; }
    .pd-index .pd-enlarge { font-size: 10.5px; padding: 12px 10px; }
    .pd-dots { display: flex; justify-content: center; gap: 6px; position: absolute; left: 0; right: 0; bottom: 16px; pointer-events: none; }
    .pd-dots button { pointer-events: auto; width: 18px; height: 2px; padding: 0; border: 0; background: ${T.ruleStrong}; cursor: pointer; transition: background 0.2s ease; }
    .pd-dots button[data-on="1"] { background: ${T.gold}; }
    .pd-buy { padding: 0 ${PD_X}; }
    .pd-buy-in { max-width: none; }
    .pd-crumb { padding: 20px 0 18px; }
    /* on a phone the price bar is fixed to the bottom of the screen so it is never cut off */
    .pd-bar { display: block; position: fixed; left: 0; right: 0; bottom: 0; margin: 0; z-index: 55; }
    .pd-add { display: none; }
    .pd-bar-in { padding-left: ${PD_X}; padding-right: ${PD_X}; }
    .pd-bar-price { font-size: 22px; }
    .pd-buy { padding-bottom: 8px; }
    .pd { padding-bottom: 86px; }
    .pd-chapters { grid-template-columns: minmax(0, 1fr); }
    .pd-chaptext { grid-column: 1; grid-row: auto; padding: 4px 0 18px 40px; }
    .pd-chapters.is-one .pd-chaptext { padding-left: 0; }
    .pd-promise-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 16px; }
    .pd-recgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
    .pd-rec-card p { display: block; font-size: 14px; }
    .pd-rec-card p span:last-child { display: block; margin-top: 4px; }
  }
  @media (max-width: 560px) {
    .pd-disc { width: 52px; height: 52px; }
    .pd-disc.is-photo { width: 60px; height: 60px; }
    .pd-tray { gap: 12px 6px; }
    .pd-line.is-group > .pd-words, .pd-line.is-group > .pd-recline, .pd-line.is-group > .pd-size, .pd-line.is-group > .pd-helpline, .pd-line.is-group > .pd-sub { margin-left: 0; }
    .pd-line.is-group ~ .pd-line:not(.is-group) { padding-left: 0; }
    .pd-stephead h2 { font-size: 22px; }
    .pd-stone small { font-size: 10.5px; }
    .pd-bar .pd-btn { padding: 16px 22px; }
  }
  @media (prefers-reduced-motion: reduce) { .pd-lb, .pd-lb-stage img, .pd-slide { animation: none; transition: none; } }
`;

const ProductDetail = () => {
  const { productId } = useParams();
  const location = useLocation();
  const isEngagementRing = location.pathname.includes('engagement-ring');
  const [selectedMetal, setSelectedMetal] = useState('platinum');
  const [selectedMetalType, setSelectedMetalType] = useState('');
  const [variantKarat, setVariantKarat] = useState('');
  const [variantStone, setVariantStone] = useState('');
  const [variantColour, setVariantColour] = useState('Yellow gold');
  const [selectedDiamondSize, setSelectedDiamondSize] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState('L');
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { countryCode: userCountry, countryName: userCountryName } = useCountry();

  // Nivoda Stone Selection States
  const [selectedStoneType, setSelectedStoneType] = useState<'natural' | 'lab-grown'>('lab-grown');
  const [selectedCarat, setSelectedCarat] = useState('');
  const [selectedClarity, setSelectedClarity] = useState('');
  const [selectedColour, setSelectedColour] = useState('');
  const [selectedCut, setSelectedCut] = useState('');
  const [selectedPolish, setSelectedPolish] = useState('');
  const [selectedSymmetry, setSelectedSymmetry] = useState('');
  const [selectedFluorescence, setSelectedFluorescence] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState('');

  // Nivoda API price calculation
  const [nivodaPrice, setNivodaPrice] = useState<{ min: number; avg: number; max: number } | null>(null);
  const [nivodaPriceLoading, setNivodaPriceLoading] = useState(false);
  const [nivodaPriceError, setNivodaPriceError] = useState<string | null>(null);
  const [priceEstimated, setPriceEstimated] = useState(false); // indicative made-to-order price
  const [diamondAvailable, setDiamondAvailable] = useState(true); // false => exact diamond not in live Nivoda stock
  const [diamondSuggestions, setDiamondSuggestions] = useState<any[]>([]); // similar available stones
  const [chosenDiamond, setChosenDiamond] = useState<any>(null); // representative in-stock stone (for sourcing)

  const [expandedStoneOptions, setExpandedStoneOptions] = useState<{ [key: string]: boolean }>({
    stoneType: true,
    carat: true,
    clarity: true,
    colour: true,
    cut: true
  });

  // Use global cart context
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites(); // redesign: save heart beside the title
  const googleRating = useGoogleRating(); // live Google rating beside Add to bag, once set up
  const lightboxStep = useRef<(d: number) => void>();    // redesign: arrow keys in the enlarged view
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [playingTiles, setPlayingTiles] = useState<Record<number, boolean>>({});
  const mosaicRef = useRef<HTMLDivElement>(null); // mobile carousel scroller
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Custom video player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showVideoControls, setShowVideoControls] = useState(true);

  // Track if ViewContent pixel event has been fired
  const viewContentFired = useRef(false);

  // Helper function to check if file is video
  const isVideoFile = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  // Carousel swipe state
  const [carouselDragStart, setCarouselDragStart] = useState<number | null>(null);
  const [carouselDragOffset, setCarouselDragOffset] = useState(0);
  const [carouselDragging, setCarouselDragging] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    about: false,
    delivery: false,
    insurance: false,
    yourStone: true
  });

  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (sizeDropdownOpen && !target.closest('.size-dropdown-container')) {
        setSizeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sizeDropdownOpen]);

  // Redesign: while the enlarged view is open, hold the page still and listen for Escape / arrows.
  useEffect(() => {
    if (!isLightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsLightboxOpen(false); setZoomLevel(1); }
      if (e.key === 'ArrowRight') lightboxStep.current?.(1);
      if (e.key === 'ArrowLeft') lightboxStep.current?.(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey); };
  }, [isLightboxOpen]);

  // Helper function to filter images and videos by selected metal AND diamond size
  const getMetalSpecificMedia = (allImages: any[], selectedMetalId: string, selectedDiamondSizeId?: string) => {
    if (!allImages || allImages.length === 0) return [];

    // Films tied to a diamond size show ONLY when that size is selected; films with
    // no size (the normal turntable clips) always show. Metal is ignored for films.
    const videos = allImages.filter(img =>
      img.type === 'video' && (!img.diamond_size_id || img.diamond_size_id === selectedDiamondSizeId)
    );

    const stills = allImages.filter(img => img.type !== 'video');

    // Choose the most specific set of stills, always falling back so the gallery
    // never blanks out (e.g. a diamond size that has no photos of its own).
    let chosen: any[] = [];
    if (selectedDiamondSizeId && selectedMetalId)
      chosen = stills.filter(img => img.metal_id === selectedMetalId && img.diamond_size_id === selectedDiamondSizeId);
    if (chosen.length === 0 && selectedDiamondSizeId)
      chosen = stills.filter(img => img.diamond_size_id === selectedDiamondSizeId);        // this size, any metal
    if (chosen.length === 0 && selectedMetalId)
      chosen = stills.filter(img => img.metal_id === selectedMetalId);                     // this metal, any size
    if (chosen.length === 0) {
      const firstMetalId = stills.find(img => img.metal_id)?.metal_id;                     // first metal that has photos
      chosen = firstMetalId ? stills.filter(img => img.metal_id === firstMetalId) : stills;
    }
    return [...chosen, ...videos];
  };

  // Helper function to get the primary image for a specific metal
  const getMetalThumbnail = (metalId: string) => {
    if (!productData || !productData.images) return null;

    // First try to get metal-specific image marked as preview
    const metalPreviewImage = productData.images.find((img: any) => img.metal_id === metalId && img.is_metal_preview);
    if (metalPreviewImage) return metalPreviewImage;

    // Fall back to first metal-specific image for this metal (prefer non-diamond-size images)
    const metalGeneralImage = productData.images.find((img: any) => img.metal_id === metalId && !img.diamond_size_id);
    if (metalGeneralImage) return metalGeneralImage;

    // Fall back to first metal-specific image (including diamond size images)
    const metalAnyImage = productData.images.find((img: any) => img.metal_id === metalId);
    if (metalAnyImage) return metalAnyImage;

    // No metal-specific image found — return null so this metal is hidden from the thumbnail strip
    return null;
  };

  // Helper function to build stone options from nivoda_options_config
  // Now using ranges and available options instead of individual selections with adjustments
  const buildStoneOptions = () => {
    // Common carat weights available from Nivoda
    const allCarats = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 5.0, 10.0];

    if (!productData?.nivoda_enabled || !productData?.nivoda_options_config) {
      return {
        stoneType: [
          { value: 'natural', label: 'Natural' },
          { value: 'lab-grown', label: 'Lab-Grown' }
        ],
        carat: allCarats.map(c => ({ value: c.toFixed(2), label: `${c.toFixed(2)} ct` })),
        clarity: ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2'].map(c => ({ value: c, label: c })),
        colour: ['D','E','F','G','H','I','J','K'].map(c => ({ value: c, label: c })),
        cut: ['Excellent','Very Good','Good','Fair'].map(c => ({ value: c, label: c }))
      };
    }

    const config = productData.nivoda_options_config;
    const caratRange = config.caratRange || { min: 0.5, max: 2.0 };

    // Filter carats to only those within the configured range
    const caratOptions = allCarats.filter(c => c >= caratRange.min && c <= caratRange.max);

    return {
      stoneType: [
        { value: 'natural', label: 'Natural' },
        { value: 'lab-grown', label: 'Lab-Grown' }
      ],
      carat: caratOptions.map(c => ({
        value: c.toFixed(2),
        label: c.toFixed(2)
      })),
      clarity: (config.clarityOptions || []).map(c => ({
        value: c,
        label: c
      })),
      colour: (config.colourOptions || []).map(c => ({
        value: c,
        label: c
      })),
      cut: (config.cutOptions || []).map(c => ({
        value: c,
        label: c
      })),
      polish: (config.polishOptions || []).map(p => ({ value: p, label: p })),
      symmetry: (config.symmetryOptions || []).map(s => ({ value: s, label: s })),
      fluorescence: (config.fluorescenceOptions || []).map(f => ({
        value: f,
        label: f === 'NONE' ? 'None' : f === 'VERY_STRONG' ? 'Very Strong' : f.charAt(0) + f.slice(1).toLowerCase()
      })),
      certificate: (config.certificateOptions || []).map((c: string) => ({ value: c, label: c })),
    };
  };

  const stoneOptions = buildStoneOptions();

  // Fetch price from Nivoda API based on selected specs
  // Per-clarity diamond prices (for the "+£" deltas on the clarity cards). Fetched for
  // the current carat/colour/type; deltas are shown relative to the cheapest grade.
  const [clarityPrices, setClarityPrices] = useState<Record<string, number>>({});
  const fetchClarityDeltas = useCallback(async () => {
    if (!productData?.nivoda_enabled || !selectedCarat || !selectedColour) return;
    const config = productData.nivoda_options_config;
    const clarities: string[] = (config?.clarityOptions && config.clarityOptions.length ? config.clarityOptions : ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']);
    const shapeName = productData.stone_shapes?.[0]?.name;
    try {
      const results = await Promise.all(clarities.map(async (cl) => {
        try {
          const params = new URLSearchParams({ carat: selectedCarat, clarity: cl, color: selectedColour, stoneType: selectedStoneType });
          if (shapeName) params.set('shape', shapeName);
          const r = await fetch(`${API_BASE_URL}/nivoda/diamonds/price-suggestions?${params}`);
          const d = await r.json();
          return [cl, d?.data?.prices?.avg || 0] as [string, number];
        } catch { return [cl, 0] as [string, number]; }
      }));
      const map: Record<string, number> = {};
      results.forEach(([cl, avg]) => { if (avg > 0) map[cl] = avg; });
      setClarityPrices(map);
    } catch { /* ignore */ }
  }, [productData, selectedCarat, selectedColour, selectedStoneType]);
  useEffect(() => { fetchClarityDeltas(); }, [fetchClarityDeltas]);

  // Single source of truth for the gallery: the IMAGE metal always follows the selected
  // metal TYPE. However the type gets set (load, family/colour/carat pick), the photo
  // re-syncs here — so we can never show e.g. a white ring while "Yellow Gold" is chosen.
  // We only shoot three colours (white/yellow/rose); silver & platinum share the white render.
  useEffect(() => {
    if (!selectedMetalType) return;
    const imgs = productData?.images || [];
    if (!imgs.length) return;
    const metals = productData?.available_metals || [];
    const hasImgById = (id?: string) => !!id && imgs.some((img: any) => img.metal_id === id);
    const base = getMetalBase(selectedMetalType);
    const colour = (base === 'platinum' || base === 'silver' || base.includes('white')) ? 'white'
      : base.includes('yellow') ? 'yellow' : base.includes('rose') ? 'rose' : '';
    // Global metal ids (white/yellow/rose) so the gallery follows the chosen colour even
    // when available_metals is empty/incomplete — the images themselves carry metal_id.
    const COLOUR_METAL_ID: Record<string, string> = {
      white: '99297e85-1558-40e3-9e32-be59384da430',
      yellow: '39b04f2f-1d7f-442a-b1f6-dc355c7b5976',
      rose: '15d201d9-089b-43d8-9306-85f61971ae44',
    };
    const matchId =
      (colour ? metals.find((m: any) => (m.name || '').toLowerCase().includes(colour) && hasImgById(m.id))?.id : undefined) ||
      (colour && hasImgById(COLOUR_METAL_ID[colour]) ? COLOUR_METAL_ID[colour] : undefined) ||
      metals.find((m: any) => hasImgById(m.id))?.id ||
      imgs.find((i: any) => i.metal_id)?.metal_id ||
      metals[0]?.id;
    if (matchId && matchId !== selectedMetal) setSelectedMetal(matchId);
  }, [selectedMetalType, productData]);

  // Arriving from search with a metal intent (e.g. …?metal=yellow&karat=14ct): pre-select
  // that metal so the ring opens already switched to the searched option. Applied once,
  // after the product loads, and only to a metal the product actually offers.
  const appliedMetalParam = useRef(false);
  useEffect(() => {
    if (appliedMetalParam.current || !productData) return;
    const sp = new URLSearchParams(location.search);
    const metal = (sp.get('metal') || '').toLowerCase();
    const karat = (sp.get('karat') || '').toLowerCase();
    if (!metal) return;
    const overrides = productData.ring_price_overrides;
    const purchasable = (v: string) => { const opt = metalTypeOptions.find(m => m.value === v); return !!(opt && overrides?.[opt.overrideKey]); };
    let desired: string | undefined;
    if (metal === 'platinum' || metal === 'silver') { if (purchasable(metal)) desired = metal; }
    else if (['yellow', 'white', 'rose'].includes(metal)) {
      desired = [karat, '18ct', '14ct', '9ct'].filter(Boolean).map(k => `${k}-${metal}-gold`).find(purchasable);
    }
    if (desired) { setSelectedMetalType(desired); appliedMetalParam.current = true; }
  }, [productData, location.search]);

  // When the metal changes, keep the SAME angle/view the customer was looking at (the
  // renders are ordered by a consistent angle sequence across metals), only clamping if
  // the new metal happens to have fewer views. This is what makes switching metal show
  // the same angle rather than jumping back to the first shot.
  useEffect(() => {
    const media = getMetalSpecificMedia(productData?.images || [], selectedMetal, selectedDiamondSize);
    const len = Math.max(1, media.length);
    setCurrentImageIndex(i => {
      const clamped = Math.min(i, len - 1);
      const el = mosaicRef.current;
      if (el) el.scrollTo({ left: clamped * el.clientWidth, behavior: 'auto' });
      return clamped;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMetal]);

  // Colour grades we have diamond imagery for (D–H); the colour selector shows only these.
  const COLOUR_IMG = ['D', 'E', 'F', 'G', 'H'];

  const fetchNivodaPrice = useCallback(async (carat?: string, clarity?: string, colour?: string, cut?: string) => {
    if (!productData?.nivoda_enabled) return;
    if (!carat || !clarity || !colour) return; // cut is optional — many products have no cut options

    setNivodaPriceLoading(true);
    setNivodaPriceError(null);

    try {
      const config = productData.nivoda_options_config;
      const params = new URLSearchParams({ carat, clarity, color: colour });
      if (cut) params.set('cut', cut);

      params.set('stoneType', selectedStoneType);
      const shapeName = productData.stone_shapes?.[0]?.name;
      if (shapeName) params.set('shape', shapeName);
      if (selectedPolish) params.set('polish', selectedPolish);
      if (selectedSymmetry) params.set('symmetry', selectedSymmetry);
      if (selectedFluorescence) params.set('fluorescence', selectedFluorescence);
      // Use customer-selected cert if available, else fall back to all configured certs
      const certs = config?.certificateOptions || [];
      if (selectedCertificate) params.set('certificate', selectedCertificate);
      else if (certs.length) params.set('certificate', certs.join(','));

      const response = await fetch(`${API_BASE_URL}/nivoda/diamonds/price-suggestions?${params}`);
      const data = await response.json();

      if (data.success && data.data?.prices && data.data.prices.avg > 0) {
        // The server returns an exact live price where stock exists, otherwise an
        // indicative made-to-order price (data.estimated) — either way we always
        // show a price so the customer is never left at a dead end.
        setNivodaPrice(data.data.prices);
        setPriceEstimated(!!data.data.estimated);
        setDiamondAvailable(data.data.available !== false);
        setDiamondSuggestions(Array.isArray(data.data.suggestions) ? data.data.suggestions : []);
        setChosenDiamond(data.data.chosen || null);
        setNivodaPriceError(null);
      } else {
        // Truly nothing to price from — reassure rather than alarm.
        setNivodaPrice(null);
        setPriceEstimated(false);
        setDiamondAvailable(true);
        setDiamondSuggestions([]);
        setChosenDiamond(null);
        setNivodaPriceError('We hand-source this combination — contact us for a tailored quote.');
      }
    } catch (error) {
      console.error('Error fetching Nivoda price:', error);
      setNivodaPriceError('Error fetching price data');
    } finally {
      setNivodaPriceLoading(false);
    }
  }, [productData, selectedStoneType, selectedPolish, selectedSymmetry, selectedFluorescence, selectedCertificate]);

  // Mount price parsed from base_price field (the ring without diamond)
  const mountPrice = (() => {
    if (!productData?.price) return 0;
    return parseFloat(productData.price.replace(/[^\d.,]/g, '').replace(/,/g, '')) || 0;
  })();

  // Live price from ring price overrides based on selected metal type
  const liveMountPrice = (() => {
    const overrides = productData?.ring_price_overrides;
    if (!overrides || !selectedMetalType) return null;
    const opt = metalTypeOptions.find(m => m.value === selectedMetalType);
    if (!opt) return null;
    const v = overrides[opt.overrideKey];
    return v ? parseFloat(v) : null;
  })();

  // Priced options (bespoke pieces): one variant per metal karat × stone, each with its
  // own price. The cart carries the variant id so the server charges that exact price.
  const priceVariants: any[] = (productData?.variants || []).filter((v: any) => v.price != null && parseFloat(v.price) > 0);
  const variantKarats: string[] = Array.from(new Set(priceVariants.map((v: any) => v.metal_type).filter(Boolean)));
  const variantStones: string[] = Array.from(new Set(priceVariants.map((v: any) => v.gemstone_type).filter(Boolean)));
  const selectedVariant = priceVariants.find((v: any) => v.metal_type === variantKarat && (v.gemstone_type || '') === (variantStones.length ? variantStone : '')) || null;
  const variantPrice = (karat: string, stone: string) => {
    const v = priceVariants.find((x: any) => x.metal_type === karat && (x.gemstone_type || '') === stone);
    return v ? parseFloat(v.price) : null;
  };
  const variantMetalLabel = selectedVariant ? `${variantKarat} ${variantColour}`.trim() : '';

  // Calculate total price = mount price + diamond price
  const calculateTotalPrice = () => {
    if (selectedVariant) return parseFloat(selectedVariant.price);
    const base = liveMountPrice ?? mountPrice;
    if (productData?.nivoda_enabled && nivodaPrice) {
      return base + nivodaPrice.avg;
    }
    return base;
  };

  // Display price for non-Nivoda products (updates when metal type changes)
  const displayPrice = (() => {
    if (liveMountPrice !== null) {
      return `£${liveMountPrice.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return productData?.price || '';
  })();

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const data = await response.json();

        if (data.success) {
          setProductData(data.data.product);
          setRecommendedProducts(data.data.recommended_products || []);

          // Priced options: start on the cheapest combination.
          const priced = (data.data.product.variants || []).filter((v: any) => v.price != null && parseFloat(v.price) > 0);
          if (priced.length) {
            const cheapest = priced.reduce((a: any, b: any) => (parseFloat(b.price) < parseFloat(a.price) ? b : a));
            setVariantKarat(cheapest.metal_type || '');
            setVariantStone(cheapest.gemstone_type || '');
          }

          // Choose the default metal TYPE first (price/selector) — prefer 18ct white gold,
          // then fall back through the other karats/colours that actually have a price.
          const overrides = data.data.product.ring_price_overrides;
          let defaultType = '';
          if (overrides) {
            const preferred = ['18ct-white-gold', '18ct-yellow-gold', '18ct-rose-gold', '14ct-white-gold', '14ct-yellow-gold', '14ct-rose-gold', '9ct-white-gold', '9ct-yellow-gold', '9ct-rose-gold', 'platinum', 'silver'];
            defaultType = preferred.find(v => { const opt = metalTypeOptions.find(m => m.value === v); return opt && overrides[opt.overrideKey]; }) || '';
            if (defaultType) setSelectedMetalType(defaultType);
          }

          // Sync the initial IMAGE metal to that default type's colour, so the photo shown
          // matches the selected metal (silver/platinum share the white-gold render). Fall
          // back to any metal that has images, then the first metal.
          if (data.data.product.available_metals && data.data.product.available_metals.length > 0) {
            const imgs = data.data.product.images || [];
            const hasImg = (m: any) => imgs.some((img: any) => img.metal_id === m.id);
            const base = getMetalBase(defaultType); // white-gold | yellow-gold | rose-gold | platinum | silver
            const colour = (base === 'platinum' || base === 'silver' || base.includes('white')) ? 'white' : base.includes('yellow') ? 'yellow' : base.includes('rose') ? 'rose' : '';
            const match =
              (colour && data.data.product.available_metals.find((m: any) => (m.name || '').toLowerCase().includes(colour) && hasImg(m))) ||
              data.data.product.available_metals.find((m: any) => hasImg(m)) ||
              data.data.product.available_metals[0];
            if (match) setSelectedMetal(match.id);
          }

          // Set initial diamond size selection to first available diamond size (for Engagement Rings)
          if (data.data.product.available_diamond_sizes && data.data.product.available_diamond_sizes.length > 0) {
            setSelectedDiamondSize(data.data.product.available_diamond_sizes[0].id);
          }
        } else {
          setError(data.message || 'Failed to fetch product');
        }
      } catch (err) {
        setError('Failed to fetch product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  // Initialize stone options with default selections when product loads
  useEffect(() => {
    if (!productData) return;

    const config = productData.nivoda_options_config;
    const defaults = config?.defaultSpecs;

    if (productData.nivoda_enabled && config) {
      // Business default: engagement rings default to Lab-Grown. Honor the
      // per-product config only when it explicitly specifies lab-grown; otherwise
      // (all current products are configured "natural") default to lab-grown.
      setSelectedStoneType(config.stoneType === 'natural' ? 'lab-grown' : (config.stoneType || 'lab-grown'));

      // Prefer admin-configured defaultSpecs, fall back to first/middle option
      const carat = defaults?.carat || (config.caratRange
        ? config.caratRange.min.toFixed(2)
        : '');
      if (carat) setSelectedCarat(carat);

      // Recommended spec by stone type: lab-grown → E / VVS1, natural → G / VS2.
      // The default view is lab-grown, so it opens on the recommended E / VVS1.
      const isLab = (config.stoneType === 'natural' ? 'lab-grown' : (config.stoneType || 'lab-grown')) === 'lab-grown';
      const recClarity = isLab ? 'VVS1' : 'VS2';
      const recColour = isLab ? 'E' : 'G';
      const mid = (arr: string[] | undefined) => arr?.[Math.floor(((arr?.length || 1) - 1) / 2)] ?? '';
      const clarity = (config.clarityOptions?.includes(recClarity) ? recClarity : (defaults?.clarity || mid(config.clarityOptions)));
      if (clarity) setSelectedClarity(clarity);

      const colour = (config.colourOptions?.includes(recColour) ? recColour : (defaults?.colour || mid(config.colourOptions)));
      if (colour) setSelectedColour(colour);

      const cut = defaults?.cut || (config.cutOptions?.[0] ?? '');
      if (cut) setSelectedCut(cut);

      const polish = (defaults as any)?.polish || (config.polishOptions?.[0] ?? '');
      if (polish) setSelectedPolish(polish);
      const symmetry = (defaults as any)?.symmetry || (config.symmetryOptions?.[0] ?? '');
      if (symmetry) setSelectedSymmetry(symmetry);
      const fluorescence = (defaults as any)?.fluorescence || (config.fluorescenceOptions?.[0] ?? '');
      if (fluorescence) setSelectedFluorescence(fluorescence);
    } else if (isEngagementRing) {
      // Non-Nivoda engagement ring: initialise with lowest-cost defaults so section isn't blank
      setSelectedCarat('0.50');
      setSelectedClarity('SI2');
      setSelectedColour('J');
      setSelectedCut('Good');
    }
  }, [productData?.id, productData?.nivoda_enabled, isEngagementRing]);

  // Fetch price when any selection changes — cut is optional (may not be configured)
  useEffect(() => {
    if (productData?.nivoda_enabled && selectedCarat && selectedClarity && selectedColour) {
      fetchNivodaPrice(selectedCarat, selectedClarity, selectedColour, selectedCut || undefined);
    }
  }, [selectedCarat, selectedClarity, selectedColour, selectedCut, selectedPolish, selectedSymmetry, selectedFluorescence, selectedCertificate, selectedStoneType, productData?.nivoda_enabled, fetchNivodaPrice]);

  // Facebook Pixel: Track ViewContent when product loads
  useEffect(() => {
    if (productData && !viewContentFired.current) {
      // Parse price value from string (e.g., "£2,500" -> 2500)
      const priceString = productData.price?.replace(/[^\d.,]/g, '').replace(/,/g, '') || '0';
      const priceValue = parseFloat(priceString) || 0;

      trackViewContent({
        content_name: productData.name,
        content_ids: [productData.id],
        content_type: 'product',
        value: priceValue,
        currency: 'GBP',
      });

      viewContentFired.current = true;
    }
  }, [productData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleStoneOption = (option: string) => {
    setExpandedStoneOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Handler functions for setting stone options
  // Price is calculated dynamically from Nivoda API when selections change
  const handleCaratSelect = (value: string) => {
    setSelectedCarat(value);
  };

  const handleClaritySelect = (value: string) => {
    setSelectedClarity(value);
  };

  const handleColourSelect = (value: string) => {
    setSelectedColour(value);
  };

  const handleCutSelect = (value: string) => {
    setSelectedCut(value);
  };

  const handleStoneTypeSelect = (value: 'natural' | 'lab-grown') => {
    setSelectedStoneType(value);
  };

  const handlePolishSelect = (value: string) => setSelectedPolish(value);
  const handleSymmetrySelect = (value: string) => setSelectedSymmetry(value);
  const handleFluorescenceSelect = (value: string) => setSelectedFluorescence(value);

  const handleAddToCart = () => {
    // Start loading animation
    setIsLoading(true);

    // Simulate adding to cart process
    setTimeout(() => {
      // The metal the customer actually chose and is paying for (the priced metal option),
      // else the product's own metal. Never a guessed default: this is what the order
      // tells the workshop to make.
      const selectedMetalName = variantMetalLabel
        || metalTypeOptions.find(m => m.value === selectedMetalType)?.label
        || productData?.available_metals?.find((metal: any) => metal.id === selectedMetal)?.name
        || null;

      // Ring size only applies to rings (/ring/i also matches "Earrings").
      const categoryName = productData?.category?.name || '';
      const isRingProduct = /ring/i.test(categoryName) && !/earring/i.test(categoryName);
      const selectedSizeLabel = isRingProduct
        ? (ringSizes.find((size) => size.value === selectedSize)?.label || selectedSize || null)
        : null;

      // Get diamond size name if selected
      const selectedDiamondSizeName = productData?.available_diamond_sizes?.find(
        (ds: any) => ds.id === selectedDiamondSize
      )?.name || null;

      // Build selected options object with all customizations
      const selectedOptions: any = {
        metal: selectedMetalName,
        size: selectedSizeLabel
      };

      if (selectedDiamondSizeName) {
        selectedOptions.diamondSize = selectedDiamondSizeName;
      }
      if (selectedVariant) {
        selectedOptions.variantId = selectedVariant.id;
        if (selectedVariant.gemstone_type) selectedOptions.stone = selectedVariant.gemstone_type;
      }

      // Include Nivoda stone options if enabled
      if (productData?.nivoda_enabled) {
        selectedOptions.stoneType = selectedStoneType;
        selectedOptions.carat = selectedCarat;
        selectedOptions.clarity = selectedClarity;
        selectedOptions.colour = selectedColour;
        selectedOptions.cut = selectedCut;
        const shapeName = productData.stone_shapes?.[0]?.name;
        if (shapeName) selectedOptions.shape = shapeName;
        // The specific in-stock Nivoda stone the price is based on — so the owner can
        // source it from Nivoda after purchase (null when made-to-order / not in stock).
        if (chosenDiamond) selectedOptions.nivodaDiamond = {
          nivodaId: chosenDiamond.nivodaId, certNumber: chosenDiamond.certNumber, lab: chosenDiamond.lab,
          shape: chosenDiamond.shape, carat: chosenDiamond.carat, color: chosenDiamond.color,
          clarity: chosenDiamond.clarity, cut: chosenDiamond.cut,
        };
      }

      // Persist the exact pricing key so the server can authoritatively re-verify the
      // mount price for this configuration (used by the payment amount guard).
      const priceOpt = metalTypeOptions.find(m => m.value === selectedMetalType);
      if (priceOpt) selectedOptions.priceKey = priceOpt.overrideKey;

      const imageUrl = displayImages[0]?.url || productData.images[0]?.url;

      // Use the fully calculated price (mount + diamond) as the cart price
      const cartPrice = calculateTotalPrice();

      const newItem: any = {
        id: productData.id,
        slug: productData.slug,
        name: productData.name,
        price: cartPrice,
        metal: selectedMetalName,
        size: selectedSizeLabel,
        diamondSize: selectedDiamondSizeName,
        image: imageUrl ? getMediaUrl(imageUrl) : '',
        type: 'jewelry',
        productUrl: location.pathname,
        liveStock: !!productData.is_live_stock,
        selectedOptions: selectedOptions
      };
      // The server charges this variant's stored price, so the amount can't be tampered with.
      if (selectedVariant) newItem.variant_id = selectedVariant.id;

      // Include Nivoda price breakdown for reference
      if (productData?.nivoda_enabled) {
        newItem.nivodaPrice = nivodaPrice;
        newItem.totalPrice = cartPrice;
      }

      // Calculate price for pixel tracking
      const priceForTracking = productData?.nivoda_enabled && nivodaPrice
        ? nivodaPrice.avg
        : parseFloat(productData.price?.replace(/[^\d.,]/g, '').replace(/,/g, '') || '0');

      // Facebook Pixel: Track AddToCart event
      trackAddToCart({
        content_name: productData.name,
        content_ids: [productData.id],
        content_type: 'product',
        value: priceForTracking,
        currency: 'GBP',
        contents: [{
          id: productData.id,
          quantity: 1,
          item_price: priceForTracking,
        }],
      });

      addToCart(newItem);
      setIsLoading(false);
    }, 1500); // 1.5 second loading animation
  };


  const nextImage = () => {
    if (!productData || !displayImages || displayImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    if (!productData || !displayImages || displayImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Mobile carousel: track the active slide from scroll, and step with the arrow.
  const onMosaicScroll = () => { const el = mosaicRef.current; if (!el || el.scrollWidth <= el.clientWidth + 4) return; setCurrentImageIndex(Math.round(el.scrollLeft / el.clientWidth)); };
  const goToSlide = (i: number) => { const el = mosaicRef.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); };

  const openLightbox = (imageIndex: number) => {
    setLightboxImageIndex(imageIndex);
    setIsLightboxOpen(true);
    setZoomLevel(1);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoomLevel(1);
  };

  // Video player control functions
  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleVideoSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const goToLightboxImage = (index: number) => {
    setLightboxImageIndex(index);
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const nextRecommendation = () => {
    setCurrentRecommendationIndex(prev => 
      prev + 4 >= recommendedProducts.length ? 0 : prev + 4
    );
  };

  const prevRecommendation = () => {
    setCurrentRecommendationIndex(prev => 
      prev === 0 ? Math.max(0, recommendedProducts.length - 4) : prev - 4
    );
  };

  // Touch handlers for swipe functionality (recommendations)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextRecommendation();
    if (distance < -50) prevRecommendation();
  };

  // Carousel swipe handlers
  const handleCarouselTouchStart = (e: React.TouchEvent) => {
    setCarouselDragStart(e.targetTouches[0].clientX);
    setCarouselDragOffset(0);
    setCarouselDragging(true);
  };

  const handleCarouselTouchMove = (e: React.TouchEvent) => {
    if (carouselDragStart === null) return;
    setCarouselDragOffset(e.targetTouches[0].clientX - carouselDragStart);
  };

  const handleCarouselTouchEnd = () => {
    if (carouselDragOffset < -50) nextImage();
    else if (carouselDragOffset > 50) prevImage();
    setCarouselDragOffset(0);
    setCarouselDragStart(null);
    setCarouselDragging(false);
  };

  // Sync metal thumbnail → metal type (price)
  const handleMetalThumbnailClick = (metalId: string) => {
    setSelectedMetal(metalId);
    const metal = productData?.available_metals?.find((m: any) => m.id === metalId);
    if (!metal) return;
    const overrides = productData?.ring_price_overrides;
    if (!overrides) return;
    const nameLower = (metal.name || '').toLowerCase();
    let color: string | null = null;
    if (nameLower.includes('yellow')) color = 'yellow';
    else if (nameLower.includes('rose')) color = 'rose';
    else if (nameLower.includes('white')) color = 'white';
    let newValue: string | null = null;
    if (nameLower === 'silver') {
      newValue = 'silver';
    } else if (nameLower === 'platinum') {
      newValue = 'platinum';
    } else if (color) {
      // Keep same karat, swap color
      const currentOpt = metalTypeOptions.find(m => m.value === selectedMetalType);
      const karat = currentOpt?.value.replace(/-white-gold|-yellow-gold|-rose-gold/, '') || '18ct';
      const candidate = `${karat}-${color}-gold`;
      const candidateOpt = metalTypeOptions.find(m => m.value === candidate);
      if (candidateOpt && overrides[candidateOpt.overrideKey]) {
        newValue = candidate;
      } else {
        // Fall back to any option for this color that has a price
        const fallback = metalTypeOptions.find(m => m.value.includes(`-${color}-gold`) && overrides[m.overrideKey]);
        newValue = fallback?.value || null;
      }
    }
    if (newValue) setSelectedMetalType(newValue);
  };

  // Sync metal type button → gallery image. We only shoot renders for three metal
  // colours (yellow / rose / white), so every pricing option maps to the nearest
  // colour we have a photo of: silver and platinum share the white-gold render
  // (visually identical), and if the exact colour has no image we still land on a
  // metal that does — the gallery never blanks out.
  const handleMetalTypeClick = (value: string) => {
    setSelectedMetalType(value);
    const metals = productData?.available_metals;
    if (!metals || metals.length === 0) return;

    let colorKeywords: string[];
    if (value.includes('yellow')) colorKeywords = ['yellow'];
    else if (value.includes('rose')) colorKeywords = ['rose'];
    else if (value.includes('white')) colorKeywords = ['white'];
    else if (value === 'silver' || value === 'platinum') colorKeywords = ['white', 'platinum', 'silver'];
    else return;

    const hasImage = (m: any) => !!getMetalThumbnail(m.id);
    const nameHits = (m: any) => colorKeywords.some(k => (m.name || '').toLowerCase().includes(k));
    const match =
      metals.find((m: any) => nameHits(m) && hasImage(m)) ||   // exact colour with a photo
      metals.find((m: any) => nameHits(m)) ||                  // exact colour (any)
      metals.find((m: any) => hasImage(m)) ||                  // any metal that has a photo
      metals[0];
    if (match) setSelectedMetal(match.id);
  };

  // Static fallback data will be replaced by API data
  // const staticProductData = { ... }; // Removed - using dynamic productData from API

  // Loading, error and not-found, in the site's own navigation and footer (redesign).
  const stateShell = (children: React.ReactNode) => (
    <div style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: '100vh', paddingTop: 'var(--v2nav-h, 113px)' }}>
      <style>{`@keyframes pdSpin { to { transform: rotate(360deg); } }`}</style>
      <NavigationV2 solid />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: 'clamp(72px, 14vh, 160px) 24px clamp(88px, 14vw, 180px)', textAlign: 'center' }}>{children}</div>
      <FooterV2 />
    </div>
  );
  const stateTitle: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(30px, 3.6vw, 44px)', lineHeight: 1.12, margin: 0, color: T.text };
  const stateBtn: React.CSSProperties = { display: 'inline-block', marginTop: 28, padding: '16px 30px', background: T.ink, color: T.cream, border: 0, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none' };

  // Handle loading state
  if (loading) {
    return stateShell(
      <>
        <span style={{ display: 'block', width: 26, height: 26, margin: '0 auto 24px', borderRadius: '50%', border: `1px solid ${T.line}`, borderTopColor: T.gold, animation: 'pdSpin 0.9s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Loading the piece</p>
      </>
    );
  }

  // Handle error state
  if (error) {
    return stateShell(
      <>
        <h1 style={stateTitle}>We couldn’t load this piece.</h1>
        <p role="alert" style={{ margin: '18px 0 0', fontSize: 15.5, lineHeight: 1.8 }}>{error}</p>
        <button type="button" onClick={() => window.location.reload()} style={stateBtn}>Try again</button>
      </>
    );
  }

  // Handle case where product not found
  if (!productData) {
    return stateShell(
      <>
        <h1 style={stateTitle}>We couldn’t find that piece.</h1>
        <Link to="/rings" style={stateBtn}>Back to rings</Link>
      </>
    );
  }

  // Get filtered images and videos based on selected metal
  const displayImages = productData ? getMetalSpecificMedia(productData.images || [], selectedMetal, selectedDiamondSize || undefined) : [];

  const NAV_H = 96;
  const money = (n: number) => '£' + Math.round(n || 0).toLocaleString('en-GB');
  // Ring-only UI (size selector, ring-size spec) is shown only for ring categories.
  // Earrings / necklaces / bracelets reuse this template without the ring size step.
  // NB: /ring/i matches "Earrings" too, so earrings were wrongly getting the ring-size step — exclude them.
  const isRingCat = /ring/i.test(productData.category?.name || '') && !/earring/i.test(productData.category?.name || '');
  const priceOverrides = productData?.ring_price_overrides;
  const purchasableMetals = priceOverrides ? metalTypeOptions.filter(o => priceOverrides[o.overrideKey]) : [];
  const metalDot = (v: string) => v.includes('yellow') ? '#E6C15A' : v.includes('rose') ? '#DCA79A' : v.includes('white') ? '#E5E4E2' : v === 'platinum' ? '#E5E4E2' : v === 'silver' ? '#C7C7C7' : '#D8D2C6';
  // Organise the purchasable metals into tidy rows: base metals (silver / platinum)
  // first, then each gold karat with its colours. Inside a karat group the label
  // drops the karat prefix (the caption carries it) so the pills read cleanly.
  const metalGroups: { key: string; caption: string; options: { value: string; label: string }[] }[] = (() => {
    const groups: { key: string; caption: string; options: { value: string; label: string }[] }[] = [];
    const base = purchasableMetals.filter(o => o.value === 'silver' || o.value === 'platinum');
    if (base.length) groups.push({ key: 'base', caption: '', options: base.map(o => ({ value: o.value, label: o.label })) });
    ['9ct', '14ct', '18ct'].forEach(k => {
      const opts = purchasableMetals.filter(o => o.value.startsWith(k));
      if (opts.length) groups.push({ key: k, caption: `${k} gold`, options: opts.map(o => ({ value: o.value, label: o.label.replace(`${k} `, '') })) });
    });
    return groups;
  })();
  const totalPrice = calculateTotalPrice();
  const isVid = (m: any) => !!m && (m.type === 'video' || isVideoFile(m.url));
  // Gallery = up to 5 stills, then EVERY film. Films are appended last in
  // displayImages, so on a product with many metal renders a plain slice(0,5)
  // dropped them off the end and they never showed. Keep them explicitly.
  const media = (() => {
    const src = displayImages || [];
    const stills = src.filter((m: any) => !isVid(m)).slice(0, 5);
    const films = src.filter(isVid);
    return [...stills, ...films];
  })();
  const activeMedia = media[currentImageIndex] || media[0];
  const gallery = media;
  const angleLabels = ['Three-quarter', 'Top', 'Front', 'Profile', 'Detail'];
  const chip = (on: boolean): React.CSSProperties => ({ padding: '9px 14px', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12.5, border: `1px solid ${on ? T.ink : T.ruleSoft}`, background: on ? T.ink : '#FFFFFF', color: on ? T.paper : T.body });
  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gold };
  const stepLabel: React.CSSProperties = { fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 14 };
  const subLabel: React.CSSProperties = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, margin: '4px 0 8px' };
  const metalName = variantMetalLabel || productData?.available_metals?.find((m: any) => m.id === selectedMetal)?.name || (metalTypeOptions.find(m => m.value === selectedMetalType)?.label) || '';
  const sizeLabel = ringSizes.find(s => s.value === selectedSize)?.label || selectedSize;
  const diamondName = productData?.available_diamond_sizes?.find((d: any) => d.id === selectedDiamondSize)?.display_name || productData?.available_diamond_sizes?.find((d: any) => d.id === selectedDiamondSize)?.name || '';
  const configSummary = [metalTypeOptions.find(m => m.value === selectedMetalType)?.label || metalName, isRingCat && selectedSize && ('Size ' + selectedSize), productData?.nivoda_enabled && selectedCarat && (selectedCarat + 'ct ' + selectedColour + ' ' + selectedClarity), selectedVariant?.gemstone_type].filter(Boolean).join('  ·  ');
  // Recommended centre-diamond spec by stone type: lab-grown → E / VVS1, natural → G / VS2.
  const recColour = selectedStoneType === 'natural' ? 'G' : 'E';
  const recClarity = selectedStoneType === 'natural' ? 'VS2' : 'VVS1';
  const useRecommendation = () => { handleStoneTypeSelect('lab-grown'); handleCaratSelect('1.00'); handleColourSelect('E'); handleClaritySelect('VVS1'); };
  // Switch the customer's spec to a similar AVAILABLE stone (from the suggestions list).
  const applySuggestion = (s: any) => {
    if (s?.carat != null) handleCaratSelect(Number(s.carat).toFixed(2));
    if (s?.color) handleColourSelect(s.color);
    if (s?.clarity) handleClaritySelect(s.clarity);
    if (s?.cut) setSelectedCut(s.cut);
  };
  // Round-brilliant diamond illustration; inclusion dots increase as clarity drops.
  const CLARITY_INCL: Record<string, number> = { FL: 0, IF: 0, VVS1: 1, VVS2: 2, VS1: 3, VS2: 4, SI1: 7, SI2: 9, I1: 12, I2: 15 };
  // Relative clarity price multipliers (VS2 = 1.00 baseline), tuned to real Nivoda
  // ratios. Used to derive a clean, complete, monotonic clarity delta from the live
  // price of the SELECTED stone — so every grade shows a sensible figure even where
  // live per-grade stock is thin (e.g. lab-grown) and would otherwise read blank.
  const CLARITY_MULT: Record<string, number> = { FL: 1.36, IF: 1.24, VVS1: 1.15, VVS2: 1.08, VS1: 1.05, VS2: 1.00, SI1: 0.90, SI2: 0.82, I1: 0.70, I2: 0.62 };
  const DiamondIcon = ({ grade }: { grade: string }) => {
    const inclusions = CLARITY_INCL[grade] ?? 3;
    const isIF = grade === 'IF'; // Internally Flawless — clean inside, one tiny surface blemish at the edge
    const c = 50, Rg = 46, rA = 36, rt = 15, g = '#C6A24C';
    const A = (d: number) => (Math.PI / 180) * d;
    const P = (r: number, d: number): [number, number] => [+(c + r * Math.cos(A(d))).toFixed(2), +(c + r * Math.sin(A(d))).toFixed(2)];
    const tv = Array.from({ length: 8 }, (_, i) => P(rt, i * 45));        // table vertices (main dirs)
    const kite = Array.from({ length: 8 }, (_, i) => P(rA, i * 45));      // crown ring at main dirs
    const star = Array.from({ length: 8 }, (_, i) => P(rA, i * 45 + 22.5)); // crown ring at half dirs
    const crown16: [number, number][] = [];
    for (let i = 0; i < 8; i++) { crown16.push(kite[i]); crown16.push(star[i]); }
    const lines: [[number, number], [number, number]][] = [];
    for (let i = 0; i < 8; i++) {
      lines.push([tv[i], kite[i]]);            // kite ridge (table corner → girdle)
      lines.push([tv[i], star[i]]);            // kite side +
      lines.push([tv[i], star[(i + 7) % 8]]);  // kite side −
    }
    // Imperfection marks — a spread of dots and tiny "feather" lines so grades read at a glance.
    const marks: { x: number; y: number; t: 'dot' | 'line'; s?: number; a?: number }[] = [
      { x: 46, y: 47, t: 'dot', s: 2.3 }, { x: 57, y: 43, t: 'line', a: 35 }, { x: 50, y: 58, t: 'dot', s: 2 },
      { x: 41, y: 52, t: 'dot', s: 1.9 }, { x: 59, y: 54, t: 'line', a: -20 }, { x: 48, y: 41, t: 'dot', s: 2.2 },
      { x: 55, y: 50, t: 'dot', s: 1.8 }, { x: 43, y: 60, t: 'line', a: 60 }, { x: 61, y: 47, t: 'dot', s: 2 },
      { x: 39, y: 46, t: 'dot', s: 1.9 }, { x: 52, y: 62, t: 'line', a: 10 }, { x: 45, y: 55, t: 'dot', s: 2.1 },
      { x: 58, y: 60, t: 'dot', s: 1.8 }, { x: 50, y: 38, t: 'line', a: 80 }, { x: 36, y: 55, t: 'dot', s: 2 },
    ];
    const ink = '#3D3A36';
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden="true">
        <circle cx={c} cy={c} r={Rg} fill="#FFFFFF" stroke={g} strokeWidth="1.4" />
        {crown16.map((p, i) => { const o = P(Rg, i * 22.5); return <line key={'g' + i} x1={p[0]} y1={p[1]} x2={o[0]} y2={o[1]} stroke={g} strokeWidth="0.6" opacity="0.8" />; })}
        <polygon points={crown16.map(p => p.join(',')).join(' ')} fill="none" stroke={g} strokeWidth="0.9" opacity="0.9" />
        {lines.map((l, i) => <line key={'l' + i} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke={g} strokeWidth="0.7" opacity="0.85" />)}
        <polygon points={tv.map(p => p.join(',')).join(' ')} fill="none" stroke={g} strokeWidth="1" opacity="0.9" />
        {isIF && <circle cx={66} cy={38} r={1.7} fill="none" stroke={ink} strokeWidth="1.1" />}
        {marks.slice(0, inclusions).map((m, i) => m.t === 'dot'
          ? <circle key={'i' + i} cx={m.x} cy={m.y} r={m.s || 2} fill={ink} />
          : <line key={'i' + i} x1={m.x - 2.6 * Math.cos((m.a || 0) * Math.PI / 180)} y1={m.y - 2.6 * Math.sin((m.a || 0) * Math.PI / 180)} x2={m.x + 2.6 * Math.cos((m.a || 0) * Math.PI / 180)} y2={m.y + 2.6 * Math.sin((m.a || 0) * Math.PI / 180)} stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
        )}
      </svg>
    );
  };

  // ---- Render (light redesign, Nov 2026). Everything above this line is the page's
  // existing logic, unchanged apart from the three additions marked "redesign". ----
  // Metal colours, drawn as polished metal: a soft highlight top-left over a light-to-shadow sweep.
  const SW = { white: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 42%), linear-gradient(135deg, #F6F4EF 0%, #DEDBD3 38%, #BDB9AF 68%, #DEDBD3 100%)', yellow: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 42%), linear-gradient(135deg, #FBEBB8 0%, #E6C063 38%, #B98B30 68%, #E6C063 100%)', rose: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 42%), linear-gradient(135deg, #F9DFD2 0%, #E3AE95 38%, #BE826A 68%, #E3AE95 100%)', plat: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 42%), linear-gradient(135deg, #F3F5F7 0%, #D2D7DC 38%, #A9B0B8 68%, #D2D7DC 100%)', silver: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 42%), linear-gradient(135deg, #FCFCFC 0%, #D9D9D9 38%, #A8A8A8 68%, #D9D9D9 100%)' };
  // "Metal: 18ct White Gold" — the name of the choice and what is chosen, on one line.
  const lineHead = (name: string, value?: React.ReactNode, key?: string) => (
    <div className="pd-linehead"><span className="pd-linename">{name}{value ? <>: <b data-valfor={key}>{value}</b></> : null}</span></div>
  );
  // The ring pictured in a given metal colour (white / yellow / rose), if it has been shot.
  const COLOUR_ID: Record<string, string> = { white: '99297e85-1558-40e3-9e32-be59384da430', yellow: '39b04f2f-1d7f-442a-b1f6-dc355c7b5976', rose: '15d201d9-089b-43d8-9306-85f61971ae44' };
  const metalPicture = (colour: string): string | undefined => {
    const stills = (productData.images || []).filter((im: any) => im.type !== 'video' && im.metal_id);
    const named = (productData.available_metals || []).find((m: any) => (m.name || '').toLowerCase().includes(colour) && stills.some((im: any) => im.metal_id === m.id));
    const id = named?.id || COLOUR_ID[colour];
    return stills.find((im: any) => im.metal_id === id)?.url;
  };
  // A metal to pick: the piece itself in that metal where we have the picture, else its colour.
  const medal = (key: string, group: string, on: boolean, onClick: () => void, label: string, picture: string | undefined, swatch: string, caption?: string, offered = true) => (
    <button key={key} type="button" role="radio" aria-checked={on} aria-label={offered ? label : `${label}, not offered for this piece`} title={offered ? label : 'Not offered for this piece'} data-radio={group} data-name={label} className="pd-stone" disabled={!offered} data-off={offered ? undefined : '1'} onClick={onClick}>
      <span className={`pd-disc${picture ? ' is-photo' : ''}`}>{picture ? <img src={getMediaUrl(picture)} alt="" loading="lazy" /> : <span className="pd-metal" style={{ background: swatch }} />}</span>
      {caption && <b>{caption}</b>}
    </button>
  );
  // A numbered step: the order the choices are made in, with the current choice on the right.
  let stepNo = 0;
  const stepHead = (name: string, value?: React.ReactNode) => (
    <div className="pd-stephead"><span className="pd-stepn">{++stepNo}</span><h2>{name}</h2><span className="pd-lineval">{value}</span></div>
  );
  const stepNames = [
    (priceVariants.length > 0 || purchasableMetals.length > 0 || (productData.available_metals || []).length > 0) && 'metal',
    priceVariants.length > 0 && variantStones.length > 0 && 'stone',
    productData.nivoda_enabled && 'diamond',
    isRingCat && 'ring size',
  ].filter(Boolean) as string[];
  const stepWords = ['', 'One choice', 'Two choices', 'Three choices', 'Four choices'];
  const tick = <svg className="pd-tick" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.4" /></svg>;
  // A choice set as a plain word; a fine gold line draws under the one chosen.
  const word = (key: string, group: string, on: boolean, onClick: () => void, label: React.ReactNode, extra?: { swatch?: string; note?: React.ReactNode; disabled?: boolean }) => (
    <button key={key} type="button" role="radio" aria-checked={on} data-radio={group} className="pd-word" disabled={extra?.disabled} onClick={onClick}>
      {extra?.swatch && <span className="pd-swatch" style={{ background: extra.swatch }} />}
      <span>{label}</span>
      {extra?.note != null && <span className="pd-optnote">{extra.note}</span>}
    </button>
  );
  const infoBtn = (k: string, label: string) => (
    <button type="button" className="pd-info" onClick={() => toggleSection(k)} aria-label={label} aria-expanded={!!expandedSections[k]} title={label}>i</button>
  );
  // The metal actually being bought. Priced-option pieces (bracelets) carry it in the variant,
  // which the old summary line ignored: it showed the ring-pricing default ("18ct White Gold")
  // beside a 9ct yellow gold bracelet. The basket was always right; this is the display.
  const selectedMetalLabel = variantMetalLabel || metalTypeOptions.find(m => m.value === selectedMetalType)?.label || metalName;
  const summaryLine = [selectedMetalLabel, isRingCat && selectedSize && ('Size ' + selectedSize), productData?.nivoda_enabled && selectedCarat && (selectedCarat + 'ct ' + selectedColour + ' ' + selectedClarity), selectedVariant?.gemstone_type].filter(Boolean).join('  ·  ');
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const saved = isFavorite(productData.id);
  const heroImage = (gallery.find((m: any) => !isVid(m)) || gallery[0])?.url;
  const story = parseDescription(productData.description, productData.name);
  // A stock piece: one finished piece on the shelf, nothing to configure. The page then shows
  // what it is (a few facts from its own specification) where a made-to-order piece shows choices.
  const isStock = !!productData.is_live_stock && !productData.nivoda_enabled && priceVariants.length === 0 && purchasableMetals.length === 0 && (productData.available_metals || []).length === 0;
  const stockFacts: [string, string][] = (() => {
    if (!isStock) return [];
    const all = story.chapters.flatMap(c => c.specs);
    const pick = (...keys: string[]) => all.find(([k]) => keys.includes(k.trim().toLowerCase()));
    return [
      pick('metal'),
      pick('centre stone', 'center stone', 'main gemstone', 'gemstone', 'stone'),
      pick('stone size', 'diamond size', 'gemstone size'),
      pick('ring weight', 'weight'),
    ].filter(Boolean).slice(0, 3) as [string, string][];
  })();
  const stockCount = Number(productData.stock_quantity);
  // A description made of an introduction and one specification is set as a catalogue entry.
  const catalogue = story.chapters.length === 1 && story.chapters[0].specs.length > 0 ? story.chapters[0] : null;
  const catalogueRest = catalogue ? [...story.intro.slice(1), ...catalogue.paras] : [];
  // Which chapter of the description is open (kept in the page's existing section state).
  const chapterRaw = (expandedSections as any).chapter;
  const chapterOn: number = typeof chapterRaw === 'number' ? chapterRaw : 0;
  const leadTime = productData.is_live_stock ? 'Ready to ship' : 'Made to order';
  // Index click: fade to that view (laptop) and move the swipe strip to it (phone).
  const showView = (i: number) => { setCurrentImageIndex(i); goToSlide(i); };
  const lightboxItem = gallery[lightboxImageIndex] || gallery[0];
  lightboxStep.current = (d: number) => { if (gallery.length) goToLightboxImage((lightboxImageIndex + d + gallery.length) % gallery.length); };

  return (
    <div className="pd" style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: '100vh', paddingTop: 'var(--v2nav-h, 113px)' }}>
      <style>{PD_CSS}</style>

      <NavigationV2 solid />

      <main className="pd-main">
        {/* The plate. One tall picture that runs to the edge of the screen and stays put
            while the options scroll. The views are a numbered index, not thumbnails, and
            fade into one another; the picture follows the chosen metal and keeps the same
            angle when the metal changes. On a phone the same views are a full-width swipe. */}
        <div className={`pd-plate${isStock ? ' is-photo' : ''}`}>
          <div className="pd-stage" ref={mosaicRef} onScroll={onMosaicScroll}>
            {gallery.map((m: any, i: number) => (
              <div key={i} className="pd-slide" data-on={i === Math.min(currentImageIndex, gallery.length - 1) ? '1' : '0'}>
                {isVid(m)
                  ? <video src={toStreamUrl(getMediaUrl(m.url))} autoPlay muted loop playsInline preload="auto" />
                  : <img src={getMediaUrl(m.url)} alt={`${productData.name}${gallery.length > 1 ? `, view ${i + 1}` : ''}`} loading={i === 0 ? undefined : 'lazy'} onClick={() => openLightbox(i)} />}
              </div>
            ))}
            {gallery.length === 0 && <div className="pd-slide" data-on="1" />}
          </div>
          {gallery.length > 0 && (
            <div className="pd-index">
              <div role="tablist" aria-label="Views">
                {gallery.length > 1 && gallery.map((m: any, i: number) => (
                  <button key={i} type="button" role="tab" data-view={i} aria-selected={i === currentImageIndex} aria-label={isVid(m) ? 'Film' : `View ${i + 1} of ${gallery.length}`} onClick={() => showView(i)}>
                    {isVid(m) ? 'Film' : String(i + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>
              {!isVid(gallery[currentImageIndex] || gallery[0]) && (
                <button type="button" className="pd-enlarge" data-enlarge onClick={() => openLightbox(Math.min(currentImageIndex, gallery.length - 1))}>Enlarge</button>
              )}
            </div>
          )}
          {gallery.length > 1 && (
            <div className="pd-dots">
              {gallery.map((_: any, i: number) => <button key={i} type="button" aria-label={`View ${i + 1}`} onClick={() => showView(i)} data-on={i === currentImageIndex ? '1' : '0'} />)}
            </div>
          )}
        </div>

        {/* Buy column */}
        <div className="pd-buy"><div className="pd-buy-in">
        <nav className="pd-crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><Link to={`/${productData.category?.slug || 'engagement-rings'}`}>{productData.category?.name || 'Engagement rings'}</Link><span>/</span><span style={{ color: T.text }}>{productData.name}</span>
        </nav>
            {isStock && (
              <div className="pd-status"><i />In stock{stockCount === 1 ? ' · the only one' : ''}</div>
            )}
            <div className="pd-titlerow">
              <h1 className={`pd-h1${(productData.name || '').length > 30 ? ' is-long' : ''}`}>{productData.name}</h1>
              <button type="button" className="pd-save" aria-pressed={saved} aria-label={saved ? `Remove ${productData.name} from saved` : `Save ${productData.name}`}
                onClick={() => toggleFavorite(productData.id, productData.name, heroImage ? getMediaUrl(heroImage) : '', location.pathname)}>
                <svg width="22" height="20" viewBox="0 0 20 18" fill={saved ? 'currentColor' : 'none'} aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.7 2.8-2.7 4.6-2.7C17 1.4 19 3.3 19 5.9c0 3.7-3.6 6.8-9 10.700z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
              </button>
            </div>

            {/* Deliberately little on show: the price, then one row per choice. The diamond
                opens on our recommended stone, with its choices (type, carat, colour, clarity)
                laid out underneath. */}
            <div className="pd-priceline"><span className="pd-price" data-total>{money(totalPrice)}</span></div>
            {!diamondAvailable && !nivodaPriceLoading && (
              <div className="pd-notice" role="status">
                <p>This exact diamond isn’t in our live inventory right now. The price shown is indicative, and we’ll hand-source it to your specification and confirm before payment.{diamondSuggestions.length > 0 ? ' Or choose a similar stone available now:' : ''}</p>
                {diamondSuggestions.length > 0 && (
                  <div className="pd-suggest">
                    {diamondSuggestions.map((s: any, i: number) => (
                      <button key={i} type="button" onClick={() => applySuggestion(s)} title="Select this available diamond">
                        <b>{s.carat}ct · {s.color} · {s.clarity}{s.cut ? ` · ${s.cut}` : ''}</b>
                        <span>{[s.shape, s.lab].filter(Boolean).join(' · ')}{(s.shape || s.lab) ? ' · ' : ''}{money(s.priceGBP)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {priceEstimated && diamondAvailable && !nivodaPriceLoading && (
              <div className="pd-estimate"><i />Made to order. Indicative price, hand-sourced and confirmed before payment.</div>
            )}

            {/* A stock piece: the facts that matter, in place of choices */}
            {stockFacts.length > 0 && (
              <dl className="pd-facts">
                {stockFacts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            )}

            {/* Metal: priced options (one variant per karat, and per stone where offered) */}
            {priceVariants.length > 0 && (
              <section className="pd-line">
                {lineHead('Metal', variantMetalLabel)}
                <div className="pd-tray" role="radiogroup" aria-label="Gold colour">
                  {['Yellow gold', 'White gold', 'Rose gold'].map(c => medal(c, 'vcolour', variantColour === c, () => setVariantColour(c), c, undefined, c.startsWith('Yellow') ? SW.yellow : c.startsWith('Rose') ? SW.rose : SW.white, c.split(' ')[0]))}
                </div>
                {variantKarats.length > 1 && (
                  <div className="pd-words" role="radiogroup" aria-label="Gold carat">
                    {variantKarats.map(k => {
                      const p = variantPrice(k, variantStones.length ? variantStone : '');
                      return word(k, 'vkarat', variantKarat === k, () => setVariantKarat(k), k, { note: p != null ? money(p) : undefined });
                    })}
                  </div>
                )}
              </section>
            )}
            {priceVariants.length > 0 && variantStones.length > 0 && (
              <section className="pd-line">
                {lineHead('Stone', variantStone)}
                <div className="pd-words" role="radiogroup" aria-label="Stone">
                  {variantStones.map(s => {
                    const p = variantPrice(variantKarat, s);
                    return word(s, 'vstone', variantStone === s, () => setVariantStone(s), s, { note: p != null ? money(p) : undefined, disabled: p == null });
                  })}
                </div>
              </section>
            )}

            {/* Metal: rings priced per metal. The ring itself, pictured in each metal. */}
            {priceVariants.length === 0 && (purchasableMetals.length > 0 || (productData.available_metals || []).length > 0) && (
              <section className="pd-line">
                {lineHead('Metal', selectedMetalLabel, 'metal')}
                {purchasableMetals.length > 0 ? (() => {
                  const golds = purchasableMetals.filter(o => getMetalKarat(o.value));
                  const curBase = getMetalBase(selectedMetalType);
                  const curKarat = getMetalKarat(selectedMetalType) || '18ct';
                  const isGold = curBase.endsWith('gold');
                  const colourLabel: Record<string, string> = { 'white-gold': 'White gold', 'yellow-gold': 'Yellow gold', 'rose-gold': 'Rose gold' };
                  const availColours = ['white-gold', 'yellow-gold', 'rose-gold'].filter(c => golds.some(o => getMetalBase(o.value) === c));
                  const availKarats = ['9ct', '14ct', '18ct'].filter(k => golds.some(o => getMetalKarat(o.value) === k));
                  const comboValid = (c: string, k: string) => golds.some(o => o.value === `${k}-${c}`);
                  const dotOf = (c: string) => c === 'yellow-gold' ? SW.yellow : c === 'rose-gold' ? SW.rose : SW.white;
                  const pickColour = (c: string) => { let k = curKarat; if (!comboValid(c, k)) k = availKarats.find(kk => comboValid(c, kk)) || availKarats[0]; handleMetalTypeClick(`${k}-${c}`); };
                  const pickKarat = (k: string) => { let c = isGold ? curBase : 'white-gold'; if (!comboValid(c, k)) c = availColours.find(cc => comboValid(cc, k)) || availColours[0]; handleMetalTypeClick(`${k}-${c}`); };
                  // The full menu, always in the same order: the three golds, platinum, silver; and
                  // under a gold, its three carats. Anything this piece is not priced in is shown
                  // faint and cannot be chosen, so the menu never changes shape between pieces.
                  const ALL_COLOURS = ['white-gold', 'yellow-gold', 'rose-gold'];
                  const ALL_KARATS = ['9ct', '14ct', '18ct'];
                  const shortLabel: Record<string, string> = { 'white-gold': 'White', 'yellow-gold': 'Yellow', 'rose-gold': 'Rose' };
                  const hasPlatinum = purchasableMetals.some(o => o.value === 'platinum');
                  const hasSilver = purchasableMetals.some(o => o.value === 'silver');
                  const karatOffered = (k: string) => (isGold ? comboValid(curBase, k) : golds.some(o => getMetalKarat(o.value) === k));
                  return (
                    <>
                      <div className="pd-tray" role="radiogroup" aria-label="Metal">
                        {ALL_COLOURS.map(c => medal(c, 'finish', isGold && curBase === c, () => pickColour(c), colourLabel[c], undefined, dotOf(c), shortLabel[c], availColours.includes(c)))}
                        {medal('platinum', 'finish', selectedMetalType === 'platinum', () => handleMetalTypeClick('platinum'), 'Platinum', undefined, SW.plat, 'Platinum', hasPlatinum)}
                        {medal('silver', 'finish', selectedMetalType === 'silver', () => handleMetalTypeClick('silver'), 'Silver', undefined, SW.silver, 'Silver', hasSilver)}
                      </div>
                      {golds.length > 0 && (
                        <div className={`pd-karats${isGold ? '' : ' is-idle'}`}>
                          <span className="pd-optname">Gold carat</span>
                          <div className="pd-words" role="radiogroup" aria-label="Gold carat">
                            {ALL_KARATS.map(k => word(k, 'karat', isGold && curKarat === k, () => pickKarat(k), k, { disabled: !karatOffered(k) }))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })() : (
                  <div className="pd-tray" role="radiogroup" aria-label="Metal">
                    {(productData.available_metals || []).map((m: any) => medal(m.id, 'metal', selectedMetal === m.id, () => handleMetalThumbnailClick(m.id), m.name, undefined, m.color_code || '#D8D2C6', m.name))}
                  </div>
                )}
              </section>
            )}

            {/* Diamond: the current stone on one line, its choices open underneath */}
            {productData.nivoda_enabled && (
              <section className="pd-line">
                <div className="pd-linehead">
                  <span className="pd-linename">Diamond: <b>{selectedCarat ? `${parseFloat(selectedCarat).toFixed(2)}ct · ${selectedColour} · ${selectedClarity} · ${selectedStoneType === 'natural' ? 'Natural' : 'Lab-grown'}` : ''}</b></span>
                </div>
                <div className="pd-diamond is-open">
                  <div className="pd-opt">
                    <div className="pd-optname">Type</div>
                    <div className="pd-words" role="radiogroup" aria-label="Diamond type">
                      {stoneOptions.stoneType.map((o: any) => word(o.value, 'stonetype', selectedStoneType === o.value, () => handleStoneTypeSelect(o.value), o.label))}
                    </div>
                  </div>

                  {stoneOptions.carat.length > 0 && (() => {
                    const carats = stoneOptions.carat;
                    const n = carats.length;
                    const idx = Math.max(0, carats.findIndex((o: any) => o.value === selectedCarat));
                    const at = (i: number) => `calc(11px + ${n > 1 ? i / (n - 1) : 0} * (100% - 22px))`;
                    return (
                      <div className="pd-opt">
                        <div className="pd-optname">Carat: <b data-caratval>{carats[idx]?.value}ct</b></div>
                        <div className="carat-slider" data-carats={carats.map((o: any) => o.value).join(',')}>
                          <div className="carat-track" />
                          <div className="carat-fill" style={{ width: `calc(${n > 1 ? idx / (n - 1) : 0} * (100% - 22px))` }} />
                          {carats.map((o: any, i: number) => <div key={'t' + o.value} className="carat-tick" data-on={i <= idx ? '1' : '0'} style={{ left: at(i) }} />)}
                          <div className="carat-handle" style={{ left: at(idx) }} />
                          <input type="range" className="carat-input" min={0} max={n - 1} step={1} value={idx} onChange={e => handleCaratSelect(carats[+e.target.value].value)} aria-label="Total carat" aria-valuetext={`${carats[idx]?.value} carat`} />
                        </div>
                        <div className="carat-labels">
                          {carats.map((o: any, i: number) => (
                            <span key={'l' + o.value} onClick={() => handleCaratSelect(o.value)} data-on={i === idx ? '1' : '0'} style={{ left: at(i) }}>{parseFloat(o.value).toFixed(2)}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {stoneOptions.colour.length > 0 && (() => {
                    const avail = COLOUR_IMG.filter(col => stoneOptions.colour.some((o: any) => o.value === col));
                    const colours = avail.length ? avail : COLOUR_IMG;
                    return (
                      <div className="pd-opt">
                        <div className="pd-optname">Colour: <b data-optval>{selectedColour}</b><span>D is the whitest</span></div>
                        <div className="pd-tray" role="radiogroup" aria-label="Diamond colour">
                          {colours.map((col) => (
                            <button key={col} type="button" role="radio" aria-checked={selectedColour === col} data-radio="dcolour" className="pd-stone" onClick={() => handleColourSelect(col)}>
                              <span className="pd-disc"><img src={`/diamond-colours/${col}.webp`} alt="" loading="lazy" /></span>
                              <b>{col}</b>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {stoneOptions.clarity.length > 0 && (() => {
                    // Build one stable VS2-baseline diamond price from EVERY grade that currently
                    // has live stock (each normalised by its clarity multiplier, then median-ed so
                    // a thin-stock outlier can't skew it). Every grade's price is then derived from
                    // that baseline — so the preview is always complete and monotonic, even when the
                    // SELECTED grade itself is out of stock (its narrow spec returns nothing).
                    const baseVS2 = (() => {
                      // Primary anchor: the live price of the SELECTED stone (the server always
                      // returns one — exact or indicative), normalised to the VS2 base.
                      if (nivodaPrice?.avg && CLARITY_MULT[selectedClarity]) return nivodaPrice.avg / CLARITY_MULT[selectedClarity];
                      // Fallback: median of whatever per-grade previews we have.
                      const xs = Object.keys(clarityPrices)
                        .map(g => (clarityPrices[g] > 0 && CLARITY_MULT[g]) ? clarityPrices[g] / CLARITY_MULT[g] : 0)
                        .filter(x => x > 0)
                        .sort((a, b) => a - b);
                      return xs.length ? xs[Math.floor((xs.length - 1) / 2)] : 0;
                    })();
                    const selPrice = baseVS2 * (CLARITY_MULT[selectedClarity] ?? 1);
                    return (
                      <div className="pd-opt">
                        <div className="pd-optname">Clarity: <b data-optval>{selectedClarity}</b><span>FL is the cleanest</span></div>
                        <div className="pd-tray is-four" role="radiogroup" aria-label="Diamond clarity">
                          {stoneOptions.clarity.map((o: any) => {
                            const on = selectedClarity === o.value;
                            const gMult = CLARITY_MULT[o.value] ?? 1;
                            const delta = baseVS2 ? Math.round(baseVS2 * gMult - selPrice) : 0;
                            const priceText = on ? '' : !baseVS2 ? '' : delta > 0 ? '+' + money(delta) : delta < 0 ? '−' + money(-delta) : '';
                            return (
                              <button key={o.value} type="button" role="radio" aria-checked={on} data-radio="dclarity" className="pd-stone" onClick={() => handleClaritySelect(o.value)}>
                                <span className="pd-disc"><DiamondIcon grade={o.value} /></span>
                                <b>{o.value}</b>
                                <small>{priceText}</small>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {stoneOptions.cut && stoneOptions.cut.length > 0 && (
                    <div className="pd-opt">
                      <div className="pd-optname">Cut: <b>{selectedCut}</b></div>
                      <div className="pd-words" role="radiogroup" aria-label="Cut">{stoneOptions.cut.map((o: any) => word(o.value, 'cut', selectedCut === o.value, () => handleCutSelect(o.value), o.label))}</div>
                    </div>
                  )}

                  {(((stoneOptions as any).polish && (stoneOptions as any).polish.length) || ((stoneOptions as any).symmetry && (stoneOptions as any).symmetry.length) || ((stoneOptions as any).certificate && (stoneOptions as any).certificate.length)) ? (
                    <div className="pd-opt">
                      <button type="button" className="pd-link" data-faq aria-expanded={!!expandedStoneOptions.advanced} onClick={() => toggleStoneOption('advanced')}>Grading &amp; certification</button>
                      <div className={`pd-accbody${expandedStoneOptions.advanced ? ' is-open' : ''}`} style={{ padding: '6px 0 0' }}>
                        {(stoneOptions as any).polish && (stoneOptions as any).polish.length > 0 && <><div className="pd-optname" style={{ marginTop: 16 }}>Polish</div><div className="pd-words" role="radiogroup" aria-label="Polish">{(stoneOptions as any).polish.map((o: any) => word(o.value, 'polish', selectedPolish === o.value, () => handlePolishSelect(o.value), o.label))}</div></>}
                        {(stoneOptions as any).symmetry && (stoneOptions as any).symmetry.length > 0 && <><div className="pd-optname" style={{ marginTop: 16 }}>Symmetry</div><div className="pd-words" role="radiogroup" aria-label="Symmetry">{(stoneOptions as any).symmetry.map((o: any) => word(o.value, 'symmetry', selectedSymmetry === o.value, () => handleSymmetrySelect(o.value), o.label))}</div></>}
                        {(stoneOptions as any).certificate && (stoneOptions as any).certificate.length > 0 && <><div className="pd-optname" style={{ marginTop: 16 }}>Certificate lab</div><div className="pd-words" role="group" aria-label="Certificate lab">{(stoneOptions as any).certificate.map((o: any) => { const on = selectedCertificate === o.value; return word(o.value, 'cert', on, () => setSelectedCertificate(on ? '' : o.value), o.label); })}</div></>}
                      </div>
                    </div>
                  ) : null}
                </div>
                {nivodaPriceError && <div className="pd-estimate" role="status"><i />{nivodaPriceError.replace(/\s+—\s+/g, '. ').replace(/\. c/, '. C')}</div>}
              </section>
            )}

            {/* Ring size: one field */}
            {isRingCat && (
              <section className="pd-line">
                {(() => {
                  const splitLbl = (l: string) => { const m = l.match(/^(.*?)\s*\((.*)\)\s*$/); return { uk: m ? m[1] : l, conv: m ? m[2] : '' }; };
                  const cur = splitLbl(sizeLabel);
                  return (
                    <div className="size-dropdown-container pd-size">
                      <button type="button" className="pd-sizebtn" data-sizebtn onClick={() => setSizeDropdownOpen(o => !o)} aria-haspopup="listbox" aria-expanded={sizeDropdownOpen}>
                        <span className="pd-linename">Size</span>
                        <span><b data-sizeuk>{cur.uk.replace('UK Size ', 'UK ')}</b><ChevronDown size={16} strokeWidth={1.25} style={{ transform: sizeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} /></span>
                      </button>
                      <div role="listbox" aria-label="Ring size" className={`pd-sizemenu${sizeDropdownOpen ? ' is-open' : ''}`}>
                        {ringSizes.map(s => {
                          const on = s.value === selectedSize; const p = splitLbl(s.label);
                          return (
                            <button key={s.value} type="button" role="option" aria-selected={on} data-sizeopt onClick={() => { setSelectedSize(s.value); setSizeDropdownOpen(false); }}>
                              <b>{p.uk}</b><span>{p.conv}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                {(productData.available_diamond_sizes || []).length > 0 && (
                  <>
                    <div className="pd-optname" style={{ marginTop: 22 }}>Diamond size</div>
                    <div className="pd-words" role="radiogroup" aria-label="Diamond size">
                      {productData.available_diamond_sizes.map((d: any) => word(d.id, 'dsize', selectedDiamondSize === d.id, () => setSelectedDiamondSize(d.id), d.display_name || d.name))}
                    </div>
                  </>
                )}
              </section>
            )}

            {googleRating && (
              <a className="pd-rating" href={googleRating.url} target="_blank" rel="noopener noreferrer">{googleRating.rating} / 5 • Read our Google reviews</a>
            )}
            <div className="pd-actions">
              <button type="button" onClick={handleAddToCart} disabled={isLoading} className="pd-btn pd-add" data-addbag>{isLoading ? 'Adding…' : 'Add to bag'}</button>
              <Link to="/book-appointment" className="pd-btn2">{isStock ? 'See it in the showroom' : 'Book an appointment'}</Link>
            </div>
            <p className="pd-note">
              {productData.is_live_stock ? 'In stock, usually dispatched within 2 to 3 working days.' : 'Made to order in our own workshop, up to 6 weeks.'} Free insured UK delivery.{isStock ? ' 30-day returns.' : ''}
              {isRingCat && <> <Link to="/ring-size-guide">Size guide</Link></>}
            </p>
            {/* Reassurance near the purchase buttons (owner's Services brief, Nov 2026) */}
            <ul className="pd-reassure" aria-label="Why buy from us">
              <li>Five Generations of Expertise</li>
              <li>Established UK Showroom</li>
              <li>Expert Jewellery Craftsmanship</li>
              <li><Link to="/services/jewellery-care-aftercare">Dedicated Aftercare</Link></li>
              <li><Link to="/delivery">Insured UK Delivery</Link></li>
              <li><Link to="/contact">Speak Directly with Our Jeweller</Link></li>
            </ul>

            <div className="pd-accs">
              {[['delivery', 'Delivery information', productData.is_live_stock ? 'Free insured UK delivery. In stock and ready to ship, usually dispatched within 2 to 3 working days. 30-day returns.' : 'Free insured UK delivery. Made to order: please allow up to 6 weeks. Made-to-order pieces are not eligible for the 30-day return once work has begun.'], ['insurance', 'Complimentary insurance', 'Every piece includes complimentary insurance for the first year and a 1-year warranty.']].map(([key, title, body]) => (
                <div key={key} className="pd-accitem">
                  <button type="button" className="pd-acc" data-faq aria-expanded={!!expandedSections[key]} onClick={() => toggleSection(key)}>
                    <span>{title}</span><span className="pd-plus" aria-hidden="true" />
                  </button>
                  <div className={`pd-accbody${expandedSections[key] ? ' is-open' : ''}`}><p>{body}</p></div>
                </div>
              ))}
              <div className="pd-accitem">
                <button type="button" className="pd-acc" data-faq aria-expanded={!!expandedSections.selection} onClick={() => toggleSection('selection')}>
                  <span>Your selection</span><span className="pd-plus" aria-hidden="true" />
                </button>
                <div className={`pd-accbody${expandedSections.selection ? ' is-open' : ''}`}>
                  <dl className="pd-spec">
                    {([selectedMetalLabel && ['Metal', selectedMetalLabel], isRingCat && ['Size', sizeLabel], diamondName && ['Diamond', diamondName], selectedVariant?.gemstone_type && ['Stone', selectedVariant.gemstone_type], productData.nivoda_enabled && ['Diamond type', selectedStoneType === 'natural' ? 'Natural' : 'Lab-Grown'], productData.nivoda_enabled && selectedCarat && ['Carat', selectedCarat + ' ct'], productData.nivoda_enabled && selectedClarity && ['Clarity', selectedClarity], productData.nivoda_enabled && selectedColour && ['Colour', selectedColour], productData.sku && ['Product code', productData.sku]].filter(Boolean) as any[]).map((row: any, i: number) => (
                      <div key={i}><dt>{row[0]}</dt><dd>{row[1]}</dd></div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>

            {/* Price bar: sits at the foot of this column and stays at the bottom of the screen
                while the options scroll, so the total and Add to bag are always in reach. */}
            <div className="pd-bar">
              <div className="pd-bar-in">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="pd-bar-sum">{summaryLine}{nivodaPriceLoading ? '  ·  updating…' : ''}</div>
                  <div className="pd-bar-price"><span data-total>{money(totalPrice)}</span><small>incl. VAT</small></div>
                </div>
                <button type="button" onClick={handleAddToCart} disabled={isLoading} className="pd-btn" data-addbag>{isLoading ? 'Adding…' : 'Add to bag'}</button>
              </div>
            </div>
        </div></div>
      </main>

      {/* About this piece. The client's own words, given room: a centred opening, then the
          chapters named down the left with one open at a time beside them, so there is only
          ever one thing to read. A specification is set as a quiet two-column list. */}
      {(story.intro.length > 0 || story.chapters.length > 0) && (
        <section className="pd-story">
          <div className="pd-wrap">
            <div className="pd-story-open">
              <div className="pd-eyebrow" style={{ justifyContent: 'center' }}>About this piece</div>
              {story.tagline && <h2 className="pd-h2">{story.tagline}</h2>}
              {(catalogue ? story.intro.slice(0, 1) : story.intro).map((t, i) => <p key={i} className={i === 0 ? 'is-lead' : undefined}>{t}</p>)}
            </div>

            {/* The catalogue entry: a description that is an introduction plus a specification
                (stock pieces, bracelets) shows the specification as a grid of facts, and keeps
                the rest of the wording behind one link. */}
            {catalogue && (
              <>
                <dl className="pd-catalogue">
                  {catalogue.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                </dl>
                {catalogueRest.length > 0 && (
                  <div className="pd-catmore">
                    <button type="button" className="pd-link" data-catmore aria-expanded={!!expandedSections.fullstory} onClick={() => toggleSection('fullstory')}>{expandedSections.fullstory ? 'Show less' : 'Read the full description'}</button>
                    <div className={`pd-catrest${expandedSections.fullstory ? ' is-open' : ''}`}>
                      {catalogueRest.map((t, i) => <p key={i}>{t}</p>)}
                    </div>
                  </div>
                )}
              </>
            )}

            {!catalogue && story.chapters.length > 0 && (
              <div className={`pd-chapters${story.chapters.length === 1 ? ' is-one' : ''}`}>
                {story.chapters.map((c, i) => {
                  const on = story.chapters.length === 1 || chapterOn === i;
                  return (
                    <div key={i} className="pd-chapter" data-on={on ? '1' : '0'}>
                      <button type="button" className="pd-chaptitle" data-chap={i} aria-expanded={on} onClick={() => setExpandedSections((prev: any) => ({ ...prev, chapter: chapterOn === i ? -1 : i }))}>
                        <span>{String(i + 1).padStart(2, '0')}</span>{c.title}
                      </button>
                      <div className="pd-chaptext">
                        {c.specs.length === 0 && c.paras.map((t, j) => <p key={j}>{t}</p>)}
                        {c.specs.length > 0 && (
                          <dl className="pd-specs">
                            {c.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                          </dl>
                        )}
                        {c.specs.length > 0 && c.paras.map((t, j) => <p key={'n' + j} className="is-note">{t}</p>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Our promise: the page's one sand band. Centred and spare: one heading, one sentence,
          then the four promises side by side, each a small gold mark, a name and a line. */}
      <section className="pd-promise">
        <div className="pd-wrap">
          <div className="pd-promise-open">
            <div className="pd-eyebrow" style={{ justifyContent: 'center' }}>Our promise</div>
            <h2 className="pd-h2">Where craftsmanship meets distinction.</h2>
            <p>{productData.is_live_stock
              ? 'Ready to ship from our showroom in Beeston, with a 1-year warranty. Sizing, repairs and servicing are all done in our own workshop.'
              : 'Every made-to-order piece is cut, set and finished by hand in our own workshop. The same bench, the same care, for generations.'}</p>
          </div>
          <div className="pd-promise-grid">
            {([
              ['White glove delivery', 'Insured, tracked and hand-delivered to your door.', <path key="a" d="M4 9.5l10-5 10 5v10l-10 5-10-5z M4 9.5l10 5 10-5 M14 14.5v10" />],
              ['Signature presentation', 'Every piece arrives in our signature box, ready to give.', <path key="b" d="M5.5 12.5h17v11h-17z M4 8.5h20v4H4z M14 8.5v15 M14 8.5c-2.5-4.5-7.5-3-5 0 M14 8.5c2.5-4.5 7.5-3 5 0" />],
              ['Ethical excellence', 'Responsibly sourced stones and metals, hallmarked in the UK.', <path key="c" d="M14 3.5l9 3v7c0 6-4 9.5-9 11.5-5-2-9-5.5-9-11.5v-7z M10 14l3 3 5.5-6" />],
              ['Sizing expertise', 'Sized in our own workshop to get the fit exactly right.', <path key="d" d="M14 24.5a7 7 0 100-14 7 7 0 000 14z M11 4.5h6l2 2.5-5 3.5-5-3.5z" />],
            ] as [string, string, React.ReactNode][]).map(([t, d, icon]) => (
              <div key={t}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={T.gold} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{icon}</svg>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <div className="pd-promise-acts">
            <Link to="/book-appointment" className="pd-link">Book a private consultation</Link>
            <a href="tel:01159257552" className="pd-link">Order by phone</a>
          </div>
        </div>
      </section>

      {(recommendedProducts || []).length > 0 && (
        <section className="pd-wrap pd-recs">
          <h2 className="pd-h2">You may also like</h2>
          <div className="pd-recgrid">
            {recommendedProducts.slice(0, 4).map((r: any) => {
              // The recommendations API returns `image` as a plain URL string
              // (rec.images[0].image_url), not an object — handle both shapes.
              const rimg = (typeof r.image === 'string' ? r.image : r.image?.url) || r.images?.[0]?.url;
              return (
                <Link key={r.id} to={`/${r.category?.slug || 'engagement-rings'}/${r.slug}`} className="pd-rec-card">
                  <div>{rimg ? <img src={getMediaUrl(rimg)} alt={r.name} loading="lazy" /> : null}</div>
                  <p><span>{r.name}</span><span>{r.price}</span></p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <FooterV2 />

      {/* Enlarged view: click the picture to step in closer, move to look around */}
      {isLightboxOpen && lightboxItem && (
        <div className="pd-lb" role="dialog" aria-modal="true" aria-label={`${productData.name}, enlarged view`}>
          <button type="button" className="pd-lb-x" aria-label="Close" onClick={closeLightbox}><svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" /></svg></button>
          <div className="pd-lb-stage" onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}>
            {isVid(lightboxItem)
              ? <video src={toStreamUrl(getMediaUrl(lightboxItem.url))} autoPlay muted loop playsInline controls />
              : <img src={getMediaUrl(lightboxItem.url)} alt={productData.name} data-zoom={zoomLevel > 1 ? '1' : '0'}
                  style={{ transform: `scale(${zoomLevel > 1 ? 2.2 : 1})` }}
                  onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; setZoomLevel(zoomLevel > 1 ? 1 : 2); }}
                  onMouseMove={(e) => { if (zoomLevel <= 1) return; const r = e.currentTarget.parentElement!.getBoundingClientRect(); e.currentTarget.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; }} />}
          </div>
          {gallery.length > 1 && (
            <div className="pd-lb-nav">
              <button type="button" aria-label="Previous view" onClick={() => lightboxStep.current?.(-1)}><svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true"><path d="M8 1L1 8l7 7" stroke="currentColor" /></svg></button>
              <span>{lightboxImageIndex + 1} / {gallery.length}</span>
              <button type="button" aria-label="Next view" onClick={() => lightboxStep.current?.(1)}><svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true"><path d="M1 1l7 7-7 7" stroke="currentColor" /></svg></button>
            </div>
          )}
        </div>
      )}

      {productData?.nivoda_enabled && <DiamondHelpNudge productName={productData?.name} />}
    </div>
  );
};

export default ProductDetail;
