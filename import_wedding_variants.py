#!/usr/bin/env python3
"""
import_wedding_variants.py
==========================
Migrates 36,240 Diamond-cut wedding ring variations from Diamond-cut.xlsx
into the PostgreSQL database using a Parent-Child architecture:
  - Parent: products table   (1 row per unique Design_Code)
  - Child:  product_variants (1 row per Design_Code + Metal + Width + Profile + Weight combo)

Usage:
    python import_wedding_variants.py

Idempotent: safe to re-run. Products use ON CONFLICT (sku) DO NOTHING,
variants use ON CONFLICT (sku) DO UPDATE so re-runs update without duplicating.

Column mapping (Excel -> DB):
  Design_Code -> products.sku  /  product_variants.product_id (via lookup)
  Metal       -> product_variants.metal_id (UUID lookup) + metal_type (text)
  Width       -> product_variants.mm_width   (DECIMAL)
  Profile     -> product_variants.variant_name (combined with Weight for readability)
  Weight      -> product_variants.size (text: Light / Medium / Heavy)
               NOTE: Weight is a textual descriptor, not a numeric carat value,
               so it is stored in the `size` VARCHAR column, NOT carat_weight.
  Description -> product_variants.ai_description
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

XLSX_PATH   = Path(__file__).parent / "Diamond-cut.xlsx"
BATCH_SIZE  = 1000

DB = dict(
    host     = "31.97.116.89",
    port     = 5433,
    dbname   = "mcculloch_db",
    user     = "mcculloch_admin",
    password = "#mcculloch_admin#20026",
)

# Rings jewelry_type id (already confirmed in DB)
RINGS_JEWELRY_TYPE_ID = "dd88e9fd-10dc-4a30-b060-3e4fbf69c915"
# Rings category id (parent for "Wedding Rings" sub-category)
RINGS_CATEGORY_ID     = "43b1d201-b95e-4ad3-ab21-12119403179f"

# Approximate hex colour codes for the new metals
METAL_COLORS = {
    "9ct Yellow":  "#D4AF37",
    "9ct White":   "#E8E8E8",
    "9ct Red":     "#B76E79",
    "14ct Yellow": "#CFB53B",
    "14ct White":  "#DCDCDC",
    "14ct Red":    "#AA4A44",
    "18ct Yellow": "#C5A028",
    "18ct White":  "#D0D0D0",
    "18ct Red":    "#A0522D",
    "Silver":      "#C0C0C0",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text


def make_variant_sku(code: str, metal: str, width, profile: str, weight: str) -> str:
    """Build a deterministic, unique SKU for a variant row."""
    # Pipe-separated for readability; all five dimensions needed for uniqueness
    width_str = str(width) if width is not None else ""
    sku = f"{code}|{metal}|{width_str}|{profile}|{weight}"
    return sku[:100]  # column is VARCHAR(100)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Diamond-cut Wedding Ring Variant Import")
    print("=" * 60)

    if not XLSX_PATH.exists():
        print(f"ERROR: Excel file not found at {XLSX_PATH}")
        sys.exit(1)

    # Retry connection up to 3 times (remote DB may drop idle connections)
    for attempt in range(1, 4):
        try:
            conn = psycopg2.connect(**DB, connect_timeout=30)
            conn.autocommit = False
            cur = conn.cursor()
            cur.execute("SELECT 1")  # confirm connection is alive
            break
        except Exception as e:
            print(f"  Connection attempt {attempt} failed: {e}")
            if attempt == 3:
                print("ERROR: Could not connect to database after 3 attempts.")
                sys.exit(1)
            import time; time.sleep(3)

    try:
        # ── Phase 0: Ensure DB Prerequisites ─────────────────────────────────
        print("\n[Phase 0] Ensuring DB prerequisites …")

        # 0-a. Metals — insert any that don't yet exist
        print("  Creating missing metals in product_metals …")
        metal_id_map: dict[str, str] = {}
        for metal_name, color_code in METAL_COLORS.items():
            cur.execute(
                """
                INSERT INTO product_metals
                    (id, name, color_code, is_active, created_at, updated_at)
                VALUES
                    (gen_random_uuid(), %s, %s, true, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
                """,
                (metal_name, color_code),
            )
        conn.commit()

        # Fetch all ids in one query (including any pre-existing ones)
        cur.execute("SELECT id, name FROM product_metals")
        for row in cur.fetchall():
            metal_id_map[row[1]] = row[0]

        # Verify every Excel metal is covered
        missing_metals = [m for m in METAL_COLORS if m not in metal_id_map]
        if missing_metals:
            raise RuntimeError(f"Metals still missing after insert: {missing_metals}")
        print(f"  {len(metal_id_map)} metals available (10 new + existing).")

        # 0-b. "Wedding Rings" category
        print("  Ensuring 'Wedding Rings' category …")
        cat_slug = "wedding-rings"
        cur.execute("SELECT id FROM categories WHERE slug = %s", (cat_slug,))
        row = cur.fetchone()
        if row:
            category_id = row[0]
            print(f"  Found existing: {category_id}")
        else:
            cur.execute(
                """
                INSERT INTO categories
                    (id, name, slug, is_active, category_type, parent_id, level,
                     created_at, updated_at)
                VALUES
                    (gen_random_uuid(), 'Wedding Rings', %s, true, 'sub_type',
                     %s, 1, NOW(), NOW())
                RETURNING id
                """,
                (cat_slug, RINGS_CATEGORY_ID),
            )
            category_id = cur.fetchone()[0]
            conn.commit()
            print(f"  Created 'Wedding Rings' category: {category_id}")

        # 0-c. "Diamond-cut" jewelry_sub_type
        print("  Ensuring 'Diamond-cut' jewelry_sub_type …")
        cur.execute(
            "SELECT id FROM jewelry_sub_types WHERE slug = 'diamond-cut'"
        )
        row = cur.fetchone()
        if row:
            sub_type_id = row[0]
            print(f"  Found existing: {sub_type_id}")
        else:
            cur.execute(
                """
                INSERT INTO jewelry_sub_types
                    (id, jewelry_type_id, name, slug, is_active, created_at, updated_at)
                VALUES
                    (gen_random_uuid(), %s, 'Diamond-cut', 'diamond-cut', true, NOW(), NOW())
                RETURNING id
                """,
                (RINGS_JEWELRY_TYPE_ID,),
            )
            sub_type_id = cur.fetchone()[0]
            conn.commit()
            print(f"  Created 'Diamond-cut' sub-type: {sub_type_id}")

        # ── Phase 1: Read Excel & create master products ───────────────────────
        print("\n[Phase 1] Reading Excel file …")
        wb = openpyxl.load_workbook(XLSX_PATH, data_only=True, read_only=True)
        ws = wb.active
        all_rows = list(ws.iter_rows(min_row=2, values_only=True))
        wb.close()
        print(f"  Loaded {len(all_rows):,} data rows from {XLSX_PATH.name}")

        # Collect unique Design_Codes (preserving order for nicer logging)
        seen = set()
        design_codes = []
        for r in all_rows:
            code = r[0]
            if code and code not in seen:
                seen.add(code)
                design_codes.append(code)
        print(f"  {len(design_codes)} unique Design_Codes -> master products")

        # Bulk-upsert master products (ON CONFLICT on sku = DO NOTHING)
        print("  Upserting master products …")
        created_count = 0
        for code in design_codes:
            name = f"Wedding Ring {code}"
            slug = slugify(name)

            # Handle slug collision (if another product with same slug exists)
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
                VALUES
                    (%s, %s, %s, 0.00, 'GBP',
                     %s, %s,
                     true, NOW(), NOW())
                ON CONFLICT (sku) DO NOTHING
                """,
                (name, slug, code, category_id, sub_type_id),
            )
            if cur.rowcount == 1:
                created_count += 1

        conn.commit()
        existing_count = len(design_codes) - created_count
        print(f"  Created {created_count} new  |  Skipped {existing_count} already existing")

        # ── Phase 2: Build lookup dictionaries ────────────────────────────────
        print("\n[Phase 2] Building lookup dictionaries …")

        cur.execute(
            "SELECT sku, id FROM products WHERE sku = ANY(%s)",
            (design_codes,),
        )
        product_id_map: dict[str, str] = {sku: pid for sku, pid in cur.fetchall()}
        missing = [c for c in design_codes if c not in product_id_map]
        if missing:
            raise RuntimeError(
                f"{len(missing)} Design_Codes not found in products after insert: {missing[:10]}"
            )
        print(f"  product_id_map: {len(product_id_map)} entries")
        print(f"  metal_id_map:   {len(metal_id_map)} entries")

        # ── Phase 3: Bulk variant insertion ───────────────────────────────────
        print("\n[Phase 3] Building variant rows …")

        variant_rows = []
        skipped = 0
        for r in all_rows:
            code        = r[0] if len(r) > 0 else None
            metal       = r[1] if len(r) > 1 else None
            width       = r[2] if len(r) > 2 else None
            profile     = r[3] if len(r) > 3 else None
            weight      = r[4] if len(r) > 4 else None
            description = r[5] if len(r) > 5 else None

            if not code or not metal or not profile:
                skipped += 1
                continue

            product_id = product_id_map.get(code)
            metal_id   = metal_id_map.get(metal)

            if not product_id:
                print(f"  WARNING: No product_id for Design_Code '{code}' — skipping row")
                skipped += 1
                continue
            if not metal_id:
                print(f"  WARNING: No metal_id for metal '{metal}' — skipping row")
                skipped += 1
                continue

            sku          = make_variant_sku(code, metal, width, profile, weight or "")
            # variant_name encodes Profile + Weight for human readability
            variant_name = f"{profile} ({weight})" if weight else profile
            mm_width     = float(width) if width is not None else None
            # Weight is "Light / Medium / Heavy" — stored in `size` (VARCHAR)
            size         = str(weight) if weight else None
            # Column F may contain unresolved Gemini formula references — store as-is
            ai_desc      = str(description) if description else None

            variant_rows.append((
                product_id,   # product_id
                variant_name, # variant_name
                sku,          # sku
                metal_id,     # metal_id
                metal,        # metal_type (human-readable)
                mm_width,     # mm_width
                size,         # size  (Light / Medium / Heavy)
                ai_desc,      # ai_description
            ))

        print(f"  {len(variant_rows):,} variants prepared  |  {skipped} rows skipped")

        # Bulk insert in batches of BATCH_SIZE
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
        # Template: gen_random_uuid() for id, then 8 %s placeholders
        row_template = "(gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, true, 0, 0, NOW(), NOW())"

        total   = len(variant_rows)
        upserted = 0
        print(f"  Inserting in batches of {BATCH_SIZE} …")

        for i in range(0, total, BATCH_SIZE):
            batch = variant_rows[i : i + BATCH_SIZE]
            psycopg2.extras.execute_values(
                cur,
                insert_sql,
                batch,
                template=row_template,
                page_size=BATCH_SIZE,
            )
            conn.commit()
            upserted += len(batch)
            pct = upserted / total * 100
            print(f"  [{pct:5.1f}%] {upserted:,} / {total:,} variants upserted", end="\r")

        print()  # newline after \r progress

        # ── Summary ───────────────────────────────────────────────────────────
        cur.execute(
            "SELECT COUNT(*) FROM products WHERE category_id = %s",
            (category_id,),
        )
        prod_total = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*) FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE p.category_id = %s
            """,
            (category_id,),
        )
        var_total = cur.fetchone()[0]

        print("\n" + "=" * 60)
        print("  Import Complete")
        print("=" * 60)
        print(f"  Master products (Wedding Rings category): {prod_total:,}")
        print(f"  Total variants linked to those products:  {var_total:,}")
        print(f"  Rows skipped (missing code/metal/profile): {skipped}")
        print(f"  Metals in product_metals:                 {len(metal_id_map)}")
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
