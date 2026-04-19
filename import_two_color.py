#!/usr/bin/env python3
"""
import_two_color.py
===================
Imports Two Colour wedding ring variants from Two Color.xlsx into PostgreSQL.
Architecture: Parent-Child
  - Parent: products (1 row per unique Design_Code)
  - Child:  product_variants (1 row per Design_Code + Base_Metal + Sleeve_Metal + Width + Weight)

Column mapping (Excel -> DB):
  Design_Code  -> products.sku + variant sku prefix
  Width        -> product_variants.mm_width (DECIMAL)
  Weight       -> product_variants.size (Light / Medium / Heavy)
  Base_Metal   -> product_variants.metal_id + metal_type
  Sleeve_Metal -> product_variants.ai_description (stored as "Sleeve: <metal>")

Idempotent: ON CONFLICT (sku) DO NOTHING for products, DO UPDATE for variants.
"""

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

XLSX_PATH  = Path(__file__).parent / "Two Color.xlsx"
BATCH_SIZE = 1000

DB = dict(
    host     = "31.97.116.89",
    port     = 5433,
    dbname   = "mcculloch_db",
    user     = "mcculloch_admin",
    password = "#mcculloch_admin#20026",
)

RINGS_JEWELRY_TYPE_ID = "dd88e9fd-10dc-4a30-b060-3e4fbf69c915"
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


def make_variant_sku(code: str, base_metal: str, sleeve_metal: str,
                     width, weight: str) -> str:
    """Build deterministic unique SKU. Max 100 chars."""
    w = str(width) if width is not None else ""
    sku = f"{code}|{base_metal}|{sleeve_metal}|{w}|{weight}"
    return sku[:100]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Two Colour Wedding Ring Variant Import")
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

        # 0-c. "Two Colour" jewelry_sub_type
        print("  Ensuring 'Two Colour' jewelry_sub_type …")
        cur.execute("SELECT id FROM jewelry_sub_types WHERE slug = 'two-colour'")
        row = cur.fetchone()
        if row:
            sub_type_id = row[0]
            print(f"  Found: {sub_type_id}")
        else:
            cur.execute(
                """
                INSERT INTO jewelry_sub_types
                    (id, jewelry_type_id, name, slug, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), %s, 'Two Colour', 'two-colour', true,
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

        # Unique Design_Codes (in order)
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
            product_name = f"Two Colour Wedding Ring {code}"
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

        # ── Phase 2: Lookup dictionaries ──────────────────────────────────────
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
        # Cols: Design_Code(0), Design_Name(1), Width(2), Weight(3),
        #       Base_Metal(4), Sleeve_Metal(5)

        variant_rows = []
        skipped = 0
        for r in all_rows:
            code         = r[0] if len(r) > 0 else None
            width        = r[2] if len(r) > 2 else None
            weight       = str(r[3]).strip() if len(r) > 3 and r[3] else None
            base_metal   = r[4] if len(r) > 4 else None
            sleeve_metal = r[5] if len(r) > 5 else None

            if not code or not base_metal or not sleeve_metal:
                skipped += 1
                continue

            product_id   = product_id_map.get(code)
            base_metal_id = metal_id_map.get(base_metal)

            if not product_id:
                print(f"  WARNING: No product_id for '{code}' — skipping")
                skipped += 1
                continue
            if not base_metal_id:
                print(f"  WARNING: No metal_id for base metal '{base_metal}' — skipping")
                skipped += 1
                continue

            sku = make_variant_sku(code, base_metal, sleeve_metal, width, weight or "")
            # Human-readable: "9ct Yellow / 9ct White (Light)"
            variant_name = f"{base_metal} / {sleeve_metal} ({weight})" if weight else f"{base_metal} / {sleeve_metal}"
            try:
                mm_width = float(width) if width is not None else None
            except (ValueError, TypeError):
                mm_width = None
            # Sleeve metal stored in ai_description for display purposes
            ai_desc = f"Sleeve: {sleeve_metal}"

            variant_rows.append((
                product_id,     # product_id
                variant_name,   # variant_name
                sku,            # sku
                base_metal_id,  # metal_id (base metal)
                base_metal,     # metal_type
                mm_width,       # mm_width
                weight,         # size (Light/Medium/Heavy)
                ai_desc,        # ai_description (sleeve metal)
            ))

        print(f"  {len(variant_rows):,} variants prepared  |  {skipped} rows skipped")

        insert_sql = """
            INSERT INTO product_variants
                (id, product_id, variant_name, sku,
                 metal_id, metal_type, mm_width, size, ai_description,
                 is_active, price_adjustment, stock_quantity,
                 created_at, updated_at)
            VALUES %s
            ON CONFLICT (sku) DO UPDATE SET
                variant_name   = EXCLUDED.variant_name,
                metal_id       = EXCLUDED.metal_id,
                metal_type     = EXCLUDED.metal_type,
                mm_width       = EXCLUDED.mm_width,
                size           = EXCLUDED.size,
                ai_description = EXCLUDED.ai_description,
                updated_at     = NOW()
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
        print("  Import Complete — Two Colour")
        print("=" * 60)
        print(f"  Master products (Two Colour sub-type): {prod_total:,}")
        print(f"  Total variants:                        {var_total:,}")
        print(f"  Rows skipped:                          {skipped}")
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
