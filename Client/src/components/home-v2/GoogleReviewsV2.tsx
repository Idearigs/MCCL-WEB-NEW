import React, { useEffect, useState } from "react";
import API_BASE_URL from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

/**
 * "Words from Our Clients" — the shop's Google reviews, shown just above the footer on the
 * homepage and selected pages (owner's Customer Trust brief, Nov 2026). Data: GET /google-reviews
 * (Places API, Server/routes/googleReviews.js): the live rating, the review count and the up-to-five
 * reviews Google returns, in Google's order and wording, each with its author and a link back.
 * Until the Google key is set up, or if Google can't be reached, the section keeps its heading
 * and the two Google buttons and leaves out the rating and the cards (nothing is made up).
 * Also exports useGoogleRating() for the one-line rating near the homepage hero and on product pages.
 */

export interface GoogleReview { rating: number | null; text: string; author: string; authorUrl: string | null; authorPhoto: string | null; when: string | null; url: string | null }
export interface GoogleData { available: boolean; rating?: number | null; count?: number | null; reviewsUrl?: string | null; writeReviewUrl?: string | null; reviews?: GoogleReview[] }

// The Google listing found by name and address: used whenever the API's own links are missing.
export const GOOGLE_LISTING_URL = "https://www.google.com/maps/search/?api=1&query=McCulloch+Jewellers+7+The+Square+Beeston+Nottingham";

let shared: Promise<GoogleData> | null = null;
const load = (): Promise<GoogleData> =>
  (shared ??= fetch(`${API_BASE_URL}/google-reviews`).then(r => (r.ok ? r.json() : { available: false })).catch(() => ({ available: false })));

export const useGoogleData = (): GoogleData | null => {
  const [d, setD] = useState<GoogleData | null>(null);
  useEffect(() => { let on = true; load().then(v => { if (on) setD(v); }); return () => { on = false; }; }, []);
  return d;
};

/** "4.9" and "127", or null while loading / when there's no live rating. */
export const useGoogleRating = (): { rating: string; count: number | null; url: string } | null => {
  const d = useGoogleData();
  if (!d?.available || typeof d.rating !== "number") return null;
  return { rating: d.rating.toFixed(1), count: d.count ?? null, url: d.reviewsUrl || GOOGLE_LISTING_URL };
};

const Stars = ({ n }: { n: number }): JSX.Element => (
  <span role="img" aria-label={`${n} out of 5 stars`} style={{ display: "inline-flex", gap: 2, color: T.gold }}>
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill={i <= Math.round(n) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" /></svg>
    ))}
  </span>
);

const CSS = `
  .gr { background: ${T.cream}; padding: clamp(56px, 6vw, 96px) clamp(20px, 4vw, 64px); font-family: ${FONT_BODY}; color: ${T.text}; text-align: center; }
  .gr a { color: inherit; text-decoration: none; }
  .gr-in { max-width: 1250px; margin: 0 auto; }
  .gr-kicker { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.gold}; margin-bottom: 16px; }
  .gr h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(26px, 3vw, 42px); line-height: 1.15; margin: 0 0 14px; color: ${T.text}; }
  .gr-lede { margin: 0 auto; max-width: 60ch; font-size: 15.5px; line-height: 1.7; }
  .gr-score { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 22px; }
  .gr-score b { font-size: 17px; font-weight: 500; color: ${T.text}; }
  .gr-score small { font-size: 12.5px; color: ${T.textMuted}; }
  .gr-score:hover b { color: ${T.gold}; }
  .gr-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(14px, 1.6vw, 22px); margin-top: clamp(28px, 3vw, 40px); text-align: left; }
  .gr-card { display: flex; flex-direction: column; background: #FFFEFD; border: 1px solid ${T.line}; padding: clamp(20px, 2vw, 28px); }
  .gr-text { margin: 14px 0 0; font-size: 15px; line-height: 1.65; white-space: pre-line; overflow-wrap: anywhere; }
  .gr-text.is-clamped { display: -webkit-box; -webkit-line-clamp: 7; -webkit-box-orient: vertical; overflow: hidden; }
  .gr-more { align-self: flex-start; margin-top: 8px; padding: 0; background: none; border: 0; cursor: pointer; font-family: inherit; font-size: 13px; color: ${T.text}; text-decoration: underline; text-underline-offset: 3px; }
  .gr-who { display: flex; align-items: center; gap: 10px; margin-top: auto; padding-top: 18px; font-size: 13.5px; }
  .gr-who img { width: 28px; height: 28px; border-radius: 50%; flex: none; }
  .gr-who b { font-weight: 500; }
  .gr-src { margin-top: 10px; font-size: 12.5px; color: ${T.textMuted}; }
  .gr-src:hover { color: ${T.text}; }
  .gr-btns { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin-top: clamp(28px, 3vw, 40px); }
  .gr-btn { display: inline-block; min-width: 230px; padding: 16px 28px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; border: 1px solid ${T.ink}; transition: background 0.3s ease, color 0.3s ease; }
  .gr-btn.is-dark { background: ${T.ink}; color: ${T.cream} !important; }
  .gr-btn.is-dark:hover { background: ${T.text}; }
  .gr-btn.is-light { background: #FFFEFD; color: ${T.ink}; }
  .gr-btn.is-light:hover { background: ${T.ink}; color: ${T.cream} !important; }
  .gr-attr { margin-top: 18px; font-size: 12px; color: ${T.textMuted}; }
  @media (max-width: 900px) {
    .gr-cards { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; margin-left: calc(-1 * clamp(20px, 4vw, 64px)); margin-right: calc(-1 * clamp(20px, 4vw, 64px)); padding: 0 clamp(20px, 4vw, 64px) 6px; scroll-padding: 0 clamp(20px, 4vw, 64px); }
    .gr-card { flex: 0 0 min(86%, 380px); scroll-snap-align: start; }
  }
  @media (max-width: 560px) { .gr-btn { width: 100%; min-width: 0; } }
`;

const Card = ({ r }: { r: GoogleReview }): JSX.Element => {
  const [open, setOpen] = useState(false);
  const long = r.text.length > 360;
  return (
    <article className="gr-card">
      {typeof r.rating === "number" && <Stars n={r.rating} />}
      {r.text && <p className={`gr-text${long && !open ? " is-clamped" : ""}`}>{r.text}</p>}
      {long && <button type="button" className="gr-more" aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? "Show less" : "Read the full review"}</button>}
      <div className="gr-who">
        {r.authorPhoto && <img src={r.authorPhoto} alt="" width={28} height={28} loading="lazy" referrerPolicy="no-referrer" />}
        <span>{r.authorUrl ? <a href={r.authorUrl} target="_blank" rel="noopener noreferrer"><b>{r.author}</b></a> : <b>{r.author}</b>}{r.when ? ` • ${r.when}` : ""}</span>
      </div>
      {r.url && <a className="gr-src" href={r.url} target="_blank" rel="noopener noreferrer">Read on Google Maps</a>}
    </article>
  );
};

const GoogleReviewsV2 = (): JSX.Element => {
  const d = useGoogleData();
  const live = !!d?.available;
  const reviews = live ? (d?.reviews || []).filter(r => r.text).slice(0, 3) : [];
  const allUrl = (live && d?.reviewsUrl) || GOOGLE_LISTING_URL;
  const writeUrl = (live && d?.writeReviewUrl) || GOOGLE_LISTING_URL;
  return (
    <section id="reviews" className="gr" aria-labelledby="gr-h">
      <style>{CSS}</style>
      <div className="gr-in">
        <div className="gr-kicker">The McCulloch experience</div>
        <h2 id="gr-h">Words from Our Clients</h2>
        <p className="gr-lede">Discover the experiences of those who have entrusted us with their most meaningful jewellery.</p>
        {live && typeof d?.rating === "number" && (
          <a className="gr-score" href={allUrl} target="_blank" rel="noopener noreferrer">
            <b>{d.rating.toFixed(1)} / 5{typeof d.count === "number" ? ` • ${d.count.toLocaleString("en-GB")} reviews` : ""}</b>
            <small>Google Maps | Customer reviews</small>
          </a>
        )}
        {reviews.length > 0 && <div className="gr-cards">{reviews.map((r, i) => <Card key={(r.url || r.author) + i} r={r} />)}</div>}
        <div className="gr-btns">
          <a className="gr-btn is-dark" href={allUrl} target="_blank" rel="noopener noreferrer">Read all Google reviews</a>
          <a className="gr-btn is-light" href={writeUrl} target="_blank" rel="noopener noreferrer">Leave a review</a>
        </div>
        {reviews.length > 0 && <div className="gr-attr">Reviews from Google Maps, shown as written.</div>}
      </div>
    </section>
  );
};

export default GoogleReviewsV2;
