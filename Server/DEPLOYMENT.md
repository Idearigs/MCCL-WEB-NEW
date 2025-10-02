# McCulloch Backend Deployment Guide

## 🎯 Overview
This guide walks you through deploying the McCulloch backend API to your VPS using Coolify (as shown in your configuration).

## 📋 Prerequisites

- ✅ Coolify installed and running on VPS
- ✅ PostgreSQL database accessible at `31.97.116.89:5433`
- ✅ MongoDB accessible at `31.97.116.89:27019`
- ✅ Frontend already deployed and running
- ✅ Git repository with backend code

## 🚀 Deployment Steps

### Step 1: Push Your Code to Git Repository

Make sure all your recent changes are committed and pushed:

```bash
cd Server
git add .
git commit -m "Backend updates with watch management APIs"
git push origin main
```

### Step 2: Configure Coolify Project

1. **Login to Coolify** at your VPS address
2. **Navigate to Projects** → **MCCL** (or create if doesn't exist)
3. **Click "Add New Service"** or select existing backend service

### Step 3: Configure Git Source

In Coolify configuration:

- **Source:** Select your Git repository
- **Branch:** `main` (or your deployment branch)
- **Build Pack:** `Dockerfile`
- **Dockerfile Location:** `./Dockerfile`
- **Base Directory:** `/Server` (if monorepo) or `/` (if separate repo)

### Step 4: Set Environment Variables in Coolify

Go to **Configuration** → **Environment Variables** and add:

```env
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database Configuration
PG_HOST=31.97.116.89
PG_PORT=5433
PG_DATABASE=mcculloch_db
PG_USERNAME=mcculloch_admin
PG_PASSWORD=#mcculloch_admin#20026

# MongoDB Configuration
MONGODB_URI=mongodb://mcculloch-mdb:%23mcculloch_admin%2320026@31.97.116.89:27019/mcculloch_logs

# JWT Configuration
JWT_SECRET=mcculloch_jwt_secret_key_2024_production_secure_random_string
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=mcculloch_refresh_secret_2024_production

# CORS Configuration (UPDATE WITH YOUR DOMAIN)
ALLOWED_ORIGINS=https://buymediamonds.co.uk,http://buymediamonds.co.uk,http://31.97.116.89:3000

# Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Step 5: Configure Network Settings

In Coolify **Network** section:

- **Ports Exposes:** `3000`
- **Ports Mappings:** `3000:3000`
- **Domain:** Configure your API subdomain (e.g., `api.buymediamonds.co.uk`)
- **Direction:** Allow www & non-www (if using subdomain)

### Step 6: Configure Persistent Storage

In Coolify **Persistent Storage** section, add:

- **Name:** `uploads`
- **Source Path:** `/app/uploads`
- **Destination Path:** `/uploads`
- **Type:** Volume

This ensures uploaded images persist across deployments.

### Step 7: Set Build Configuration

In **Build** section:

- **Base Directory:** `/` (root of your Server folder)
- **Dockerfile Location:** `./Dockerfile`
- **Docker Build Stage Target:** Leave empty (uses default)

### Step 8: Deploy

1. Click **"Save"** to save all configurations
2. Click **"Redeploy"** to start deployment
3. Monitor deployment logs in Coolify

### Step 9: Verify Deployment

Once deployed, verify:

1. **Health Check:**
   ```bash
   curl http://31.97.116.89:3000/api/v1/health
   # Or with domain:
   curl https://api.buymediamonds.co.uk/api/v1/health
   ```

2. **Check API Response:**
   ```bash
   curl http://31.97.116.89:3000/api/v1/watches/brands
   ```

3. **Check Logs in Coolify:**
   - Go to **Logs** tab
   - Look for "🚀 Server running on port 3000"
   - Check for database connection success messages

### Step 10: Update Frontend API URL

Update your frontend `.env` to point to the deployed backend:

```env
VITE_API_URL=https://api.buymediamonds.co.uk/api/v1
# OR if using IP:
VITE_API_URL=http://31.97.116.89:3000/api/v1
```

Then redeploy your frontend in Coolify.

## 🔧 Troubleshooting

### Database Connection Issues

If you see database connection errors:

```bash
# Check if PostgreSQL is accessible
telnet 31.97.116.89 5433

# Check if MongoDB is accessible
telnet 31.97.116.89 27019
```

### CORS Issues

If frontend can't connect to backend:

1. Update `ALLOWED_ORIGINS` to include your frontend domain
2. Redeploy backend
3. Check browser console for specific CORS errors

### Container Won't Start

1. Check Coolify logs for errors
2. Verify all environment variables are set
3. Check if port 3000 is available
4. Review health check logs

### Upload Issues

If file uploads fail:

1. Verify persistent storage is mounted correctly
2. Check volume permissions: `nodejs:nodejs` (UID 1001)
3. Check container logs for permission errors

## 📊 Monitoring

### View Logs

```bash
# In Coolify UI, go to Logs tab, or:
docker logs <container-name> -f
```

### Check Container Status

```bash
docker ps | grep mcculloch
```

### Database Connection Test

Access container and test:

```bash
docker exec -it <container-name> sh
node -e "require('./config/database').testConnection()"
```

## 🔄 Updating After Code Changes

1. Commit and push changes to Git
2. In Coolify, click **"Redeploy"**
3. Monitor deployment logs
4. Verify API endpoints work after deployment

## 🔐 Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] Database passwords are secure
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] File upload size limits are set
- [ ] HTTPS is configured for production domain
- [ ] Health check endpoint is accessible

## 📱 Database Migrations

If you need to run migrations after deployment:

```bash
# Access container
docker exec -it <container-name> sh

# Run migrations (if you have migration scripts)
npm run migrate

# Or manually sync database
node -e "require('./models').sync()"
```

## 🎉 Success Indicators

You know deployment is successful when:

1. ✅ Health check returns 200 OK
2. ✅ API endpoints return expected data
3. ✅ Frontend can fetch data from backend
4. ✅ No errors in Coolify logs
5. ✅ Database connections are stable
6. ✅ File uploads work correctly

## 📞 Support

If issues persist:
1. Export Coolify logs
2. Check container logs: `docker logs <container-name>`
3. Verify network connectivity between services
4. Review Dockerfile and docker-compose.yml

---

**Last Updated:** 2025-10-02
**Backend Version:** 1.0.0
**Node Version:** 18.x
