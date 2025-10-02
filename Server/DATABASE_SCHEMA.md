# 🗄️ McCulloch Backend Database Schema

## Overview

This backend uses **TWO databases**:
1. **PostgreSQL** - Main application data (products, watches, admin)
2. **MongoDB** - Logging and analytics

---

## PostgreSQL Tables (Main Database)

### 👤 Admin & Authentication

#### `admins`
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- password_hash (String)
- first_name (String)
- last_name (String)
- role (ENUM: 'super_admin', 'admin', 'editor')
- avatar (String, nullable)
- is_active (Boolean, default: true)
- last_login_at (Timestamp)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `admin_roles` (If using RBAC)
```sql
- id (UUID, Primary Key)
- name (String)
- permissions (JSON)
- created_at (Timestamp)
- updated_at (Timestamp)
```

---

### 💍 Ring Product System

#### `products`
```sql
- id (UUID, Primary Key)
- name (String)
- slug (String, Unique)
- description (Text)
- short_description (String)
- sku (String, Unique)
- base_price (Decimal)
- sale_price (Decimal, nullable)
- category_id (UUID, Foreign Key → product_categories)
- ring_type_id (UUID, Foreign Key → ring_types)
- gemstone_id (UUID, Foreign Key → gemstones)
- metal_id (UUID, Foreign Key → metals)
- collection_id (UUID, Foreign Key → collections)
- stock_quantity (Integer)
- is_active (Boolean, default: true)
- is_featured (Boolean, default: false)
- meta_title (String)
- meta_description (String)
- meta_keywords (String)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `product_categories`
```sql
- id (UUID, Primary Key)
- name (String)
- slug (String, Unique)
- description (Text)
- parent_id (UUID, nullable, Self-Reference)
- image_url (String)
- display_order (Integer)
- is_active (Boolean, default: true)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `product_images`
```sql
- id (UUID, Primary Key)
- product_id (UUID, Foreign Key → products)
- image_url (String)
- alt_text (String)
- display_order (Integer)
- is_primary (Boolean, default: false)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `ring_types`
```sql
- id (UUID, Primary Key)
- name (String) - e.g., "Engagement Ring", "Wedding Ring"
- slug (String, Unique)
- description (Text)
- image_url (String)
- is_active (Boolean, default: true)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `gemstones`
```sql
- id (UUID, Primary Key)
- name (String) - e.g., "Diamond", "Sapphire", "Ruby"
- slug (String, Unique)
- description (Text)
- color (String)
- hardness (String)
- is_active (Boolean, default: true)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `metals`
```sql
- id (UUID, Primary Key)
- name (String) - e.g., "18K Gold", "Platinum", "Silver"
- slug (String, Unique)
- description (Text)
- purity (String)
- color (String) - e.g., "Yellow", "White", "Rose"
- is_active (Boolean, default: true)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `collections`
```sql
- id (UUID, Primary Key)
- name (String)
- slug (String, Unique)
- description (Text)
- image_url (String)
- is_active (Boolean, default: true)
- created_at (Timestamp)
- updated_at (Timestamp)
```

---

### ⌚ Watch Management System

#### `watch_brands`
```sql
- id (UUID, Primary Key)
- name (String) - e.g., "Festina", "Briston", "Roamer"
- slug (String, Unique)
- description (Text)
- logo_url (String)
- country_origin (String)
- founded_year (Integer)
- website_url (String)
- is_active (Boolean, default: true)
- display_order (Integer)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `watch_collections`
```sql
- id (UUID, Primary Key)
- brand_id (UUID, Foreign Key → watch_brands)
- name (String) - e.g., "Festina Classic Collection"
- slug (String, Unique)
- description (Text)
- image_url (String)
- is_featured (Boolean, default: false)
- is_active (Boolean, default: true)
- display_order (Integer)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `watches`
```sql
- id (UUID, Primary Key)
- brand_id (UUID, Foreign Key → watch_brands)
- collection_id (UUID, Foreign Key → watch_collections)
- name (String)
- slug (String, Unique)
- model_number (String)
- description (Text)
- base_price (Decimal)
- sale_price (Decimal, nullable)
- sku (String, Unique)
- stock_quantity (Integer)
- is_active (Boolean, default: true)
- is_featured (Boolean, default: false)
- meta_title (String)
- meta_description (String)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `watch_images`
```sql
- id (UUID, Primary Key)
- watch_id (UUID, Foreign Key → watches)
- image_url (String)
- alt_text (String)
- display_order (Integer)
- is_primary (Boolean, default: false)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `watch_specifications`
```sql
- id (UUID, Primary Key)
- watch_id (UUID, Foreign Key → watches, One-to-One)
- case_material (String) - e.g., "Stainless Steel", "Gold"
- case_size (String) - e.g., "42mm"
- case_thickness (String)
- movement_type (String) - e.g., "Automatic", "Quartz"
- movement_model (String)
- power_reserve (String)
- water_resistance (String) - e.g., "100m", "10ATM"
- crystal_material (String) - e.g., "Sapphire"
- dial_color (String)
- strap_material (String)
- strap_color (String)
- clasp_type (String)
- functions (JSON) - e.g., ["Chronograph", "Date", "GMT"]
- warranty_years (Integer)
- created_at (Timestamp)
- updated_at (Timestamp)
```

---

## Database Relationships

### Ring Products
```
product_categories (parent)
    ↓ (1:N)
products
    ↓ (1:N)
product_images

products → ring_types (N:1)
products → gemstones (N:1)
products → metals (N:1)
products → collections (N:1)
products → product_categories (N:1)
```

### Watch System
```
watch_brands
    ↓ (1:N)
watch_collections
    ↓ (1:N)
watches
    ↓ (1:N)
watch_images

watches → watch_specifications (1:1)
```

---

## MongoDB Collections (Logging Database)

### `api_logs`
```javascript
{
  _id: ObjectId,
  timestamp: Date,
  method: String,      // GET, POST, PUT, DELETE
  url: String,
  status: Number,      // 200, 404, 500, etc.
  response_time: Number,
  user_agent: String,
  ip_address: String,
  admin_id: String,    // If authenticated
  error: Object        // If error occurred
}
```

### `admin_activity_logs`
```javascript
{
  _id: ObjectId,
  timestamp: Date,
  admin_id: String,
  action: String,      // "create", "update", "delete"
  resource: String,    // "product", "watch", "category"
  resource_id: String,
  changes: Object,     // What was changed
  ip_address: String
}
```

---

## Initial Data Seeds

### Ring Types
- Engagement Rings
- Wedding Rings
- Eternity Rings
- Dress Rings
- Vintage Rings

### Gemstones
- Diamond
- Sapphire
- Ruby
- Emerald
- Amethyst
- Aquamarine
- Topaz

### Metals
- 18K Yellow Gold
- 18K White Gold
- 18K Rose Gold
- Platinum
- Sterling Silver
- Palladium

### Watch Brands
- Festina
- Briston
- Roamer

### Sample Watch Collections
- Festina Classic Collection
- Briston Heritage Collection
- Roamer Swiss Tradition

---

## Database Indexes (Performance)

### Products
```sql
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(base_price);
```

### Watches
```sql
CREATE INDEX idx_watches_slug ON watches(slug);
CREATE INDEX idx_watches_brand ON watches(brand_id);
CREATE INDEX idx_watches_collection ON watches(collection_id);
CREATE INDEX idx_watches_active ON watches(is_active);
CREATE INDEX idx_watches_featured ON watches(is_featured);
```

### Collections
```sql
CREATE INDEX idx_watch_collections_brand ON watch_collections(brand_id);
CREATE INDEX idx_watch_collections_slug ON watch_collections(slug);
CREATE INDEX idx_watch_collections_featured ON watch_collections(is_featured);
```

---

## Database Initialization Commands

### First Time Setup
```bash
# Access container
docker exec -it <container-name> sh

# Sync all tables (creates if not exists, updates if schema changed)
node -e "require('./models').sequelize.sync({ alter: true })"

# Create admin user
node quick-admin.js
```

### After Schema Changes
```bash
# Sync with alter (safer - preserves data)
node -e "require('./models').sequelize.sync({ alter: true })"

# Force sync (DANGEROUS - drops all tables and recreates)
# node -e "require('./models').sequelize.sync({ force: true })"
```

### Seed Initial Data
```bash
# If you have seed scripts
node seeds/seedRingTypes.js
node seeds/seedGemstones.js
node seeds/seedMetals.js
node seed-watch-brands.js
```

---

## Backup Recommendations

### PostgreSQL Backup
```bash
# Inside container or from host
pg_dump -h 31.97.116.89 -p 5433 -U mcculloch_admin -d mcculloch_db > backup.sql

# Restore
psql -h 31.97.116.89 -p 5433 -U mcculloch_admin -d mcculloch_db < backup.sql
```

### MongoDB Backup
```bash
# Backup
mongodump --uri="mongodb://mcculloch-mdb:%23mcculloch_admin%2320026@31.97.116.89:27019/mcculloch_logs"

# Restore
mongorestore --uri="mongodb://mcculloch-mdb:%23mcculloch_admin%2320026@31.97.116.89:27019/mcculloch_logs"
```

---

## Expected Table Count

After full deployment, you should have:

**PostgreSQL Tables:**
- ✅ 14 tables total
  - 2 Admin tables
  - 7 Ring product tables
  - 5 Watch system tables

**MongoDB Collections:**
- ✅ 2+ collections
  - api_logs
  - admin_activity_logs

---

## Verification Queries

### Check All Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Count Records
```sql
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION
SELECT 'watches', COUNT(*) FROM watches
UNION
SELECT 'watch_brands', COUNT(*) FROM watch_brands
UNION
SELECT 'watch_collections', COUNT(*) FROM watch_collections;
```

### Check Relationships
```sql
-- Products with images
SELECT p.name, COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name;

-- Brands with collections
SELECT wb.name, COUNT(wc.id) as collection_count
FROM watch_brands wb
LEFT JOIN watch_collections wc ON wb.id = wc.brand_id
GROUP BY wb.id, wb.name;
```

---

**Database Version Requirements:**
- PostgreSQL: 15+
- MongoDB: 7+
- Node.js: 18+

**ORM/ODM:**
- Sequelize (PostgreSQL)
- Mongoose (MongoDB)
