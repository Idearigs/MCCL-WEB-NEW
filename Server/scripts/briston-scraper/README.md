# Briston Watch Scraper & Importer

A two-step tool to scrape all Briston watch data and import it into the McCulloch database.

---

## Step 1 — Scrape a Collection

Run the scraper with a collection URL or handle:

```bash
cd Server/scripts/briston-scraper

# Using the collection handle (from the URL)
node scraper.js clubmaster-classic

# Using the full URL
node scraper.js https://www.briston-watches.com/en/collections/clubmaster-classic

# Skip image downloading (data only, much faster)
node scraper.js clubmaster-classic --no-images
```

### What it does
1. Fetches all products from the collection via Shopify's JSON API
2. Fetches full details for each product (description, all images, variants)
3. Downloads all product images into `output/<collection>/images/`
4. Saves two JSON files:
   - `output/<collection>/all-products.json` — complete raw data
   - `output/<collection>/import-ready.json` — cleaned data ready for import
   - `output/<collection>/products/<handle>.json` — one file per watch

### Options
| Option | Description |
|--------|-------------|
| `--no-images` | Skip image downloading (much faster) |
| `--delay <ms>` | Delay between requests (default: 800ms) |
| `--out <dir>` | Custom output directory |

---

## Step 2 — Import into Database

After scraping, import the data:

```bash
# Basic import (from Server/ directory)
node scripts/briston-scraper/importer.js scripts/briston-scraper/output/clubmaster-classic/import-ready.json

# Dry run first (shows what would be imported without touching DB)
node scripts/briston-scraper/importer.js output/clubmaster-classic/import-ready.json --dry-run

# Update existing watches instead of skipping them
node scripts/briston-scraper/importer.js output/clubmaster-classic/import-ready.json --update
```

### Options
| Option | Description |
|--------|-------------|
| `--dry-run` | Preview what would be imported, no DB writes |
| `--update` | Update existing watches instead of skipping |
| `--skip-images` | Don't copy images to uploads folder |
| `--brand-id <uuid>` | Use a specific brand UUID |
| `--collection-id <uuid>` | Use a specific collection UUID |

---

## Full Workflow — Collection by Collection

```bash
cd Server/scripts/briston-scraper

# 1. Scrape each collection
node scraper.js clubmaster-classic
node scraper.js clubmaster-sport
node scraper.js clubmaster-diver
node scraper.js clubmaster-chic
node scraper.js streamliner-kennedy
node scraper.js straps-20-mm --no-images

# 2. Dry run to preview
node ../../../Server/scripts/briston-scraper/importer.js output/clubmaster-classic/import-ready.json --dry-run

# 3. Import (run from Server/ directory for correct .env loading)
cd ../../..  # back to Server/
node scripts/briston-scraper/importer.js scripts/briston-scraper/output/clubmaster-classic/import-ready.json
node scripts/briston-scraper/importer.js scripts/briston-scraper/output/clubmaster-sport/import-ready.json
# ... and so on
```

---

## Available Briston Collections

### Clubmaster
| Handle | Description |
|--------|-------------|
| `clubmaster-classic` | Classic chronograph watches |
| `clubmaster-sport` | Sport models |
| `clubmaster-diver` | Dive watches |
| `clubmaster-chic` | Ladies collection |
| `clubmaster-regatta` | Sailing-inspired |
| `clubmaster-legend` | Heritage models |

### Streamliner
| Handle | Description |
|--------|-------------|
| `streamliner-kennedy` | Kennedy series |
| `streamliner-urban` | Urban series |
| `streamliner-gentleman-driver` | Gentleman Driver series |

### Accessories
| Handle | Description |
|--------|-------------|
| `straps-20-mm` | 20mm straps |
| `straps-18mm` | 18mm straps |
| `straps-12-mm` | 12mm straps |

---

## Output Structure

```
output/
  clubmaster-classic/
    all-products.json       ← full scraped data (large)
    import-ready.json       ← cleaned data for import
    products/
      clubmaster-classic-13140-sa-t-1-nk.json
      clubmaster-classic-16140-sa-t-2-nga.json
      ...
    images/
      clubmaster-classic-13140-sa-t-1-nk/
        1.jpg
        2.jpg
        3.jpg
        ...
```

---

## Notes

- **Currency**: Briston prices are in EUR. The importer converts to GBP using ~0.86 rate. Review and adjust prices manually after import.
- **Images**: Remote URLs are stored as fallback if local images aren't available.
- **Duplicates**: The importer skips watches already in the DB (by slug/SKU). Use `--update` to overwrite.
- **Accessories (straps)**: Straps are imported as `product_type = "Accessories"`. They appear in the watch management system under Briston brand.
