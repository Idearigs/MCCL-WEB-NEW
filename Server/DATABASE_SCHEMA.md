# McCulloch Jewellers — Database Schema

> **Last updated:** 2026-03-04 (legacy FK columns ring_type_id, stone_shape_id, stone_type_id dropped from products; junction tables are sole source of truth)
> **Database:** PostgreSQL 15+
> **ORM:** Sequelize (product/watch/jewelry/order models) + raw `pg` Pool (users, auth)
> **Total tables:** 42

---

## Table of Contents

1. [Auth & Users](#auth--users)
2. [Product Catalogue](#product-catalogue)
3. [Product Reference / Lookup Tables](#product-reference--lookup-tables)
4. [Product Junction Tables](#product-junction-tables)
5. [Watch System](#watch-system)
6. [Jewelry Category Types](#jewelry-category-types)
7. [Orders](#orders)
8. [CMS & Marketing](#cms--marketing)
9. [Live Chat](#live-chat)
10. [Relationships Diagram](#relationships-diagram)
11. [Indexes](#indexes)

---

## Auth & Users

### `admin_users`
Admin panel accounts.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| email | VARCHAR(255) | unique, not null |
| password | VARCHAR(255) | bcrypt hashed, not null |
| first_name | VARCHAR(100) | not null |
| last_name | VARCHAR(100) | not null |
| role | ENUM | `super_admin`, `admin`, `editor` — default `admin` |
| avatar | VARCHAR(500) | nullable |
| is_active | BOOLEAN | default true |
| last_login_at | TIMESTAMPTZ | nullable |
| login_count | INTEGER | default 0 |
| password_changed_at | TIMESTAMPTZ | default NOW |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `admin_sessions`
JWT session tracking per device.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| admin_user_id | UUID FK → admin_users | not null |
| token_hash | VARCHAR(255) | unique |
| refresh_token_hash | VARCHAR(255) | unique, nullable |
| device_name | VARCHAR(255) | nullable |
| device_id | VARCHAR(255) | nullable |
| ip_address | VARCHAR(45) | |
| user_agent | TEXT | |
| is_active | BOOLEAN | default true |
| is_linked | BOOLEAN | default true |
| last_active_at | TIMESTAMPTZ | |
| expires_at | TIMESTAMPTZ | not null |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `users`
Customer / shopper accounts (raw SQL via `pg` pool).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| email | VARCHAR(255) | unique, not null |
| password_hash | VARCHAR(255) | bcrypt hashed |
| first_name | VARCHAR(255) | nullable |
| last_name | VARCHAR(255) | nullable |
| email_verified | BOOLEAN | default false |
| newsletter_subscribed | BOOLEAN | default true |
| verification_token | VARCHAR | nullable |
| verification_token_expires | TIMESTAMPTZ | nullable |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `refresh_tokens`
User JWT refresh tokens.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | not null |
| token | TEXT | the JWT refresh token |
| expires_at | TIMESTAMPTZ | not null |
| user_agent | TEXT | nullable |
| ip_address | VARCHAR(45) | nullable |
| created_at | TIMESTAMPTZ | auto |

---

## Product Catalogue

### `categories`
Hierarchical product categories (supports nested levels).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(100) | not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| image_url | TEXT | nullable |
| parent_id | UUID FK → categories | nullable (self-ref) |
| category_type | ENUM | `main`, `sub_type`, `sub_gemstone`, `sub_metal`, `sub_eternity` |
| level | INTEGER | 0=main, 1=sub, 2=sub-sub |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| meta_title | VARCHAR(200) | nullable |
| meta_description | TEXT | nullable |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `collections`
Named product collections (e.g., "Summer 2024").

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(100) | unique, not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| image_url | TEXT | nullable |
| is_active | BOOLEAN | default true |
| is_featured | BOOLEAN | default false |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `products`
Main jewellery product records (rings, earrings, necklaces, bracelets).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(255) | not null |
| slug | VARCHAR(255) | unique, not null |
| description | TEXT | nullable |
| short_description | TEXT | nullable |
| sku | VARCHAR(100) | unique, nullable — format `BJ-XXX` |
| base_price | DECIMAL(10,2) | not null |
| sale_price | DECIMAL(10,2) | nullable |
| currency | VARCHAR(3) | default `GBP` |
| is_active | BOOLEAN | default true |
| is_featured | BOOLEAN | default false |
| in_stock | BOOLEAN | default true |
| stock_quantity | INTEGER | default 0 |
| is_made_on_request | BOOLEAN | default false |
| made_on_request_lead_time | VARCHAR(100) | default `4-6 weeks` |
| made_on_request_message | TEXT | nullable |
| weight | DECIMAL(8,3) | nullable |
| dimensions | JSONB | nullable |
| care_instructions | TEXT | nullable |
| warranty_info | TEXT | nullable |
| nivoda_enabled | BOOLEAN | default false |
| show_stone_type | BOOLEAN | default false |
| show_carat | BOOLEAN | default false |
| show_clarity | BOOLEAN | default false |
| show_colour | BOOLEAN | default false |
| show_cut | BOOLEAN | default false |
| show_certificate | BOOLEAN | default false |
| certificate | VARCHAR(255) | nullable |
| nivoda_options_config | JSONB | nullable — `{stoneType, caratRange, …}` |
| meta_title | VARCHAR(200) | nullable |
| meta_description | TEXT | nullable |
| sort_order | INTEGER | default 0 |
| category_id | UUID FK → categories | nullable |
| collection_id | UUID FK → collections | nullable |
| metal_id | UUID FK → product_metals | nullable (primary metal) |
| jewelry_sub_type_id | UUID FK → jewelry_sub_types | nullable |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `product_images`
Images for products, optionally linked to a specific metal or diamond size.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| product_id | UUID FK → products | not null |
| metal_id | UUID FK → product_metals | nullable |
| image_url | VARCHAR(500) | not null |
| alt_text | VARCHAR(255) | nullable |
| is_primary | BOOLEAN | default false |
| is_metal_preview | BOOLEAN | default false |
| diamond_size_id | UUID FK → diamond_sizes | nullable |
| is_diamond_size_preview | BOOLEAN | default false |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `product_videos`
Videos for products, optionally linked to a metal.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| product_id | UUID FK → products | not null |
| metal_id | UUID FK → product_metals | nullable |
| video_url | VARCHAR(500) | not null |
| title | VARCHAR(255) | nullable |
| description | TEXT | nullable |
| duration | INTEGER | nullable (seconds) |
| thumbnail_url | VARCHAR(500) | nullable |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `product_variants`
Per-product variants (size, metal option, etc.).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| product_id | UUID FK → products | not null |
| variant_name | VARCHAR(100) | not null |
| sku | VARCHAR(100) | unique, nullable |
| price_adjustment | DECIMAL(10,2) | default 0 |
| metal_type | VARCHAR(50) | legacy string field |
| metal_color | VARCHAR(7) | hex |
| size | VARCHAR(20) | nullable |
| gemstone_type | VARCHAR(50) | nullable |
| gemstone_carat | DECIMAL(5,2) | nullable |
| stock_quantity | INTEGER | default 0 |
| is_active | BOOLEAN | default true |
| price | DECIMAL(10,2) | nullable — absolute price override |
| carat_weight | DECIMAL(5,3) | nullable |
| mm_width | DECIMAL(5,2) | nullable |
| metal_id | UUID FK → product_metals | nullable |
| ai_description | TEXT | nullable |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `user_favorites`
Customer saved / wishlist products (raw SQL).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | not null |
| product_id | UUID FK → products | not null |
| notes | TEXT | nullable |
| created_at | TIMESTAMPTZ | auto |

---

## Product Reference / Lookup Tables

### `product_metals`
Available metal options (e.g., Rose Gold, White Gold).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(50) | unique, not null |
| color_code | VARCHAR(7) | hex, not null |
| price_multiplier | DECIMAL(5,4) | default 1.0000 |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `ring_types`
Ring style categories (Solitaire, Halo, Vintage, etc.).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(100) | unique, not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `stone_shapes`
Stone shapes (Round, Princess, Oval, etc.).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(100) | unique, not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `stone_types`
Stone / gemstone types (Natural Diamond, Lab Grown, Sapphire, etc.).
Also used as the gemstone list for filter menus.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(100) | unique, not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `product_sizes`
Ring / jewellery sizes per category.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| size_name | VARCHAR(20) | not null |
| size_value | VARCHAR(20) | not null |
| category_id | UUID FK → categories | nullable |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (size_name, size_value, category_id) | |

### `diamond_sizes`
Diamond size options for engagement rings (A–F variants).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(50) | unique, not null — e.g., `A`, `B`, `C` |
| display_name | VARCHAR(100) | nullable — e.g., `0.50ct` |
| description | TEXT | nullable |
| sort_order | INTEGER | default 0 |
| is_active | BOOLEAN | default true |
| created_at / updated_at | TIMESTAMPTZ | auto |

---

## Product Junction Tables

Many-to-many relationships between products and their categories/attributes.

### `product_ring_types`
Products ↔ Ring Types (primary M:N relationship used for filtering).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| product_id | UUID FK → products | not null |
| ring_type_id | UUID FK → ring_types | not null |
| created_at / updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (product_id, ring_type_id) | |

### `product_metals_junction`
Products ↔ Metals available for each product.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| product_id | UUID FK → products | not null |
| metal_id | UUID FK → product_metals | not null |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() (added via add-indexes.js) |
| UNIQUE | (product_id, metal_id) | |

### `product_stone_shapes`
Products ↔ Stone Shapes.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| product_id | UUID FK → products | not null |
| stone_shape_id | UUID FK → stone_shapes | not null |
| created_at / updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (product_id, stone_shape_id) | |

### `product_stone_types`
Products ↔ Stone Types (Gemstones).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| product_id | UUID FK → products | not null |
| stone_type_id | UUID FK → stone_types | not null |
| created_at / updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (product_id, stone_type_id) | |

### `product_diamond_sizes`
Products ↔ Diamond Sizes (engagement ring variants A–F).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| product_id | UUID FK → products | not null |
| diamond_size_id | UUID FK → diamond_sizes | not null |
| created_at / updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (product_id, diamond_size_id) | |

---

## Watch System

### `watch_brands`
Watch brands (Festina, Briston, Roamer).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(100) | unique, not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| logo_url | TEXT | nullable |
| website_url | TEXT | nullable |
| founded_year | INTEGER | nullable |
| country_origin | VARCHAR(100) | nullable |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| meta_title | VARCHAR(255) | nullable |
| meta_description | TEXT | nullable |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `watch_collections`
Watch collections per brand.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| brand_id | UUID FK → watch_brands | not null |
| name | VARCHAR(100) | not null |
| slug | VARCHAR(100) | not null |
| description | TEXT | nullable |
| image_url | TEXT | nullable |
| is_featured | BOOLEAN | default false |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| launch_year | INTEGER | nullable |
| target_audience | ENUM | `men`, `women`, `unisex`, `children` |
| created_at / updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (brand_id, slug) | |

### `watches`
Individual watch models.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| brand_id | UUID FK → watch_brands | not null |
| collection_id | UUID FK → watch_collections | nullable |
| name | VARCHAR(200) | not null |
| slug | VARCHAR(200) | unique, not null |
| model_number | VARCHAR(100) | unique, nullable |
| short_description | TEXT | nullable |
| description | TEXT | nullable |
| base_price | DECIMAL(10,2) | not null |
| sale_price | DECIMAL(10,2) | nullable |
| currency | VARCHAR(3) | default `GBP` |
| sku | VARCHAR(100) | unique, nullable |
| gender | ENUM | `men`, `women`, `unisex`, `children` |
| watch_type | ENUM | `analog`, `digital`, `hybrid`, `smart` |
| style | ENUM | `dress`, `sport`, `casual`, `luxury`, `diving`, `aviation`, `military` |
| warranty_years | INTEGER | default 2 |
| care_instructions | TEXT | nullable |
| is_featured | BOOLEAN | default false |
| is_active | BOOLEAN | default true |
| in_stock | BOOLEAN | default true |
| stock_quantity | INTEGER | default 0 |
| sort_order | INTEGER | default 0 |
| meta_title | VARCHAR(255) | nullable |
| meta_description | TEXT | nullable |
| availability_status | ENUM | `in_stock`, `low_stock`, `out_of_stock`, `pre_order`, `discontinued` |
| technical_specs | JSONB | nullable — brand-specific specs |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `watch_images`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| watch_id | UUID FK → watches | not null |
| image_url | TEXT | not null |
| alt_text | VARCHAR(255) | nullable |
| is_primary | BOOLEAN | default false |
| sort_order | INTEGER | default 0 |
| image_type | ENUM | `product`, `lifestyle`, `detail`, `packaging` |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `watch_videos`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| watch_id | UUID FK → watches | not null |
| video_url | TEXT | not null |
| video_type | ENUM | `youtube`, `vimeo`, `mp4`, `webm` |
| title | VARCHAR(255) | nullable |
| description | TEXT | nullable |
| thumbnail_url | TEXT | nullable |
| duration_seconds | INTEGER | nullable |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `watch_specifications`
Detailed spec sheet for each watch (1:1 with watches).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| watch_id | UUID FK → watches | not null |
| movement | VARCHAR(100) | Quartz, Automatic, Manual |
| movement_type | VARCHAR(100) | alternative movement field |
| movement_name | VARCHAR(100) | specific movement name |
| movement_accuracy | VARCHAR(100) | |
| movement_battery_type | VARCHAR(100) | |
| movement_manufacturing | VARCHAR(255) | |
| case_material | VARCHAR(100) | Stainless Steel, Gold, Titanium |
| case_diameter | VARCHAR(50) | e.g., `42mm` |
| case_thickness | VARCHAR(50) | e.g., `12mm` |
| case_shape | VARCHAR(100) | Round, Square, etc. |
| case_weight | VARCHAR(50) | |
| dial_color / dial_colour | VARCHAR(50/100) | |
| dial | TEXT | detailed dial description |
| dial_crystal | VARCHAR(100) | |
| dial_hands_count | VARCHAR(50) | |
| crystal_material / glass_type | VARCHAR(100) | Sapphire, Mineral |
| strap_material | VARCHAR(100) | Leather, Steel, Rubber |
| strap_color | VARCHAR(50) | |
| strap_width | VARCHAR(50) | |
| water_resistance / watertightness | VARCHAR(50/100) | |
| weight | VARCHAR(50) | |
| power_reserve | VARCHAR(50) | |
| complications | TEXT | Date, Chronograph, GMT |
| functions | TEXT | watch functions (Festina) |
| features | TEXT | watch features |
| additional_features | TEXT | |
| lug_width | VARCHAR(50) | |
| buckle_type | VARCHAR(100) | |
| battery_life | VARCHAR(100) | |
| antimagnetic_protection | VARCHAR(100) | Roamer |
| shock_resistance | VARCHAR(100) | Roamer |
| luminosity | VARCHAR(100) | Roamer |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `watch_variants`
Watch variants (different straps, dial colours, etc.).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| watch_id | UUID FK → watches | not null |
| variant_name | VARCHAR(200) | not null |
| sku | VARCHAR(100) | unique, nullable |
| price_adjustment | DECIMAL(10,2) | default 0 |
| size | VARCHAR(50) | nullable |
| strap_type | VARCHAR(100) | nullable |
| strap_color | VARCHAR(50) | nullable |
| dial_variant | VARCHAR(100) | nullable |
| stock_quantity | INTEGER | default 0 |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

---

## Jewelry Category Types

Used for filtering the Earrings, Necklaces, Bracelets pages.

### `jewelry_types`
Top-level jewelry categories (Rings, Earrings, Necklaces, Bracelets).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(100) | unique, not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| icon | VARCHAR(50) | icon name for UI |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `jewelry_sub_types`
Subcategories of a jewelry type (e.g., Rings → Engagement, Wedding).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| jewelry_type_id | UUID FK → jewelry_types | not null |
| name | VARCHAR(100) | not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| image_url | TEXT | nullable |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (jewelry_type_id, name) | |

### `earring_types`
Earring style filter values (Studs, Hoops, Drops, etc.).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(100) | unique, not null |
| slug | VARCHAR(100) | unique, not null |
| description | TEXT | nullable |
| is_active | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `necklace_types`
Necklace style filter values (Pendants, Chains, Chokers, etc.).

_(same columns as earring_types)_

### `bracelet_types`
Bracelet style filter values (Bangles, Chains, Cuffs, etc.).

_(same columns as earring_types)_

---

## Orders

### `orders`
Customer orders (Stripe-integrated).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| order_number | VARCHAR(50) | unique, not null — e.g., `ORD-1234567890` |
| customer_name | VARCHAR(255) | not null |
| customer_email | VARCHAR(255) | not null |
| customer_phone | VARCHAR(20) | nullable |
| status | ENUM | `pending`, `processing`, `shipped`, `delivered`, `cancelled` |
| payment_status | ENUM | `pending`, `processing`, `paid`, `failed`, `cancelled`, `requires_action` |
| payment_method | VARCHAR(50) | default `stripe` |
| stripe_payment_id | VARCHAR(255) | unique, nullable |
| total_amount | DECIMAL(12,2) | not null |
| subtotal | DECIMAL(12,2) | nullable |
| tax_amount | DECIMAL(12,2) | default 0 |
| shipping_cost | DECIMAL(12,2) | default 0 |
| discount_amount | DECIMAL(12,2) | default 0 |
| currency | VARCHAR(3) | default `GBP` |
| shipping_address | JSONB | nullable |
| billing_address | JSONB | nullable |
| shipping_method | VARCHAR(100) | default `standard` |
| tracking_number | VARCHAR(100) | nullable |
| notes | TEXT | internal notes, nullable |
| customer_notes | TEXT | nullable |
| ip_address | VARCHAR(45) | nullable |
| user_agent | TEXT | nullable |
| paid_at | TIMESTAMPTZ | nullable |
| shipped_at | TIMESTAMPTZ | nullable |
| delivered_at | TIMESTAMPTZ | nullable |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `order_items`
Line items within an order (snapshotted at purchase time).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| order_id | UUID FK → orders | not null, CASCADE |
| product_id | UUID | nullable (soft reference to products) |
| product_variant_id | UUID | nullable |
| product_name | VARCHAR(255) | not null — snapshot |
| product_sku | VARCHAR(100) | nullable |
| product_type | VARCHAR(50) | `watch`, `ring`, `jewelry`, etc. |
| quantity | INTEGER | not null, min 1 |
| unit_price | DECIMAL(12,2) | not null — snapshot |
| total_price | DECIMAL(12,2) | not null — qty × unit_price |
| discount_amount | DECIMAL(12,2) | default 0 |
| tax_amount | DECIMAL(12,2) | default 0 |
| attributes | JSONB | nullable — size, colour, metal snapshot |
| created_at / updated_at | TIMESTAMPTZ | auto |

---

## CMS & Marketing

### `marketing_content`
Featured product/design release sections (home page cards, etc.).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| title | VARCHAR(255) | not null |
| description | TEXT | nullable |
| product_id | UUID FK → products | nullable |
| video_url | VARCHAR(500) | YouTube / video URL, nullable |
| thumbnail_image | VARCHAR(500) | nullable |
| is_active | BOOLEAN | default true |
| is_featured | BOOLEAN | default false |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `promotions`
Popup and marquee banner promotions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| title | VARCHAR(255) | not null |
| description | TEXT | nullable |
| product_id | UUID FK → products | nullable |
| discount_percentage | INTEGER | nullable |
| banner_text | VARCHAR(500) | main marquee text, nullable |
| banner_text_1…5 | VARCHAR(500) | up to 5 marquee items, nullable |
| image_url | VARCHAR(500) | popup image, nullable |
| is_active | BOOLEAN | default true |
| show_popup | BOOLEAN | default true |
| show_banner | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at / updated_at | TIMESTAMPTZ | auto |

---

## Live Chat

### `chats`
Customer chat sessions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| customer_name | VARCHAR(100) | not null |
| customer_email | VARCHAR(255) | not null |
| customer_user_id | UUID | nullable — null = anonymous |
| assigned_admin_id | UUID FK → admin_users | nullable |
| status | ENUM | `active`, `closed`, `waiting` — default `waiting` |
| subject | VARCHAR(255) | nullable |
| last_message_at | TIMESTAMPTZ | nullable |
| is_archived | BOOLEAN | default false |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `chat_messages`
Individual messages in a chat session.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| chat_id | UUID FK → chats | not null, CASCADE |
| sender_type | ENUM | `customer`, `admin` |
| sender_id | UUID | nullable — customer or admin UUID |
| message | TEXT | not null |
| attachment_url | VARCHAR(500) | nullable |
| is_read | BOOLEAN | default false |
| read_at | TIMESTAMPTZ | nullable |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `chat_labels`
Colour-coded labels for categorising chats.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| name | VARCHAR(50) | unique, not null |
| color | VARCHAR(7) | hex e.g. `#ef4444`, not null |
| created_at / updated_at | TIMESTAMPTZ | auto |

### `chat_label_assignments`
Junction: Chats ↔ Labels (many-to-many).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| chat_id | UUID FK → chats | not null, CASCADE |
| label_id | UUID FK → chat_labels | not null, CASCADE |
| created_at / updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (chat_id, label_id) | |

---

## Relationships Diagram

```
admin_users ──< admin_sessions

users ──< refresh_tokens
users ──< user_favorites >── products

categories ──< categories (self-ref hierarchy)
categories ──< products
categories ──< product_sizes
collections ──< products

products ──< product_images
products ──< product_videos
products ──< product_variants
products ──< marketing_content
products ──< promotions

product_metals ──< product_images
product_metals ──< product_videos
product_metals ──< product_variants
product_metals ──< products (direct FK: metal_id)

── Junction tables (M:N) ──────────────────────────────
products >──< ring_types        via product_ring_types       ← used for filter
products >──< product_metals    via product_metals_junction  ← used for filter
products >──< stone_shapes      via product_stone_shapes
products >──< stone_types       via product_stone_types      ← gemstone filter
products >──< diamond_sizes     via product_diamond_sizes    ← engagement ring sizes

── Watches ────────────────────────────────────────────
watch_brands ──< watch_collections ──< watches
watches ──< watch_images
watches ──< watch_videos
watches ──1 watch_specifications
watches ──< watch_variants

── Jewelry Categories ─────────────────────────────────
jewelry_types ──< jewelry_sub_types
earring_types   (standalone lookup)
necklace_types  (standalone lookup)
bracelet_types  (standalone lookup)

── Orders ─────────────────────────────────────────────
orders ──< order_items

── Live Chat ──────────────────────────────────────────
chats ──< chat_messages
chats >──< chat_labels via chat_label_assignments
```

---

## Indexes

```sql
-- Products
idx_products_category_id      ON products(category_id)
idx_products_base_price       ON products(base_price)

-- Junction table performance
idx_metal_junction_metal_id   ON product_metals_junction(metal_id)
idx_ring_types_junction       ON product_ring_types(ring_type_id)

-- Variants
idx_variants_metal_id         ON product_variants(metal_id)
idx_variants_product_id       ON product_variants(product_id)

-- Orders
idx_orders_customer_email     ON orders(customer_email)
idx_orders_stripe_payment_id  ON orders(stripe_payment_id)
idx_orders_order_number       ON orders(order_number)
idx_orders_status             ON orders(status)
idx_orders_payment_status     ON orders(payment_status)
idx_orders_created_at         ON orders(created_at)
idx_order_items_order_id      ON order_items(order_id)
idx_order_items_product_id    ON order_items(product_id)
```

---

## Table Count Summary

| Group | Tables |
|-------|--------|
| Auth & Users | 4 (`admin_users`, `admin_sessions`, `users`, `refresh_tokens`) |
| Product Catalogue | 7 (`categories`, `collections`, `products`, `product_images`, `product_videos`, `product_variants`, `user_favorites`) |
| Product Metals | 1 (`product_metals`) |
| Product Lookups | 5 (`ring_types`, `stone_shapes`, `stone_types`, `product_sizes`, `diamond_sizes`) |
| Product Junctions | 5 (`product_ring_types`, `product_metals_junction`, `product_stone_shapes`, `product_stone_types`, `product_diamond_sizes`) |
| Watch System | 7 (`watch_brands`, `watch_collections`, `watches`, `watch_images`, `watch_videos`, `watch_specifications`, `watch_variants`) |
| Jewelry Categories | 5 (`jewelry_types`, `jewelry_sub_types`, `earring_types`, `necklace_types`, `bracelet_types`) |
| Orders | 2 (`orders`, `order_items`) |
| CMS & Marketing | 2 (`marketing_content`, `promotions`) |
| Live Chat | 4 (`chats`, `chat_messages`, `chat_labels`, `chat_label_assignments`) |
| **Total** | **42** |

---

## Environment / Connection

```
PG_HOST       = <host>
PG_PORT       = 5432
PG_DATABASE   = <db name>
PG_USERNAME   = <user>
PG_PASSWORD   = <password>
```

PostgreSQL 15+, Node.js 18+.
