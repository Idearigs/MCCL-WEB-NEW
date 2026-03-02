# McCulloch Jewellers — Technical Architecture Document

> **Audience:** Senior engineers, onboarding developers, DevOps
> **Last updated:** March 2026
> **Codebase:** React 18 + Express.js + PostgreSQL monorepo

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Repository Structure](#2-repository-structure)
3. [Database Schema](#3-database-schema)
4. [Product–Variant Relationships](#4-productvariant-relationships)
5. [Data Flow: Filter → Product Display](#5-data-flow-filter--product-display)
6. [Integration Points](#6-integration-points)
7. [State Management](#7-state-management)
8. [Authentication & Security](#8-authentication--security)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Performance Patterns](#10-performance-patterns)
11. [Recommendations: 20,000+ Variations at Scale](#11-recommendations-20000-variations-at-scale)
12. [Known Gotchas & Critical Notes](#12-known-gotchas--critical-notes)

---

## 1. Tech Stack

### Frontend
| Concern | Library | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.5.3 |
| Build tool | Vite | 5.4.1 |
| Routing | React Router DOM | 6.26.2 |
| Styling | Tailwind CSS | 3.4.17 |
| Component library | shadcn/ui (Radix UI) | — |
| Server state | TanStack Query (React Query) | 5.56.2 |
| Animations | Framer Motion | 12.23.6 |
| Payments | Stripe.js + React Stripe | 19.2.0 |
| Real-time | Socket.io-client | 4.8.1 |
| Toast | Sonner | — |
| Validation | Zod | — |
| Icons | Lucide React | — |

**TypeScript config note:** `noImplicitAny` and `strictNullChecks` are currently **disabled**. Enabling strict mode is a future hardening step.

### Backend
| Concern | Library | Version |
|---|---|---|
| Framework | Express.js | 4.18.2 |
| ORM | Sequelize | 6.35.0 |
| Database | PostgreSQL (pg) | 8.11.3 |
| Real-time | Socket.io | 4.8.1 |
| Payments | Stripe | 19.2.0 |
| Auth | Passport.js (Google OAuth) | 0.7.0 |
| Email | Nodemailer | 6.10.1 |
| Logging | Winston | 3.11.0 |
| Security | Helmet + express-rate-limit | — |
| HTTP client | Axios | 1.12.2 |
| HTML parsing | Cheerio | 1.2.0 |
| Cache | Redis (optional) | 4.6.10 |

### Infrastructure
| Concern | Tool |
|---|---|
| Reverse proxy | Nginx |
| Containerisation | Docker + Docker Compose |
| Process | Node.js (dev: Nodemon) |
| CI/CD | GitHub Actions (`.github/`) |

---

## 2. Repository Structure

```
McCulloch Website/
├── Client/                     # React/TypeScript SPA
│   ├── src/
│   │   ├── App.tsx             # Router — 60+ routes, code-split pages
│   │   ├── config/api.ts       # API base URL (dev/prod switch)
│   │   ├── contexts/           # Global state (Cart, Auth, Favourites)
│   │   ├── hooks/              # Custom hooks (mobile, scroll, pixel)
│   │   ├── pages/              # Route-level components (~43 files)
│   │   ├── components/         # Shared UI components (~80 files)
│   │   ├── admin/              # Admin dashboard (auth-gated, /admin/*)
│   │   └── chat/               # Live chat app (Socket.io, chat.html)
│   ├── vite.config.ts          # Code-splitting, vendor chunks, port 8080
│   └── tailwind.config.ts      # Custom fonts, CSS variables, themes
│
├── Server/                     # Express.js REST API
│   ├── index.js                # Entry point — Express + Socket.io setup
│   ├── models/index.js         # All Sequelize model definitions (~1,450 lines)
│   ├── controllers/            # Business logic per domain
│   ├── routes/                 # Express router files
│   ├── middleware/             # Auth, error handling, security
│   ├── services/               # External API clients (Nivoda, Email)
│   ├── scripts/                # DB helpers, image importers, scrapers
│   ├── migrations/             # Schema migrations
│   ├── seeds/                  # Seed data (admin users)
│   └── uploads/products/       # Uploaded media (BJ-XXX/...)
│
├── nginx.conf                  # Reverse proxy config
├── docker-compose.yml          # Local dev orchestration
├── docker-compose.production.yml
├── Dockerfile                  # Backend image
└── Dockerfile.frontend         # Frontend image (Vite build)
```

**Ports (development):**
- Frontend: `http://localhost:8080` (Vite dev server)
- Backend: `http://localhost:5000` (Express)
- API base: `http://localhost:5000/api/v1`

**Monorepo dev command:**
```bash
# Root package.json — runs both concurrently
npm run dev
```

---

## 3. Database Schema

Database: **PostgreSQL**, managed via **Sequelize ORM**.
All IDs are `UUID` (`gen_random_uuid()`). All tables have `created_at` / `updated_at`.

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          PRODUCTS                               │
│  id · name · slug · sku · base_price · sale_price · currency   │
│  is_active · is_featured · in_stock · stock_quantity            │
│  is_made_on_request · made_on_request_lead_time                 │
│  nivoda_enabled · nivoda_options_config (JSONB)                 │
│  video_url                                                      │
│                                                                 │
│  FK ── category_id ──────────────── CATEGORIES                  │
│  FK ── collection_id ────────────── COLLECTIONS                 │
│  FK ── ring_style_1_id ──┐                                      │
│  FK ── ring_style_2_id ──┤                                      │
│  FK ── ring_style_3_id ──┼──────── RING_TYPES                   │
│  FK ── ring_style_4_id ──┤                                      │
│  FK ── ring_style_5_id ──┘                                      │
│  FK ── stone_shape_id ───────────── STONE_SHAPES                │
│  FK ── stone_type_id ────────────── STONE_TYPES                 │
│  FK ── metal_id ─────────────────── PRODUCT_METALS              │
│  FK ── jewelry_sub_type_id ──────── JEWELRY_SUB_TYPES           │
└─────────────────────────────────────────────────────────────────┘
         │ 1
         │
         │ Many
    ┌────┴──────────────────────────────────────────────────┐
    │                   JUNCTION TABLES                      │
    │                                                        │
    │  product_metals_junction   (product_id, metal_id)      │
    │  product_ring_types        (product_id, ring_type_id)  │
    │  product_stone_shapes      (product_id, stone_shape_id)│
    │  product_stone_types       (product_id, stone_type_id) │
    │  product_diamond_sizes     (product_id, diamond_size_id│
    └────────────────────────────────────────────────────────┘
         │ 1
         │ Many
    ┌────┴──────────────────────────────────────────────────┐
    │                   PRODUCT_IMAGES                       │
    │  id · product_id · image_url · alt_text · sort_order  │
    │  is_primary · is_metal_preview                         │
    │  metal_id (FK) ──── which metal this image shows       │
    │  diamond_size_id (FK) ── which carat size              │
    │  is_diamond_size_preview                               │
    └────────────────────────────────────────────────────────┘
```

### 3.2 Core Tables

#### `products`
```sql
id                          UUID PRIMARY KEY
name                        VARCHAR NOT NULL
slug                        VARCHAR UNIQUE NOT NULL
sku                         VARCHAR UNIQUE
base_price                  DECIMAL
sale_price                  DECIMAL
currency                    VARCHAR DEFAULT 'GBP'
description                 TEXT
short_description           TEXT
is_active                   BOOLEAN DEFAULT true
is_featured                 BOOLEAN DEFAULT false
in_stock                    BOOLEAN DEFAULT true
stock_quantity              INTEGER
-- Variants via direct FKs (ring styles)
ring_style_1_id             UUID → ring_types
ring_style_2_id             UUID → ring_types
ring_style_3_id             UUID → ring_types
ring_style_4_id             UUID → ring_types
ring_style_5_id             UUID → ring_types
-- Variant via junction tables (metals, diamond sizes)
-- Grouping
category_id                 UUID → categories
collection_id               UUID → collections
jewelry_sub_type_id         UUID → jewelry_sub_types
-- Nivoda live diamond pricing
nivoda_enabled              BOOLEAN DEFAULT false
nivoda_options_config       JSONB
-- Made on request
is_made_on_request          BOOLEAN DEFAULT false
made_on_request_lead_time   VARCHAR
made_on_request_message     TEXT
```

#### `product_images`
```sql
id                          UUID PRIMARY KEY (gen_random_uuid())
product_id                  UUID → products
image_url                   VARCHAR
alt_text                    VARCHAR
sort_order                  INTEGER DEFAULT 0
is_primary                  BOOLEAN DEFAULT false
-- Metal targeting
is_metal_preview            BOOLEAN DEFAULT false
metal_id                    UUID → product_metals  (nullable)
-- Diamond size targeting
is_diamond_size_preview     BOOLEAN DEFAULT false
diamond_size_id             UUID → diamond_sizes   (nullable)
```

#### `product_metals`
```sql
id                          UUID PRIMARY KEY
name                        VARCHAR   -- "Rose Gold" | "White Gold" | "Yellow Gold"
color_code                  VARCHAR   -- hex e.g. "#E8B4B8"
price_multiplier            DECIMAL DEFAULT 1.0
is_active                   BOOLEAN
sort_order                  INTEGER
```

#### `product_metals_junction` ⚠️
```sql
product_id                  UUID → products
metal_id                    UUID → product_metals
created_at                  TIMESTAMP NOT NULL  -- ⚠️ NO DEFAULT — must pass NOW()
updated_at                  TIMESTAMP NOT NULL  -- ⚠️ NO DEFAULT — must pass NOW()
UNIQUE (product_id, metal_id)
```

#### `ring_types`
```sql
id          UUID PRIMARY KEY
name        VARCHAR   -- "Solitaire" | "Halo" | "Vintage" | "Shoulder Set" | ...
slug        VARCHAR
is_active   BOOLEAN
sort_order  INTEGER
```

#### `diamond_sizes`
```sql
id            UUID PRIMARY KEY
name          VARCHAR   -- "A" | "B" | "C" | "D" | "E" | "F"
display_name  VARCHAR   -- human-readable carat label
description   TEXT
sort_order    INTEGER
is_active     BOOLEAN
```

#### `categories`
```sql
id             UUID PRIMARY KEY
name           VARCHAR UNIQUE NOT NULL
slug           VARCHAR UNIQUE NOT NULL
description    TEXT
parent_id      UUID → categories   -- self-referential for hierarchy
level          INTEGER             -- 0 = top-level, 1 = sub-category
category_type  ENUM('main', 'sub_type', 'sub_gemstone')
```

---

## 4. Product–Variant Relationships

### 4.1 The Dual-Storage Pattern (Important)

This codebase uses **two separate mechanisms** to attach ring styles to products:

| Mechanism | Field | Status | Used by |
|---|---|---|---|
| Direct FK columns | `ring_style_1_id` … `ring_style_5_id` | **Active — admin panel writes here** | `productController.js` (ringStyle1–5 associations) |
| Junction table | `product_ring_types` | **Empty** (legacy, unused) | Old code path |

**The API merges both** into a single `ringTypes[]` array in responses:
```js
// productController.js — transform step
ringTypes: (() => {
  const merged = [...(product.ringTypes || [])];  // from junction (empty)
  [product.ringStyle1, product.ringStyle2, product.ringStyle3,
   product.ringStyle4, product.ringStyle5]
    .filter(Boolean)
    .forEach(rs => { if (!merged.some(rt => rt.id === rs.id)) merged.push(rs); });
  return merged;
})(),
```

### 4.2 One Product → Many Variants (Entity Map)

```
PRODUCT (BJ-001 "Lunia Solitaire")
│
├── METALS (Many-to-Many via product_metals_junction)
│   ├── Rose Gold  ← metal_id, color_code #E8B4B8
│   ├── White Gold ← metal_id, color_code #E8E8E8
│   └── Yellow Gold ← metal_id, color_code #FFD700
│
├── RING STYLES (up to 5, direct FK on products table)
│   ├── ring_style_1_id → Solitaire
│   ├── ring_style_2_id → Shoulder Set
│   └── ring_style_3_id → (null)
│
├── DIAMOND SIZES (Many-to-Many via product_diamond_sizes)
│   ├── A → 0.30ct
│   ├── B → 0.50ct
│   ├── C → 0.70ct
│   └── D → 1.00ct
│
└── IMAGES (One-to-Many via product_images)
    ├── image 1 — is_primary=true
    ├── image 2 — metal_id=Rose Gold, is_metal_preview=true
    ├── image 3 — metal_id=White Gold, is_metal_preview=true
    ├── image 4 — diamond_size_id=A, is_diamond_size_preview=true
    └── image 5 — diamond_size_id=B, is_diamond_size_preview=true
```

### 4.3 Relationship Summary

| Relationship | Type | Mechanism |
|---|---|---|
| Product → Category | Many-to-One | `products.category_id` FK |
| Product → Collection | Many-to-One | `products.collection_id` FK |
| Product → Metals | Many-to-Many | `product_metals_junction` table |
| Product → Ring Styles | Many-to-Many (max 5) | `ring_style_1_id…5_id` direct FKs |
| Product → Diamond Sizes | Many-to-Many | `product_diamond_sizes` table |
| Product → Stone Shapes | Many-to-Many | `product_stone_shapes` table |
| Product → Images | One-to-Many | `product_images.product_id` FK |
| Image → Metal | Many-to-One | `product_images.metal_id` FK (nullable) |
| Image → Diamond Size | Many-to-One | `product_images.diamond_size_id` FK (nullable) |

---

## 5. Data Flow: Filter → Product Display

### 5.1 Request Lifecycle (EngagementRings Page)

```
Browser                     React State                    Express API               PostgreSQL
──────                      ───────────                    ───────────               ──────────
Page load
  │── fetch ───────────────────────────────────────────► GET /products/category/rings?limit=500
  │                                                            │
  │                                                            │── Sequelize query ──► SELECT products
  │                                                            │                        JOIN categories
  │                                                            │                        JOIN product_metals_junction
  │                                                            │                        LEFT JOIN ringStyle1..5
  │                                                            │                        LEFT JOIN product_images
  │                                                       Transform response:
  │                                                       ringTypes = merge(junction + direct FKs)
  │◄── 129 products JSON ──────────────────────────────────────┘
  │
  │── setRingProducts(data)
  │── Derive filterOptions from product data
  │   (unique metals, ringTypes, gemstones, prices, collections)
  │
User clicks "Solitaire" filter
  │── setSelectedFilters({ ringType: ['Solitaire'] })
  │
  │── filteredProducts = ringProducts.filter(p =>
  │     p.ringTypes.some(rt =>
  │       rt.name.toLowerCase() === 'solitaire'
  │     )
  │   )                        ◄── CLIENT-SIDE ONLY (no re-fetch)
  │
  │── Re-render grid with filteredProducts
  │
User clicks "Rose Gold" metal swatch on product card
  │── setActiveMetalId(metalId)
  │── heroImage = product.images.find(
  │     img => img.is_metal_preview && img.metal_id === activeMetalId
  │   )
  │── Display metal-specific image
```

### 5.2 Filter State Shape

```typescript
// EngagementRings.tsx
const [selectedFilters, setSelectedFilters] = useState({
  price: string[],       // e.g. ["£1,000 - £2,500"]
  ringType: string[],    // e.g. ["Solitaire", "Halo"]
  gemstones: string[],   // e.g. ["Diamond"]
  metals: string[],      // e.g. ["Rose Gold", "White Gold"]
  collections: string[], // e.g. ["Classic"]
});

// Computed client-side
const filteredProducts = ringProducts.filter(product => {
  // ringType: checks all 5 ring styles merged into ringTypes[]
  // metals: checks ALL available_metals[], not just primary_metal
  // prices: compares base_price against banded ranges
  // All comparisons: .toLowerCase() (case-insensitive)
});
```

### 5.3 Metal Image Swap Flow

```
Product card renders
  │
  ├── metalImages = product.images.filter(
  │     img => img.is_metal_preview && img.metal_id === activeMetalId
  │   )
  │
  ├── primaryImage = metalImages[0] || product.images[0]
  └── hoverImage = metalImages[1] || primaryImage

User clicks metal swatch → setActiveMetalId(metal.id) → images swap instantly
(No network request — all image URLs already in memory)
```

---

## 6. Integration Points

### 6.1 Nivoda Diamond API

**Purpose:** Live diamond search for engagement ring configurator
**Files:** `Server/services/nivodaService.js`, `Server/controllers/nivodaController.js`

```
Client (ProductDetail.tsx)                  Server                    Nivoda API
──────────────────────────                  ──────                    ──────────
User configures diamond filters
  │── GET /api/v1/nivoda/search?carat=1&clarity=VS1 ──►
  │                                         nivodaService.js
  │                                           │── POST https://api.nivoda.net/...
  │                                           │◄── Diamond results JSON
  │◄── Transformed results ─────────────────┘

Product schema flags:
  products.nivoda_enabled         = true/false
  products.nivoda_options_config  = {
    caratRange: [min, max],
    clarityOptions: [...],
    colorOptions: [...],
    cutOptions: [...],
    certificateOptions: [...]
  }
```

### 6.2 Stripe Payment

**Files:** `Server/controllers/stripeController.js`, `Server/routes/paymentRoutes.js`

```
Client (Checkout.tsx)                       Server                    Stripe
──────────────────────                      ──────                    ──────
User clicks "Pay"
  │── POST /api/v1/payments/create-intent ──►
  │   { items, customerId }                  stripe.paymentIntents.create()
  │◄── { clientSecret } ───────────────────────────────────────────────┘
  │
  │   Stripe Elements (frontend renders card form)
  │── stripe.confirmPayment(clientSecret) ──────────────────────────────►
  │◄── { paymentIntent.status: 'succeeded' } ───────────────────────────┘
  │
  │── POST /api/v1/payments/confirm ────────►
  │   { paymentIntentId }                    Verify via stripe.retrieve()
  │                                          Create Order + OrderItems in DB
  │                                          Send confirmation email
  │◄── { orderId, orderNumber } ────────────┘

Order number format:
  JWL-YYYYMMDD-XXXXX (jewelry)
  WTC-YYYYMMDD-XXXXX (watches)
  MXD-YYYYMMDD-XXXXX (mixed cart)
```

**Webhook:** `POST /webhooks/stripe` handles async payment events (captures, refunds).

### 6.3 Socket.io Real-time Chat

**Files:** `Server/index.js` (lines 133–226), `Client/src/chat/`

```
Customer (ChatWidget.tsx)                   Server                    Admin Panel
──────────────────────                      ──────                    ───────────
socket.connect(SERVER_URL)
  │── emit('join_chat', { chat_id })        socket.join(`chat_${id}`)
  │── emit('send_message', { message })      io.to(room).emit('receive_message')
  │                                                                    │◄── receive_message
  │                                          io.emit('admin_chat_update', ...)
  │                                          persist → chat_messages table
Admin replies
  │                                          io.to(room).emit('receive_message')
  │◄── receive_message ────────────────────┘
```

**Events:**
| Event | Direction | Payload |
|---|---|---|
| `join_chat` | Client→Server | `{ chat_id, user_type, user_id }` |
| `send_message` | Client→Server | `{ chat_id, message, attachment_url? }` |
| `user_typing` | Client→Server | `{ chat_id, is_typing }` |
| `receive_message` | Server→Client | `{ message, sender_type, timestamp }` |
| `typing_status` | Server→Client | `{ is_typing, user_type }` |
| `leave_chat` | Client→Server | `{ chat_id }` |

### 6.4 Google OAuth (Passport.js)

```
Client                    Server                            Google
──────                    ──────                            ──────
/auth/google ──────────► passport.authenticate('google') ──►
                                                            Google consent screen
                          callback: /auth/google/callback ◄─ code
                          Exchange code for profile
                          Create/update User in DB
                          Issue JWT tokens
Client ◄── redirect /auth/callback?token=... ─────────────┘
```

### 6.5 Email (Nodemailer)

**File:** `Server/services/emailService.js`
**Triggers:** Order confirmation, order status update, password reset, email verification.

### 6.6 Watch Data Scrapers

**Files:** `Server/scripts/briston-scraper/`, `Server/scripts/festina-scraper/`
**Stack:** Axios (HTTP) + Cheerio (HTML parsing)
**Purpose:** One-off bulk import of watch models from brand websites. Not a live integration — scraped data is committed to the database and managed via admin panel thereafter.

### 6.7 Media File Upload

**Route:** `POST /api/v1/upload`
**Storage:** `Server/uploads/products/{SKU}/` (local disk)
**Served at:** `/uploads/` static route with `Accept-Ranges` header (video streaming)
**Naming convention:**
```
BJ-XXX(A)-{angle}-{metal}.png
  └── BJ-001(A) = SKU BJ-001, diamond size A
  └── angle = 1, 2, 3 (photo angle)
  └── metal = R (Rose), W (White), Y (Yellow)
```

---

## 7. State Management

### 7.1 Global State (React Context)

| Context | File | Persistence | Responsibility |
|---|---|---|---|
| `CartContext` | `contexts/CartContext.tsx` | `localStorage` (`mcculloch_cart_items`) | Cart items, quantities, totals |
| `UserAuthContext` | `contexts/UserAuthContext.tsx` | `localStorage` (JWT tokens) | Auth state, token refresh, profile |
| `FavoritesContext` | `contexts/FavoritesContext.tsx` | Hybrid (localStorage + API) | Wishlist, toast notifications |

### 7.2 Server State (React Query)

```typescript
// Client/src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — no re-fetch during this window
      gcTime: 10 * 60 * 1000,     // 10 minutes — cache cleanup
    }
  }
});
```

Product list pages fetch on mount, results cached for 5 minutes. Mutations invalidate relevant query keys.

### 7.3 Local Component State

Filter pages (`EngagementRings.tsx`, `Rings.tsx`, etc.) maintain:
- `ringProducts[]` — full product list from API (fetched once)
- `filteredProducts[]` — computed (useMemo) from `ringProducts + selectedFilters`
- `selectedFilters` — user's current filter selections
- `mobileFilterOpen`, `mobileColumns` — mobile UI state
- `activeMetalId` per product (set in product card hover)

### 7.4 Wishlist: Hybrid Local + API

```
Not authenticated:
  toggleFavorite(productId, name)
    └── writes to localStorage key 'mcculloch_wishlist'
    └── shows toast: "X added to your wishlist"

Authenticated:
  toggleFavorite(productId, name)
    └── POST /api/v1/favorites
    └── syncs with DB
    └── shows toast

WishlistSlide panel:
  └── shows favorites[] (API) + localFavorites[] (localStorage) merged
```

---

## 8. Authentication & Security

### 8.1 Token Flow

```
Login → POST /auth/login → { accessToken (short), refreshToken (long) }
                └── stored in localStorage

API call → Authorization: Bearer <accessToken>
         └── on 401: POST /auth/refresh → new accessToken
                     └── on fail: logout + redirect to /
```

### 8.2 Admin Auth (Separate System)

Admin panel (`/admin/*`) uses a **separate authentication context** (`AdminAuthContext`) with its own JWT, independent from customer accounts. Admin routes are protected by `ProtectedRoute` component.

### 8.3 Security Middleware (Server)

```javascript
// Applied globally:
helmet()                    // Security headers
cors({ allowedOrigins })    // Whitelist localhost:8080 + production domains
express.json({ limit:'50mb' })  // Body size limit
rateLimit({ windowMs: 15min, max: 100 })  // Per-IP rate limiting
```

---

## 9. Deployment Architecture

```
Internet
    │
    ▼
┌──────────────────────────────────────────┐
│              Nginx (Port 80/443)          │
│                                           │
│  / ────────────────────────────────────► Frontend (Vite build, static files)
│                                           │  buymediamonds.co.uk
│  /api/v1/* ─────────────────────────►   │
│  /uploads/* ─────────────────────────►  Backend (Express, Port 5000)
│  /socket.io/* ───────────────────────►  │  api.buymediamonds.co.uk
└──────────────────────────────────────────┘
                                           │
                                    ┌──────┴──────┐
                                    │  PostgreSQL  │
                                    │ (Port 5433)  │
                                    │ VPS Host     │
                                    └─────────────┘

Docker Compose services:
  - frontend  (Dockerfile.frontend — Node build + Nginx serve)
  - backend   (Dockerfile — Node.js Express)
  - db        (postgres:15 image, in dev only)
```

**Environment split:**
| Variable | Dev | Production |
|---|---|---|
| API URL | `http://localhost:5000/api/v1` | `https://api.buymediamonds.co.uk/api/v1` |
| DB host | `localhost` | `31.97.116.89` |
| DB port | `5432` | `5433` |
| Vite port | `8080` | — (built to static) |

---

## 10. Performance Patterns

### 10.1 Vite Code Splitting

```javascript
// vite.config.ts — manual chunks
manualChunks: {
  'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
  'vendor-radix':  ['@radix-ui/...'],
  'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
  'vendor-charts': ['recharts'],
  'vendor-socket': ['socket.io-client'],
}
```

All page-level components are `React.lazy()` loaded (except Index + NotFound).

### 10.2 Image Loading Strategy

```tsx
// Hero/LCP images
<img fetchPriority="high" loading="eager" />

// Secondary images
<img loading="lazy" />
```

### 10.3 API Query Optimisation

- Products fetched once with `?limit=500` (engagement rings page)
- All client-side filtering thereafter — zero additional network requests per filter change
- Filter options (`metals`, `ringTypes`, `gemstones`) derived from product data, not separate fetch calls

### 10.4 Metal Image Preloading

All metal-specific image URLs are delivered in the initial product list response. Clicking a metal swatch swaps images **instantly** with no network request — only the `activeMetalId` state changes.

---

## 11. Recommendations: 20,000+ Variations at Scale

The current client-side filter model (fetch all → filter in JS) works well up to ~500 products. At **20,000+ product variations**, you will hit three bottlenecks: **initial payload size**, **filter computation time**, and **memory pressure**. Here is the recommended migration path:

---

### 11.1 Move to Server-Side Filtering Immediately

**Problem:** Fetching 20,000 products on page load will be ~50MB+ JSON. Browser will freeze.

**Fix:** Add query params to the API and let PostgreSQL do the filtering:

```
GET /products/category/rings
  ?metals=Rose Gold,White Gold
  &ringType=Solitaire,Halo
  &price_min=1000
  &price_max=5000
  &page=1
  &limit=24
```

The `productController.js` already supports `metal`, `price_min`, `price_max`, `category` filters. Extend it to cover `ringType` and `gemstone` server-side.

---

### 11.2 Adopt a Proper Parent–Child Product Model

**Current problem:** One `products` row is stretched to hold 5 ring styles, multiple metals, and multiple diamond sizes as separate column FKs and junction tables. At 20,000 variations this will be unwieldy.

**Recommended pattern: Parent SKU → Child Variants**

```sql
-- PARENT (the "concept" — shown in listing pages)
products
  id, name, slug, sku,         -- BJ-001
  base_price,                  -- Starting from price
  category_id, collection_id

-- CHILD (a specific purchasable combination)
product_variants
  id
  parent_product_id  FK → products
  sku                -- BJ-001-RG-A  (parent-metal-size)
  metal_id           FK → product_metals
  diamond_size_id    FK → diamond_sizes
  ring_style_id      FK → ring_types
  price              -- Exact price for this combination
  stock_quantity
  in_stock
  image_id           FK → product_images  (hero image for this variant)
```

**Benefits:**
- Filter on `product_variants` table with proper indexes → fast even at 100,000 rows
- Each variant has an exact SKU, price, and stock count
- No more "up to 5 ring styles" column hack — one FK per variant row
- Cart stores variant ID (not parent ID + configuration string)

---

### 11.3 Add Database Indexes for Filter Columns

```sql
-- Run these migrations now, before data volume grows:
CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_products_price       ON products(base_price);
CREATE INDEX idx_products_active      ON products(is_active, is_featured);
CREATE INDEX idx_pv_metal             ON product_variants(metal_id);
CREATE INDEX idx_pv_ring_style        ON product_variants(ring_style_id);
CREATE INDEX idx_pv_diamond_size      ON product_variants(diamond_size_id);
CREATE INDEX idx_pv_parent            ON product_variants(parent_product_id);
CREATE INDEX idx_images_product_metal ON product_images(product_id, metal_id);
```

---

### 11.4 Implement Cursor-based Pagination

**Current:** `LIMIT 500 OFFSET 0` — will degrade at scale.

**Replace with:** Keyset (cursor) pagination:

```
GET /products?cursor=<last_seen_id>&limit=24&sort=base_price_asc
```

This keeps consistent performance regardless of page depth.

---

### 11.5 Add a Filter Facet Endpoint

Instead of deriving filter options from the full product list client-side, add a dedicated endpoint:

```
GET /products/facets?category=rings&metals=Rose Gold
→ {
    metals:     [{ name, count }],
    ringTypes:  [{ name, count }],
    gemstones:  [{ name, count }],
    priceRange: { min, max }
  }
```

This allows "smart facets" — showing only the filters that will return results given the current selection.

---

### 11.6 Cache Filter Results with Redis

```
Cache key: facets:{category}:{sorted_filter_hash}
TTL: 5 minutes

On product update (admin) → invalidate affected cache keys
```

Redis is already in `package.json` — just needs the caching layer wired to the filter endpoints.

---

### 11.7 Priority Order

| Priority | Action | Impact |
|---|---|---|
| P0 (now) | Add DB indexes (§11.3) | Prevents slow queries as data grows |
| P0 (now) | Fix ring_style dual-storage (use only junction table OR only direct FKs — not both) | Eliminates dual-write complexity |
| P1 (next sprint) | Server-side filtering (§11.1) | Required before >1,000 products |
| P2 | Parent–Child variant model (§11.2) | Required before >5,000 variations |
| P3 | Cursor pagination (§11.4) | Required before >500 products per page |
| P3 | Facet endpoint (§11.5) | UX improvement at any scale |
| P4 | Redis facet cache (§11.6) | Performance at high traffic |

---

## 12. Known Gotchas & Critical Notes

### Database

| ⚠️ | Description |
|---|---|
| `product_metals_junction` | Has `NOT NULL` `created_at`/`updated_at` with **no defaults**. All raw INSERTs must include `NOW()` for both columns or the insert will fail. |
| `product_images` | Requires explicit `gen_random_uuid()` for the `id` column in raw SQL inserts. |
| Metal names | Must match exactly: `"Rose Gold"`, `"White Gold"`, `"Yellow Gold"`. Never use `"18K Rose Gold"` etc. |
| PostgreSQL regex | Never use `~` with `\(` or `\)` for literal parentheses — they are group delimiters. Use `LIKE '%(%)%'` instead. |
| `pool.query()` | Returns `{ rows: [...] }` — **not** destructurable as `[results]` like Sequelize. |
| Ring style storage | Admin panel writes to `ring_style_1_id…5_id` columns. The `product_ring_types` junction table is **empty**. The API merges both sources. |

### Frontend

| ⚠️ | Description |
|---|---|
| `<select>` value | Must never be `null`. Always convert nullable fields: `value={field ?? ''}` |
| `initialData` spread | Explicitly convert nullable fields: `field: initialData.field \|\| ''` |
| TypeScript strict mode | Disabled (`noImplicitAny: false`). Type errors may be silently swallowed. |
| Filter limit | Engagement rings fetched with `?limit=500`. If products exceed 500, some will be invisible to filters. Migrate to server-side filtering. |

### API

| ⚠️ | Description |
|---|---|
| `/products/navigation` | Returns `ring_types`, `metals`, `eternity_rings` (= collections), `gemstones` (= stone_types). Field names differ from DB table names. |
| Image URLs | Use `getMediaUrl(url)` helper from `config/api.ts` — prepends the correct base URL in dev vs production. Never hardcode `localhost:5000`. |
| Watches route order | `/brands/slug/:slug/collections` must be declared **before** `/:brandId` in `watchRoutes.js` or Express will match the UUID route first. |

---

*Generated by Claude Code — Senior Software Architect analysis of McCulloch Jewellers codebase.*
*Update this document when architectural decisions change.*
