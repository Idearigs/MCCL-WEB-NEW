# Coolify Deployment Guide - McCulloch Backend API

## Step 1: Create New Application in Coolify

✅ **Your settings are CORRECT:**
- **Repository URL**: `https://github.com/Idearigs/MCCL-WEB-NEW`
- **Branch**: `main`
- **Base Directory**: `/Server`
- **Port**: `3000`
- **Build Pack**: **Use "Dockerfile"** (NOT Nixpacks)

**Why Dockerfile?**
- We have a custom Dockerfile optimized for this project
- Nixpacks may not handle all dependencies correctly
- Dockerfile gives us full control over the build process

## Step 2: Environment Variables

After clicking "Continue", add these environment variables in Coolify:

### Required Environment Variables

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3000
API_VERSION=v1

# PostgreSQL Database
PG_HOST=31.97.116.89
PG_PORT=5433
PG_DATABASE=mcculloch_db
PG_USERNAME=mcculloch_admin
PG_PASSWORD=#mcculloch_admin#20026

# MongoDB Database (for logs)
MONGODB_URI=mongodb://your-mongodb-host:27017/mcculloch_logs

# JWT Secret (for authentication)
JWT_SECRET=your-secure-random-jwt-secret-here-change-this

# Google OAuth (for user authentication)
GOOGLE_CLIENT_ID=160243846179-n6v7f12nqp75a4mi7lrief6dv4i1i645.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.buymediamonds.co.uk/api/v1/auth/google/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=https://buymediamonds.co.uk

# Email Service (if using email verification)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# CORS Origins (allowed frontend domains)
ALLOWED_ORIGINS=https://buymediamonds.co.uk,https://www.buymediamonds.co.uk

# Session Secret (for sessions)
SESSION_SECRET=your-secure-random-session-secret-here
```

### Important Notes for Each Variable:

**NODE_ENV**
- Value: `production`
- ⚠️ **Do NOT check "Available at Buildtime"** - only at runtime

**PORT**
- Value: `3000`
- Must match the port in Coolify's Port field

**Database Credentials**
- Use the credentials you provided:
  - PG_HOST: `31.97.116.89`
  - PG_PORT: `5433`
  - PG_DATABASE: `mcculloch_db`
  - PG_USERNAME: `mcculloch_admin`
  - PG_PASSWORD: `#mcculloch_admin#20026`

**MONGODB_URI**
- If you have MongoDB for logs, add the connection string
- If not using MongoDB, you can skip this (server will warn but continue)

**JWT_SECRET**
- Generate a random string: `openssl rand -base64 32`
- Or use any long, random string

**GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET**
- Get from Google Cloud Console
- File in your repo: `Server/client_secret_*.json` has the client ID
- Client secret should be in that file too

**GOOGLE_CALLBACK_URL**
- Must be: `https://api.buymediamonds.co.uk/api/v1/auth/google/callback`
- Must be added to Google Cloud Console Authorized Redirect URIs

**FRONTEND_URL**
- Value: `https://buymediamonds.co.uk`
- Used for redirects after successful authentication

**ALLOWED_ORIGINS**
- Comma-separated list of allowed frontend domains
- Value: `https://buymediamonds.co.uk,https://www.buymediamonds.co.uk`

**SESSION_SECRET**
- Generate a random string: `openssl rand -base64 32`
- Or use any long, random string

## Step 3: Deploy

1. Click "Deploy" or "Create"
2. Wait for build to complete
3. Check logs for:
   ```
   🚀 Server running in production mode on port 3000
   📚 API Documentation: http://localhost:3000/api/v1
   Database models initialized
   ```

## Step 4: Verify Deployment

### Test Health Endpoint
```bash
curl https://api.buymediamonds.co.uk/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "version": "v1",
  "database": "connected",
  "timestamp": "2025-10-16T..."
}
```

### Test Jewelry Categories
```bash
curl https://api.buymediamonds.co.uk/api/v1/filters/earring-types
curl https://api.buymediamonds.co.uk/api/v1/filters/necklace-types
curl https://api.buymediamonds.co.uk/api/v1/filters/bracelet-types
```

## Step 5: Configure Domain

In Coolify, add your domain:
- Domain: `api.buymediamonds.co.uk`
- Enable SSL/HTTPS

## Step 6: Test Frontend Integration

1. Visit `https://buymediamonds.co.uk`
2. Check browser console for errors
3. Navigation dropdowns should show all jewelry categories
4. No CORS errors

## Troubleshooting

### If Build Fails
- Check that Base Directory is `/Server`
- Ensure Build Pack is set to "Dockerfile"
- Check build logs for specific errors

### If Container Starts But Crashes
- Check environment variables are set correctly
- Look for "Cannot find module" errors
- Verify database credentials

### If Database Won't Connect
- Verify PG_HOST is accessible from your VPS
- Check firewall rules allow port 5433
- Test connection manually:
  ```bash
  psql -h 31.97.116.89 -p 5433 -U mcculloch_admin -d mcculloch_db
  ```

### If CORS Errors in Frontend
- Verify ALLOWED_ORIGINS includes frontend domain
- Check that frontend is using correct API URL
- Look at server logs for CORS warnings

## Environment Variables Checklist

Use this checklist when setting up in Coolify:

- [ ] NODE_ENV=production (runtime only)
- [ ] PORT=3000
- [ ] API_VERSION=v1
- [ ] PG_HOST=31.97.116.89
- [ ] PG_PORT=5433
- [ ] PG_DATABASE=mcculloch_db
- [ ] PG_USERNAME=mcculloch_admin
- [ ] PG_PASSWORD=#mcculloch_admin#20026
- [ ] MONGODB_URI (if using)
- [ ] JWT_SECRET (generate random string)
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GOOGLE_CALLBACK_URL=https://api.buymediamonds.co.uk/api/v1/auth/google/callback
- [ ] FRONTEND_URL=https://buymediamonds.co.uk
- [ ] ALLOWED_ORIGINS=https://buymediamonds.co.uk,https://www.buymediamonds.co.uk
- [ ] SESSION_SECRET (generate random string)

## Quick Copy-Paste Format for Coolify

```
NODE_ENV=production
PORT=3000
API_VERSION=v1
PG_HOST=31.97.116.89
PG_PORT=5433
PG_DATABASE=mcculloch_db
PG_USERNAME=mcculloch_admin
PG_PASSWORD=#mcculloch_admin#20026
JWT_SECRET=GENERATE_RANDOM_STRING_HERE
GOOGLE_CLIENT_ID=160243846179-n6v7f12nqp75a4mi7lrief6dv4i1i645.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_SECRET_HERE
GOOGLE_CALLBACK_URL=https://api.buymediamonds.co.uk/api/v1/auth/google/callback
FRONTEND_URL=https://buymediamonds.co.uk
ALLOWED_ORIGINS=https://buymediamonds.co.uk,https://www.buymediamonds.co.uk
SESSION_SECRET=GENERATE_RANDOM_STRING_HERE
```

Replace:
- `GENERATE_RANDOM_STRING_HERE` - Use `openssl rand -base64 32` to generate
- `YOUR_GOOGLE_SECRET_HERE` - Get from Google Cloud Console
- Add `MONGODB_URI` if you have MongoDB

---

## Summary

✅ Clean, minimal Dockerfile
✅ No docker-compose conflicts
✅ All required environment variables listed
✅ Complete setup guide
✅ Troubleshooting steps included

**Ready to deploy!**
