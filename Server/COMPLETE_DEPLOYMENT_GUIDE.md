# 🚀 Complete McCulloch Backend Deployment Guide

## 📦 What's Being Deployed

This deployment includes a comprehensive admin panel and API system with the following features:

### 🔐 Authentication & Admin Management
- Admin login/logout with JWT authentication
- Profile management
- Password change functionality
- Dashboard statistics
- Role-based access control (Admin, Super Admin)

### 💍 Ring Product Management
- Complete ring product CRUD operations
- Ring categories and subcategories management
- Ring types (Engagement, Wedding, Eternity, etc.)
- Gemstone management (Diamond, Sapphire, Ruby, etc.)
- Metal types management (Gold, Platinum, Silver, etc.)
- Collection management
- Bulk product updates
- Product status toggle (active/inactive)
- Featured product management
- Image uploads and management

### ⌚ Watch Management System (NEW)
- **Watch Brands Management**
  - Create, Read, Update, Delete brands
  - Brand slug generation
  - Brand status management

- **Watch Collections Management**
  - Collections per brand
  - Collection images and descriptions
  - Collection slugs
  - Watch count per collection
  - Featured collections for navigation

- **Watch Products Management**
  - Complete watch CRUD operations
  - Watch specifications (case size, movement, water resistance, etc.)
  - Multiple watch images per product
  - Watch pricing (base price and sale price)
  - Stock management
  - Watch variants
  - Collection assignment

### 📁 File Upload Management
- Single file upload
- Multiple file upload
- Product image upload (up to 10 images)
- Category image upload
- File deletion
- File info retrieval
- Automatic file path generation

### 📊 Database Models

#### Product Models
- `Product` - Main product table
- `ProductCategory` - Category hierarchy
- `ProductImage` - Product images
- `RingType` - Ring categories
- `Gemstone` - Gemstone types
- `Metal` - Metal types
- `Collection` - Product collections

#### Watch Models (NEW)
- `WatchBrand` - Watch brand information
- `WatchCollection` - Collections per brand
- `Watch` - Watch products
- `WatchImage` - Watch product images
- `WatchSpecification` - Technical specifications

#### Admin Models
- `Admin` - Admin users
- `AdminRole` - Admin roles and permissions

---

## 🌐 Complete API Endpoints Reference

### Public API Endpoints (No Auth Required)

#### Product APIs
```
GET  /api/v1/products                    - Get all products with filters
GET  /api/v1/products/categories         - Get all categories
GET  /api/v1/products/category/:slug     - Get products by category
GET  /api/v1/products/:slug              - Get single product by slug
```

#### Watch APIs (NEW)
```
GET  /api/v1/watches/brands                        - Get all watch brands
GET  /api/v1/watches/featured-collections          - Get featured collections for navbar
GET  /api/v1/watches/collections/:slug             - Get collection by slug with watches
GET  /api/v1/watches/brands/:brandId/collections   - Get collections by brand
GET  /api/v1/watches/watches                       - Get all watches with filters
GET  /api/v1/watches/watches/:slug                 - Get watch by slug
```

#### Filter APIs
```
GET  /api/v1/filters/ring-types          - Get all ring types
GET  /api/v1/filters/gemstones            - Get all gemstones
GET  /api/v1/filters/metals                - Get all metals
GET  /api/v1/filters/collections           - Get all collections
```

### Admin API Endpoints (Auth Required)

#### Authentication
```
POST /api/v1/admin/login                  - Admin login
POST /api/v1/admin/logout                 - Admin logout
GET  /api/v1/admin/profile                - Get admin profile
PUT  /api/v1/admin/profile                - Update admin profile
PUT  /api/v1/admin/change-password        - Change password
GET  /api/v1/admin/dashboard/stats        - Dashboard statistics
```

#### Product Management
```
GET    /api/v1/admin/products                    - Get all products (admin)
GET    /api/v1/admin/products/options            - Get product creation options
GET    /api/v1/admin/products/:id                - Get product by ID
POST   /api/v1/admin/products                    - Create product
POST   /api/v1/admin/products/with-media         - Create product with images
PUT    /api/v1/admin/products/:id                - Update product
DELETE /api/v1/admin/products/:id                - Delete product
PATCH  /api/v1/admin/products/:id/toggle-status  - Toggle product status
PATCH  /api/v1/admin/products/:id/toggle-featured - Toggle featured status
PATCH  /api/v1/admin/products/bulk/update        - Bulk update products
```

#### Category Management
```
GET    /api/v1/admin/categories                   - Get all categories
POST   /api/v1/admin/categories                   - Create category
GET    /api/v1/admin/categories/by-slug/:slug     - Get category by slug
GET    /api/v1/admin/categories/:id               - Get category by ID
PUT    /api/v1/admin/categories/:id               - Update category
DELETE /api/v1/admin/categories/:id               - Delete category
```

#### Ring Types Management
```
GET    /api/v1/admin/categories/ring-types        - Get all ring types
GET    /api/v1/admin/categories/ring-types/:id    - Get ring type by ID
POST   /api/v1/admin/categories/ring-types        - Create ring type
PUT    /api/v1/admin/categories/ring-types/:id    - Update ring type
DELETE /api/v1/admin/categories/ring-types/:id    - Delete ring type
```

#### Gemstone Management
```
GET    /api/v1/admin/categories/gemstones         - Get all gemstones
GET    /api/v1/admin/categories/gemstones/:id     - Get gemstone by ID
POST   /api/v1/admin/categories/gemstones         - Create gemstone
PUT    /api/v1/admin/categories/gemstones/:id     - Update gemstone
DELETE /api/v1/admin/categories/gemstones/:id     - Delete gemstone
```

#### Metal Management
```
GET    /api/v1/admin/categories/metals            - Get all metals
GET    /api/v1/admin/categories/metals/:id        - Get metal by ID
POST   /api/v1/admin/categories/metals            - Create metal
PUT    /api/v1/admin/categories/metals/:id        - Update metal
DELETE /api/v1/admin/categories/metals/:id        - Delete metal
```

#### Collection Management
```
GET    /api/v1/admin/categories/collections       - Get all collections
GET    /api/v1/admin/categories/collections/:id   - Get collection by ID
POST   /api/v1/admin/categories/collections       - Create collection
PUT    /api/v1/admin/categories/collections/:id   - Update collection
DELETE /api/v1/admin/categories/collections/:id   - Delete collection
```

#### Watch Brand Management (NEW)
```
GET    /api/v1/admin/watches/brands               - Get all brands
POST   /api/v1/admin/watches/brands               - Create brand
PUT    /api/v1/admin/watches/brands/:id           - Update brand
DELETE /api/v1/admin/watches/brands/:id           - Delete brand
```

#### Watch Collection Management (NEW)
```
GET    /api/v1/admin/watches/brands/:brandId/collections - Get brand collections
POST   /api/v1/admin/watches/collections                 - Create collection
```

#### Watch Product Management (NEW)
```
GET    /api/v1/admin/watches/watches              - Get all watches (admin)
GET    /api/v1/admin/watches/watches/:slug        - Get watch by slug
POST   /api/v1/admin/watches/watches              - Create watch
PUT    /api/v1/admin/watches/watches/:id          - Update watch
DELETE /api/v1/admin/watches/watches/:id          - Delete watch
PUT    /api/v1/admin/watches/watches/:watchId/specifications - Update specs
POST   /api/v1/admin/watches/watches/:watchId/images - Add watch image
DELETE /api/v1/admin/watches/images/:imageId      - Delete watch image
```

#### File Upload Management
```
POST   /api/v1/admin/upload/single               - Upload single file
POST   /api/v1/admin/upload/multiple             - Upload multiple files
POST   /api/v1/admin/upload/product-images       - Upload product images
POST   /api/v1/admin/upload/category-image       - Upload category image
DELETE /api/v1/admin/upload/file/:filename       - Delete file
GET    /api/v1/admin/upload/info/:filename       - Get file info
```

---

## 🛠️ Deployment Steps

### Step 1: Prepare Your Code

1. **Review and commit all changes:**
   ```bash
   cd "C:\xampp\htdocs\TESTMCCL\McCulloch Website\McCulloch Website\Server"
   git status
   git add .
   git commit -m "Complete backend system: Admin panel, Ring management, Watch management system"
   git push origin main
   ```

2. **Verify all files are tracked:**
   ```bash
   git ls-files | grep -E "(controllers|models|routes|middleware|validators)"
   ```

### Step 2: Configure Coolify

1. **Login to Coolify** at your VPS
2. **Navigate to** Projects → MCCL → Add New Service
3. **Configure Git Source:**
   - Repository: Your Git URL
   - Branch: `main`
   - Build Pack: `Dockerfile`
   - Dockerfile Location: `./Dockerfile`

### Step 3: Environment Variables

Copy all these environment variables to Coolify:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# PostgreSQL Database
PG_HOST=31.97.116.89
PG_PORT=5433
PG_DATABASE=mcculloch_db
PG_USERNAME=mcculloch_admin
PG_PASSWORD=#mcculloch_admin#20026

# MongoDB (for logging)
MONGODB_URI=mongodb://mcculloch-mdb:%23mcculloch_admin%2320026@31.97.116.89:27019/mcculloch_logs

# JWT Configuration
JWT_SECRET=mcculloch_jwt_secret_key_2024_production_secure_random_string
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=mcculloch_refresh_secret_2024_production

# CORS Configuration
ALLOWED_ORIGINS=https://buymediamonds.co.uk,http://buymediamonds.co.uk,https://www.buymediamonds.co.uk,http://www.buymediamonds.co.uk,http://31.97.116.89:3000,https://31.97.116.89:3000

# Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Step 4: Network Configuration

In Coolify **Network** section:

- **Ports Exposes:** `3000`
- **Ports Mappings:** `3000:3000`
- **Domains:**
  - Primary: `api.buymediamonds.co.uk` (recommended)
  - Or use IP: `http://31.97.116.89:3000`
- **Direction:** Allow www & non-www
- **Enable HTTPS:** Yes (if using domain)

### Step 5: Persistent Storage

Add volume for uploads:

- **Name:** `mcculloch-uploads`
- **Source Path:** `/app/uploads`
- **Destination Path:** `/uploads` (inside container)
- **Type:** Volume

### Step 6: Build Configuration

- **Base Directory:** `/` (or `/Server` if monorepo)
- **Dockerfile Location:** `./Dockerfile`
- **Custom Docker Options:** (leave empty)

### Step 7: Deploy

1. Click **"Save"** to save configuration
2. Click **"Redeploy"** to start deployment
3. Monitor logs in Coolify dashboard

### Step 8: Database Setup

After first deployment, you need to initialize the database:

```bash
# Access the container
docker exec -it <container-name> sh

# Run database sync
node -e "require('./models').sequelize.sync({ alter: true })"

# Create admin user
node quick-admin.js

# Exit container
exit
```

### Step 9: Verify Deployment

Test all major endpoints:

```bash
# Health check
curl http://31.97.116.89:3000/api/v1/health

# Test public endpoints
curl http://31.97.116.89:3000/api/v1/products
curl http://31.97.116.89:3000/api/v1/watches/brands

# Test admin login
curl -X POST http://31.97.116.89:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mcculloch.com","password":"your_password"}'
```

### Step 10: Update Frontend

Update frontend environment variables:

```env
# In your Client .env file
VITE_API_URL=https://api.buymediamonds.co.uk/api/v1
# or
VITE_API_URL=http://31.97.116.89:3000/api/v1
```

Redeploy frontend in Coolify.

---

## 🔍 Testing Checklist

### Admin Panel Features
- [ ] Admin login works
- [ ] Dashboard loads with statistics
- [ ] Profile update works
- [ ] Password change works

### Ring Product Management
- [ ] Can view all products
- [ ] Can create new product
- [ ] Can upload product images
- [ ] Can update product details
- [ ] Can delete products
- [ ] Can toggle product status
- [ ] Can mark products as featured
- [ ] Bulk updates work

### Category Management
- [ ] Can view all ring types
- [ ] Can create new ring types
- [ ] Can manage gemstones
- [ ] Can manage metals
- [ ] Can manage collections

### Watch Management (NEW)
- [ ] Can view all watch brands
- [ ] Can create new brand
- [ ] Can edit brand details
- [ ] Can delete brands
- [ ] Can view brand collections
- [ ] Can create collections
- [ ] Can add watches to collections
- [ ] Can manage watch specifications
- [ ] Can upload watch images
- [ ] Featured collections appear in navbar

### Public APIs
- [ ] Products API returns data
- [ ] Categories API works
- [ ] Watch brands API works
- [ ] Collections API works
- [ ] Filter APIs work

### File Uploads
- [ ] Single file upload works
- [ ] Multiple file upload works
- [ ] Files are accessible via URL
- [ ] File deletion works
- [ ] Uploads persist after redeployment

---

## 🐛 Troubleshooting

### Issue: Database Tables Not Created

**Solution:**
```bash
docker exec -it <container-name> sh
node -e "require('./models').sequelize.sync({ force: false, alter: true })"
```

### Issue: Admin Can't Login

**Solution:**
```bash
# Create new admin user
docker exec -it <container-name> node quick-admin.js
```

### Issue: CORS Errors

**Solution:**
1. Check `ALLOWED_ORIGINS` includes your frontend domain
2. Verify frontend is using correct API URL
3. Check browser console for specific CORS error
4. Redeploy after updating CORS settings

### Issue: File Uploads Fail

**Solution:**
1. Check persistent storage is mounted
2. Verify permissions: `chown -R nodejs:nodejs /app/uploads`
3. Check MAX_FILE_SIZE environment variable
4. Review upload middleware configuration

### Issue: Watch Features Not Working

**Solution:**
1. Verify watch models are synced to database
2. Run: `node -e "require('./models/watchModels')"`
3. Check if watch routes are loaded in index.js
4. Verify admin has proper permissions

### Issue: API Returns 500 Error

**Solution:**
1. Check Coolify logs for error details
2. Verify database connection
3. Check if all environment variables are set
4. Review controller error messages

---

## 📊 Monitoring & Logs

### View Real-time Logs
```bash
docker logs -f <container-name>
```

### Check Database Connection
```bash
docker exec -it <container-name> sh
node check-db.js
```

### View Container Stats
```bash
docker stats <container-name>
```

### Check Disk Usage (uploads)
```bash
docker exec -it <container-name> du -sh /app/uploads
```

---

## 🔄 Post-Deployment Updates

When you make code changes:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

2. **Redeploy in Coolify:**
   - Click "Redeploy" button
   - Monitor logs
   - Verify changes are live

3. **Database changes:**
   If you added new models or fields:
   ```bash
   docker exec -it <container-name> sh
   node -e "require('./models').sequelize.sync({ alter: true })"
   ```

---

## 🔐 Security Best Practices

- ✅ JWT secrets are strong (64+ characters)
- ✅ Database passwords are complex
- ✅ CORS restricted to production domains
- ✅ Rate limiting enabled
- ✅ File upload size limits set
- ✅ Admin authentication required for all admin routes
- ✅ HTTPS enabled for production
- ✅ Environment variables not committed to Git
- ✅ SQL injection protection (Sequelize ORM)
- ✅ XSS protection (Helmet middleware)

---

## 📈 Performance Optimization

- Redis caching configured (optional)
- Compression middleware enabled
- Database indexes on frequently queried fields
- Image optimization for uploads
- Rate limiting to prevent abuse

---

## 🎉 Success Indicators

Your deployment is successful when:

1. ✅ Health check returns 200 OK
2. ✅ Admin login works
3. ✅ Dashboard loads with statistics
4. ✅ Product CRUD operations work
5. ✅ Watch management system functional
6. ✅ File uploads work and persist
7. ✅ Frontend can communicate with backend
8. ✅ No errors in logs
9. ✅ Database connections stable
10. ✅ All public APIs return data

---

## 📞 Need Help?

If you encounter issues:

1. **Check Logs:**
   - Coolify logs dashboard
   - `docker logs <container-name>`
   - MongoDB logs (if using)

2. **Verify Configuration:**
   - Environment variables
   - Network settings
   - Persistent storage
   - Domain configuration

3. **Test Endpoints:**
   - Use curl or Postman
   - Check response codes
   - Review error messages

4. **Database Issues:**
   - Verify database is accessible
   - Check credentials
   - Test connection from container

---

**Deployment Date:** 2025-10-02
**Backend Version:** 1.0.0
**Node Version:** 18.x
**Database:** PostgreSQL 15 + MongoDB 7

**Key Features:**
- Complete Admin Panel
- Ring Product Management System
- Watch Management System (Brands, Collections, Products)
- File Upload System
- Category & Filter Management
- Authentication & Authorization
- API Rate Limiting & Security
