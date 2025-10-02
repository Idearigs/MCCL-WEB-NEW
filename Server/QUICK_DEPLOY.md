# ⚡ Quick Deployment Reference Card

## 🚀 Push Code to VPS

```bash
cd "C:\xampp\htdocs\TESTMCCL\McCulloch Website\McCulloch Website\Server"
git add .
git commit -m "Backend: Admin panel + Ring management + Watch management system"
git push origin main
```

## 🔧 Coolify Configuration (Copy/Paste)

### Basic Settings
```
Name: MCCL-Backend
Build Pack: Dockerfile
Dockerfile Location: ./Dockerfile
Port: 3000
Port Mapping: 3000:3000
Domain: api.buymediamonds.co.uk (or http://31.97.116.89:3000)
```

### Environment Variables (All of them)
```env
NODE_ENV=production
PORT=3000
API_VERSION=v1
PG_HOST=31.97.116.89
PG_PORT=5433
PG_DATABASE=mcculloch_db
PG_USERNAME=mcculloch_admin
PG_PASSWORD=#mcculloch_admin#20026
MONGODB_URI=mongodb://mcculloch-mdb:%23mcculloch_admin%2320026@31.97.116.89:27019/mcculloch_logs
JWT_SECRET=mcculloch_jwt_secret_key_2024_production_secure_random_string
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=mcculloch_refresh_secret_2024_production
ALLOWED_ORIGINS=https://buymediamonds.co.uk,http://buymediamonds.co.uk,https://www.buymediamonds.co.uk,http://www.buymediamonds.co.uk,http://31.97.116.89:3000,https://31.97.116.89:3000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Persistent Storage
```
Name: mcculloch-uploads
Source: /app/uploads
Destination: /uploads
Type: Volume
```

## ✅ After First Deploy - Initialize Database

```bash
# Find container name
docker ps | grep mcculloch

# Access container
docker exec -it <container-name> sh

# Sync database (creates all tables)
node -e "require('./models').sequelize.sync({ alter: true })"

# Create admin user
node quick-admin.js

# Exit
exit
```

## 🧪 Quick Test Commands

```bash
# Health check
curl http://31.97.116.89:3000/api/v1/health

# Test products
curl http://31.97.116.89:3000/api/v1/products

# Test watches
curl http://31.97.116.89:3000/api/v1/watches/brands

# Test admin login (replace with your credentials)
curl -X POST http://31.97.116.89:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mcculloch.com","password":"your_password"}'
```

## 📋 Complete Feature List

### ✅ What's Included:

**Admin System:**
- ✅ Login/Logout with JWT
- ✅ Profile Management
- ✅ Password Change
- ✅ Dashboard Stats
- ✅ Role-Based Access

**Ring Management:**
- ✅ Product CRUD
- ✅ Ring Types (Engagement, Wedding, etc.)
- ✅ Gemstones (Diamond, Sapphire, etc.)
- ✅ Metals (Gold, Platinum, etc.)
- ✅ Collections
- ✅ Bulk Operations
- ✅ Image Uploads
- ✅ Featured Products
- ✅ Status Toggle

**Watch Management (NEW):**
- ✅ Brand Management (Festina, Briston, Roamer)
- ✅ Collection Management per Brand
- ✅ Watch Products CRUD
- ✅ Watch Specifications
- ✅ Multiple Watch Images
- ✅ Featured Collections for Navbar
- ✅ Collection Pages with Watches

**File System:**
- ✅ Single/Multiple Upload
- ✅ Product Images (up to 10)
- ✅ Category Images
- ✅ File Deletion
- ✅ Persistent Storage

## 🔥 Most Important Endpoints

### Public (No Auth):
```
GET  /api/v1/products                           - All products
GET  /api/v1/watches/brands                     - Watch brands
GET  /api/v1/watches/featured-collections       - Featured collections (navbar)
GET  /api/v1/watches/collections/:slug          - Collection + watches
GET  /api/v1/watches/brands/:id/collections     - Brand collections
```

### Admin (Auth Required):
```
POST /api/v1/admin/login                        - Login
GET  /api/v1/admin/dashboard/stats              - Dashboard
GET  /api/v1/admin/products                     - Products list
POST /api/v1/admin/products                     - Create product
GET  /api/v1/admin/watches/brands               - Watch brands (admin)
POST /api/v1/admin/watches/brands               - Create brand
POST /api/v1/admin/watches/collections          - Create collection
POST /api/v1/admin/watches/watches              - Create watch
POST /api/v1/admin/upload/single                - Upload file
```

## 🐛 Common Issues & Fixes

**Issue: Can't login to admin**
```bash
docker exec -it <container-name> node quick-admin.js
```

**Issue: Tables not created**
```bash
docker exec -it <container-name> node -e "require('./models').sequelize.sync({ alter: true })"
```

**Issue: CORS errors**
- Update ALLOWED_ORIGINS in Coolify
- Redeploy
- Clear browser cache

**Issue: Uploads not persisting**
- Check persistent storage is configured
- Verify volume mount: /app/uploads → /uploads

**Issue: 500 errors**
- Check Coolify logs
- Verify database connection
- Check environment variables

## 📱 Update Frontend After Deploy

Update Client `.env`:
```env
VITE_API_URL=https://api.buymediamonds.co.uk/api/v1
```
or
```env
VITE_API_URL=http://31.97.116.89:3000/api/v1
```

Then redeploy Client in Coolify.

## 🔄 For Future Updates

```bash
# 1. Commit changes
git add .
git commit -m "Update description"
git push origin main

# 2. In Coolify, click "Redeploy"

# 3. If database changes:
docker exec -it <container-name> sh
node -e "require('./models').sequelize.sync({ alter: true })"
exit
```

## 📊 Monitor Deployment

```bash
# Real-time logs
docker logs -f <container-name>

# Container status
docker ps | grep mcculloch

# Check uploads
docker exec -it <container-name> ls -la /app/uploads
```

---

**Quick Links:**
- Full Guide: `COMPLETE_DEPLOYMENT_GUIDE.md`
- Deployment Steps: `DEPLOYMENT.md`
- This Card: `QUICK_DEPLOY.md`
