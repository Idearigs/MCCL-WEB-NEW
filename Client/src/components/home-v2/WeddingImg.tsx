import React from "react";
import { getMediaUrl } from "../../config/api";

/*
 * Wedding-ring imagery.
 *
 * Heroes are hosted as size derivatives of the 4x-upscaled masters at
 *   /uploads/wedding/<design_id>/<colourway>-<thumb|tile|pdp|zoom>.<webp|jpg>
 * (thumb 200 / tile 1200 / pdp 2000 / zoom 3200 — capped to the master, so the
 * 1200px pattern-ring masters simply repeat 1200 for pdp/zoom). The API stores
 * the `-pdp.webp` URL in wedding_designs.hero_*; from it we derive the full
 * srcset here. Anything that is NOT one of our derivatives (a legacy Azure URL,
 * or a colourway with no upscaled master) is rendered as-is so nothing breaks
 * during / after the migration.
 */

const SIZES: [string, number][] = [["thumb", 200], ["tile", 1200], ["pdp", 2000], ["zoom", 3200]];
const RE = /^(.*\/[a-z]-)(?:thumb|tile|pdp|zoom)\.webp$/i;

type SizeName = "thumb" | "tile" | "pdp" | "zoom";

// A single derivative URL at a given size — or the original, passed through
// getMediaUrl, when the hero is not one of our derivatives.
export function weddingVariant(hero: string | null | undefined, size: SizeName): string | null {
  if (!hero) return null;
  const m = hero.match(RE);
  if (!m) return getMediaUrl(hero);
  return getMediaUrl(m[1] + size + ".webp");
}

function srcset(base: string, ext: string): string {
  return SIZES.map(([name, w]) => `${getMediaUrl(base + name + "." + ext)} ${w}w`).join(", ");
}

export function WeddingImg({ hero, alt, sizes, style, loading, draggable }: {
  hero: string | null | undefined;
  alt: string;
  sizes: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  draggable?: boolean;
}): JSX.Element | null {
  if (!hero) return null;
  const m = hero.match(RE);
  if (!m) return <img src={getMediaUrl(hero)} alt={alt} style={style} loading={loading} draggable={draggable} />;
  const base = m[1];
  return (
    <picture>
      <source type="image/webp" srcSet={srcset(base, "webp")} sizes={sizes} />
      <source type="image/jpeg" srcSet={srcset(base, "jpg")} sizes={sizes} />
      <img src={getMediaUrl(base + "tile.jpg")} alt={alt} style={style} loading={loading} draggable={draggable} />
    </picture>
  );
}
