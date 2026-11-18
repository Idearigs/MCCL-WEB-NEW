// Shared look of the product listing pages (engagement rings, earrings, pendants, necklaces, bracelets):
// one stylesheet, the page colours and sizes, and the two small icons they all use.
import React, { useEffect, useRef } from "react";
import { T, FONT_BODY } from "./tokens";

export const GROUND = "#FFFEFD"; // page ground, same as the home page
export const TILE = "#FBFAF7";   // product tile, same as the home page
export const PAGE_SIZE = 24;     // products shown before "Show more"
export const PAGE_X = "clamp(24px, 3vw, 52px)";
export const BAR_TOP = 112; // the laptop navigation (notice strip + header) is 113px tall; the filter bar parks just under it
// The same two positions, read from the navigation's measured height so no gap opens at any window size.
export const BAR_TOP_CSS = "calc(var(--v2nav-h, 113px) - 1px)";
export const M_BAR_TOP_CSS = "calc(var(--v2nav-h, 101px) - 1px)";
export const M_BAR_TOP = 100; // the phone navigation is 101px tall; the Filter / Sort row parks just under it

export const XICON = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1" /></svg>;
export const Chev = () => (
  <svg className="erv2-chev" width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true"><path d="M1 3l3.5 3.5L8 3" stroke="currentColor" strokeWidth="1" /></svg>
);

export const LISTING_CSS = `
        .erv2 a { color: inherit; text-decoration: none; }
        .erv2-opt:hover { color: ${T.ink} !important; }
        .erv2-chip:hover { border-color: ${T.text} !important; }
        .erv2-card img { transition: transform 0.6s ease; }
        .erv2-card:hover img { transform: scale(1.03); }
        .erv2-blend { mix-blend-mode: multiply; }
        .erv2-fbtn { display: flex; align-items: center; gap: 8px; padding: 19px 0 18px; cursor: pointer; background: transparent; border: 0; font-family: ${FONT_BODY}; font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.text}; }
        .erv2-chev { transition: transform 0.3s ease; }
        .erv2-fbtn[aria-expanded="true"] .erv2-chev { transform: rotate(180deg); }
        /* Panels open by growing in height, so the rings below slide down instead of jumping */
        .erv2-panel { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows 0.45s cubic-bezier(0.22,1,0.36,1), visibility 0s linear 0.45s; }
        .erv2-panel.is-open { grid-template-rows: 1fr; visibility: visible; transition: grid-template-rows 0.45s cubic-bezier(0.22,1,0.36,1), visibility 0s; }
        .erv2-panel-clip { min-height: 0; overflow: hidden; }
        .erv2-panel-in { padding: 22px 0 26px; border-bottom: 1px solid ${T.line}; opacity: 0; transition: opacity 0.3s ease; }
        .erv2-panel.is-open .erv2-panel-in { opacity: 1; transition: opacity 0.4s ease 0.1s; }
        @media (prefers-reduced-motion: reduce) { .erv2-panel, .erv2-panel.is-open, .erv2-panel-in, .erv2-panel.is-open .erv2-panel-in { transition: none; } }
        /* Filter choices in the laptop panels: a row of outlined pills; a tick slides in when chosen */
        .erv2-pills { display: flex; flex-wrap: wrap; gap: 10px; }
        .erv2-pill { display: inline-flex; align-items: center; height: 42px; padding: 0 18px; cursor: pointer; background: transparent; border: 1px solid ${T.line}; font-family: ${FONT_BODY}; font-size: 14px; color: ${T.text}; transition: border-color 0.2s ease, background 0.2s ease; }
        .erv2-pill:hover { border-color: ${T.ruleStrong}; }
        .erv2-pill[aria-pressed="true"] { border-color: ${T.text}; background: ${TILE}; }
        .erv2-pill-tick { display: inline-flex; width: 0; overflow: hidden; opacity: 0; transition: width 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease; }
        .erv2-pill[aria-pressed="true"] .erv2-pill-tick { width: 21px; opacity: 1; }
        .erv2-pill-dot { width: 10px; height: 10px; flex: none; border-radius: 50%; margin-right: 10px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08); }
        .erv2-pill-n { margin-left: 10px; font-size: 12px; color: ${T.textMuted}; }
        .erv2-panel-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 32px; margin-top: 22px; }
        .erv2-panel-foot button { padding: 8px 0 5px; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; font-family: ${FONT_BODY}; font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
        .erv2-panel-foot button:hover { border-bottom-color: ${T.text}; }
        .erv2-panel-foot button.is-quiet { border-bottom-color: transparent; color: ${T.textMuted}; }
        /* While a panel is open the page behind it recedes under a pale veil; a click on the veil closes the panel */
        .erv2-scrim { position: fixed; inset: 0; z-index: 29; background: rgba(255,254,253,0.74); opacity: 0; visibility: hidden; transition: opacity 0.35s ease, visibility 0s linear 0.35s; }
        .erv2-scrim.is-on { opacity: 1; visibility: visible; transition: opacity 0.35s ease, visibility 0s; }
        .erv2-bar { transition: box-shadow 0.35s ease; }
        .erv2-bar.has-open { box-shadow: 0 30px 44px -32px rgba(28,26,23,0.22); }
        @media (prefers-reduced-motion: reduce) { .erv2-scrim, .erv2-scrim.is-on, .erv2-pill-tick, .erv2-bar { transition: none; } }
        @media (max-width: 900px){ .erv2-scrim { display: none; } }
        .erv2-opt:hover .erv2-box { border-color: ${T.text} !important; }
        .erv2-sortopt:hover { color: ${T.text} !important; }
        .erv2-count-m { display: none; }
        /* "Add to bag" rises from the bottom of the tile on hover; not shown on touch screens, where a tap opens the ring */
        .erv2-add { position: absolute; left: 12px; right: 12px; bottom: 12px; height: 42px; display: flex; align-items: center; justify-content: center; background: rgba(255,254,253,0.9); border: 1px solid ${T.ruleStrong}; color: ${T.text}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0; transform: translateY(8px); transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease, border-color 0.2s ease; }
        .erv2-add:hover { border-color: ${T.text}; }
        .erv2-card:hover .erv2-add, .erv2-card:focus-within .erv2-add { opacity: 1; transform: none; }
        @media (hover: none) { .erv2-add { display: none; } }
        @media (prefers-reduced-motion: reduce) { .erv2-add { transition: opacity 0.2s ease; transform: none; } }
        .erv2-mbtn { display: flex; align-items: center; gap: 9px; padding: 17px 0 16px; cursor: pointer; background: transparent; border: 0; font-family: ${FONT_BODY}; font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.text}; }
        .erv2-x { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; border: 0; color: ${T.text}; }
        [data-acc][aria-expanded="true"] .erv2-chev { transform: rotate(180deg); }
        /* On wide screens the bar and the rings sit in one centred column, like the home page rows */
        .erv2-bar > *, .erv2-main > * { max-width: 1320px; margin-left: auto; margin-right: auto; }
        .erv2-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .erv2-save { transition: opacity 0.2s ease; }
        .erv2-save:hover { opacity: 0.6; }
        .erv2-dot > span { box-shadow: inset 0 0 0 1px rgba(0,0,0,0.07); transition: box-shadow 0.2s ease; }
        .erv2-dot[aria-pressed="true"] > span { box-shadow: 0 0 0 3px ${GROUND}, 0 0 0 4px ${T.textMuted}; }
        .erv2-main-img { animation: erv2ImgIn 0.45s ease; transition: opacity 0.55s ease, transform 0.6s ease !important; }
        .erv2-card.has-alt:hover .erv2-main-img { opacity: 0; }
        @keyframes erv2ImgIn { from { opacity: 0; } to { opacity: 1; } }
        .erv2-more { transition: background 0.2s ease, color 0.2s ease; }
        .erv2-more:hover { background: ${T.text} !important; color: ${GROUND} !important; }
        .erv2-textlink { display: inline-block; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid ${T.ruleStrong}; padding: 14px 0 5px; transition: border-color 0.2s ease; }
        .erv2-textlink:hover { border-bottom-color: ${T.gold}; }
        .erv2-card img.erv2-card-alt { opacity: 0; transition: opacity 0.55s ease, transform 0.5s ease; }
        .erv2-card:hover img.erv2-card-alt { opacity: 1; }
        .erv2-clear:hover { color: ${T.ink} !important; }
        .erv2-range { -webkit-appearance:none; appearance:none; width:100%; height:1px; background:${T.ruleStrong}; outline:none; }
        .erv2-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:15px; height:15px; border-radius:50%; background:${T.gold}; cursor:pointer; }
        .erv2-range::-moz-range-thumb { width:15px; height:15px; border:0; border-radius:50%; background:${T.gold}; cursor:pointer; }
        .erv2-triggerbar { display: none; }
        @keyframes erv2SheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (max-width: 1199px){ .erv2-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 900px){
          .erv2-bar{ display: none !important; }
          .erv2-grid{ margin-top: 24px !important; }
          .erv2-more{ width: 100%; }
          .erv2-head{ padding-bottom: 28px !important; }
          .erv2-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 26px 12px !important; }
          .erv2-save{ top: 0 !important; right: 0 !important; width: 40px !important; height: 40px !important; }
          .erv2-save svg{ width: 17px; height: 15px; }
          .erv2-triggerbar{ display: block !important; }
          .erv2-sortdesktop{ display: none !important; }
          .erv2-range::-webkit-slider-thumb{ width:22px !important; height:22px !important; }
          .erv2-range::-moz-range-thumb{ width:22px !important; height:22px !important; }
        }
`;

// The tick inside a chosen filter pill.
export const PillTick = () => (
  <span className="erv2-pill-tick" aria-hidden="true"><svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5l3.2 3.2L11 1" stroke="currentColor" strokeWidth="1.1" /></svg></span>
);

// Laptop filter panels: Esc closes the open panel, and toResults() brings the first row of results
// back under the filter row when a filter changes part-way down the page.
export function useFilterPanel(open: boolean, close: () => void) {
  const barRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const toResults = () => requestAnimationFrame(() => {
    const main = mainRef.current; if (!main) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--v2nav-h")) || 113;
    const y = main.getBoundingClientRect().top + window.scrollY - navH - (barRef.current?.offsetHeight || 0);
    if (window.scrollY > y + 4) window.scrollTo({ top: y, behavior: "smooth" });
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return { barRef, mainRef, toResults };
}
