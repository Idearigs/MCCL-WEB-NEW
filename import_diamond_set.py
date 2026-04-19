#!/usr/bin/env python3
"""
import_diamond_set.py
=====================
Imports Diamond-set wedding ring variants from Diamond-set.xlsx into PostgreSQL.
Architecture: Parent-Child
  - Parent: products (1 row per unique Design_Code)
  - Child:  product_variants (1 row per Design_Code + Metal + Quality + Spread + CT + MM)

Column mapping (Excel -> DB):
  Design_Code    -> products.sku + product_variants.sku prefix
  Metal          -> product_variants.metal_id + metal_type
  Quality        -> product_variants.variant_name (partial)
  Diamond_Spread -> product_variants.size (50% / 100%)
  Weight_CT      -> product_variants.carat_weight (DECIMAL)
  Weight_MM      -> product_variants.mm_width (DECIMAL, ring width)

Idempotent: ON CONFLICT (sku) DO NOTHING for products, DO UPDATE for variants.
"""

import os
import re
import sys
import psycopg2
import psycopg2.extras
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed. Run: pip install openpyxl")
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────────────

XLSX_PATH  = Path(__file__).parent / "Diamond-set.xlsx"
BATCH_SIZE = 1000

DB = dict(
    host     = "31.97.116.89",
    port     = 5433,
    dbname   = "mcculloch_db",
    user     = "mcculloch_admin",
    password = "#mcculloch_admin#20026",
)

# Rings jewelry_type id (same as used in import_wedding_variants.py)
RINGS_JEWELRY_TYPE_ID = "dd88e9fd-10dc-4a30-b060-3e4fbf69c915"
# Rings category id (parent for "Wedding Rings" sub-category)
RINGS_CATEGORY_ID     = "43b1d201-b95e-4ad3-ab21-12119403179f"

METAL_COLORS = {
    "9ct Yellow":    "#D4AF37",
    "9ct White":     "#E8E8E8",
    "9ct Red":       "#B76E79",
    "14ct Yellow":   "#CFB53B",
    "14ct White":    "#DCDCDC",
    "14ct Red":      "#AA4A44",
    "18ct Yellow":   "#C5A028",
    "18ct White":    "#D0D0D0",
    "18ct Red":      "#A0522D",
    "Silver":        "#C0C0C0",
    "Platinum 950":  "#E5E4E2",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text


def clean_mm(value) -> float | None:
    """Parse Weight_MM which may contain 'mm' suffix or be a float/int."""
    if value is None:
        return None
    s = str(value).replace("mm", "").strip()
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def quality_short(quality: str) -> str:
    """Shorten quality to 1 char for SKU: Natural->N, Lab->L."""
    if not quality:
        return "?"
    return "N" if quality.strip().lower().startswith("natural") else "L"


def make_variant_sku(code: str, metal: str, quality: str, spread: str,
                     weight_ct: str, weight_mm) -> str:
    """Build deterministic unique SKU. Max 100 chars."""
    q = quality_short(quality)
    mm = str(clean_mm(weight_mm) or "")
    sku = f"{code}|{metal}|{q}|{spread}|{weight_ct}|{mm}"
    return sku[:100]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Diamond-set Wedding Ring Variant Import")
    print("=" * 60)

    if not XLSX_PATH.exists():
        print(f"ERROR: Excel file not found at {XLSX_PATH}")
        sys.exit(1)

    for attempt in range(1, 4):
        try:
            conn = psycopg2.connect(**DB, connect_timeout=30)
            conn.autocommit = False
            cur = conn.cursor()
            cur.execute("SELECT 1")
            break
        except Exception as e:
            print(f"  Connection attempt {attempt} failed: {e}")
            if attempt == 3:
                print("ERROR: Could not connect to database after 3 attempts.")
                sys.exit(1)
            import time; time.sleep(3)

    try:
        # ── Phase 0: DB Prerequisites ──────────────────────────────────────────
        print("\n[Phase 0] Ensuring DB prerequisites …")

        # 0-a. Metals
        print("  Upserting metals in product_metals …")
        metal_id_map: dict[str, str] = {}
        for metal_name, color_code in METAL_COLORS.items():
            cur.execute(
                """
                INSERT INTO product_metals
                    (id, name, color_code, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), %s, %s, true, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
                """,
                (metal_name, color_code),
            )
        conn.commit()
        cur.execute("SELECT id, name FROM product_metals")
        for row in cur.fetchall():
            metal_id_map[row[1]] = row[0]

        # 0-b. "Wedding Rings" category
        print("  Ensuring 'Wedding Rings' category …")
        cur.execute("SELECT id FROM categories WHERE slug = 'wedding-rings'")
        row = cur.fetchone()
        if row:
            category_id = row[0]
            print(f"  Found: {category_id}")
        else:
            cur.execute(
                """
                INSERT INTO categories
                    (id, name, slug, is_active, category_type, parent_id, level,
                     created_at, updated_at)
                VALUES (gen_random_uuid(), 'Wedding Rings', 'wedding-rings', true,
                        'sub_type', %s, 1, NOW(), NOW())
                RETURNING id
                """,
                (RINGS_CATEGORY_ID,),
            )
            category_id = cur.fetchone()[0]
            conn.commit()
            print(f"  Created: {category_id}")

        # 0-c. "Diamond-set" jewelry_sub_type
        print("  Ensuring 'Diamond-set' jewelry_sub_type …")
        cur.execute("SELECT id FROM jewelry_sub_types WHERE slug = 'diamond-set'")
        row = cur.fetchone()
        if row:
            sub_type_id = row[0]
            print(f"  Found: {sub_type_id}")
        else:
            cur.execute(
                """
                INSERT INTO jewelry_sub_types
                    (id, jewelry_type_id, name, slug, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), %s, 'Diamond-set', 'diamond-set', true,
                        NOW(), NOW())
                RETURNING id
                """,
                (RINGS_JEWELRY_TYPE_ID,),
            )
            sub_type_id = cur.fetchone()[0]
            conn.commit()
            print(f"  Created: {sub_type_id}")

        # ── Phase 1: Read Excel & create master products ───────────────────────
        print("\n[Phase 1] Reading Excel file …")
        wb = openpyxl.load_workbook(XLSX_PATH, data_only=True, read_only=True)
        ws = wb.active
        all_rows = list(ws.iter_rows(min_row=2, values_only=True))
        wb.close()
        print(f"  Loaded {len(all_rows):,} data rows")

        # Unique Design_Codes
        seen = set()
        design_codes = []
        for r in all_rows:
            code = r[0]
            if code and code not in seen:
                seen.add(code)
                design_codes.append(code)
        print(f"  {len(design_codes)} unique Design_Codes -> master products")

        print("  Upserting master products …")
        created_count = 0
        for code in design_codes:
            # Use Design_Name from first row for this code (r[1])
            name_row = next((r for r in all_rows if r[0] == code and r[1]), None)
            design_name = (name_row[1] if name_row else None) or f"Diamond Set Ring {code}"
            # Use design_name as product name if it's more descriptive than the code
            product_name = design_name if design_name != code else f"Diamond Set Ring {code}"
            slug = slugify(product_name)

            cur.execute(
                "SELECT id FROM products WHERE slug = %s AND sku != %s",
                (slug, code),
            )
            if cur.fetchone():
                slug = f"{slug}-{code.lower()}"

            cur.execute(
                """
                INSERT INTO products
                    (name, slug, sku, base_price, currency,
                     category_id, jewelry_sub_type_id,
                     is_active, created_at, updated_at)
                VALUES (%s, %s, %s, 0.00, 'GBP', %s, %s, true, NOW(), NOW())
                ON CONFLICT (sku) DO NOTHING
                """,
                (product_name, slug, code, category_id, sub_type_id),
            )
            if cur.rowcount == 1:
                created_count += 1

        conn.commit()
        print(f"  Created {created_count} new  |  {len(design_codes) - created_count} already existed")

        # ── Phase 2: Build lookup dictionaries ────────────────────────────────
        print("\n[Phase 2] Building lookup dictionaries …")
        cur.execute("SELECT sku, id FROM products WHERE sku = ANY(%s)", (design_codes,))
        product_id_map: dict[str, str] = {sku: pid for sku, pid in cur.fetchall()}
        missing = [c for c in design_codes if c not in product_id_map]
        if missing:
            raise RuntimeError(f"{len(missing)} Design_Codes missing after insert: {missing[:10]}")
        print(f"  product_id_map: {len(product_id_map)} entries")
        print(f"  metal_id_map:   {len(metal_id_map)} entries")

        # ── Phase 3: Build and insert variants ────────────────────────────────
        print("\n[Phase 3] Building variant rows …")
        # Cols: Design_Code(0), Design_Name(1), Metal(2), Quality(3),
        #       Diamond_Spread(4), Weight_CT(5), Weight_MM(6)

        variant_rows = []
        skipped = 0
        for r in all_rows:
            code    = r[0] if len(r) > 0 else None
            metal   = r[2] if len(r) > 2 else None
            quality = r[3] if len(r) > 3 else None
            spread  = str(r[4]).strip() if len(r) > 4 and r[4] else None
            wct     = str(r[5]).strip() if len(r) > 5 and r[5] else None
            wmm     = r[6] if len(r) > 6 else None

            if not code or not metal:
                skipped += 1
                continue

            product_id = product_id_map.get(code)
            metal_id   = metal_id_map.get(metal)

            if not product_id:
                print(f"  WARNING: No product_id for '{code}' — skipping")
                skipped += 1
                continue
            if not metal_id:
                print(f"  WARNING: No metal_id for '{metal}' — skipping")
                skipped += 1
                continue

            sku = make_variant_sku(code, metal, quality or "", spread or "", wct or "", wmm)
            # Human-readable: "Natural F/G-VS 50% 0.15ct" or "Lab Grown D-VVS1 100% 0.30ct"
            variant_name = f"{quality or ''} {spread or ''} {wct or ''}ct".strip()
            mm_width     = clean_mm(wmm)
            try:
                carat_weight = float(wct) if wct else None
            except (ValueError, TypeError):
                carat_weight = None
            # Diamond_Spread stored in size column (50% / 100%)
            size = spread

            variant_rows.append((
                product_id,    # product_id
                variant_name,  # variant_name
                sku,           # sku
                metal_id,      # metal_id
                metal,         # metal_type
                mm_width,      # mm_width
                carat_weight,  # carat_weight
                size,          # size (Diamond_Spread)
            ))

        print(f"  {len(variant_rows):,} variants prepared  |  {skipped} rows skipped")

        insert_sql = """
            INSERT INTO product_variants
                (id, product_id, variant_name, sku,
                 metal_id, metal_type, mm_width, carat_weight, size,
                 is_active, price_adjustment, stock_quantity,
                 created_at, updated_at)
            VALUES %s
            ON CONFLICT (sku) DO UPDATE SET
                variant_name  = EXCLUDED.variant_name,
                metal_id      = EXCLUDED.metal_id,
                metal_type    = EXCLUDED.metal_type,
                mm_width      = EXCLUDED.mm_width,
                carat_weight  = EXCLUDED.carat_weight,
                size          = EXCLUDED.size,
                updated_at    = NOW()
        """
        row_template = "(gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, true, 0, 0, NOW(), NOW())"

        total    = len(variant_rows)
        upserted = 0
        print(f"  Inserting in batches of {BATCH_SIZE} …")

        for i in range(0, total, BATCH_SIZE):
            batch = variant_rows[i : i + BATCH_SIZE]
            psycopg2.extras.execute_values(
                cur, insert_sql, batch,
                template=row_template, page_size=BATCH_SIZE,
            )
            conn.commit()
            upserted += len(batch)
            pct = upserted / total * 100
            print(f"  [{pct:5.1f}%] {upserted:,} / {total:,} upserted", end="\r")

        print()

        # ── Summary ───────────────────────────────────────────────────────────
        cur.execute(
            "SELECT COUNT(*) FROM products WHERE jewelry_sub_type_id = %s",
            (sub_type_id,),
        )
        prod_total = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*) FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE p.jewelry_sub_type_id = %s
            """,
            (sub_type_id,),
        )
        var_total = cur.fetchone()[0]

        print("\n" + "=" * 60)
        print("  Import Complete — Diamond-set")
        print("=" * 60)
        print(f"  Master products (Diamond-set sub-type): {prod_total:,}")
        print(f"  Total variants:                         {var_total:,}")
        print(f"  Rows skipped:                           {skipped}")
        print()

    except Exception as exc:
        conn.rollback()
        print(f"\nERROR — rolled back: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
