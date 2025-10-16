# Server 503 Debug Checklist

The API is returning 503 Service Unavailable errors. Follow these steps to diagnose and fix:

## 1. Check Container Status in Coolify

In your Coolify dashboard:
- Go to your API application (egkkscgcocssc0o80goo84wg)
- Check if the container is running or in "Degraded" state
- Click on "Logs" to view container logs

## 2. Common Causes of 503 Errors

### A. Database Connection Failed
**Most Common Issue** - The server tries to connect to PostgreSQL/MongoDB on startup and fails.

**Check Container Logs for:**
```
Failed to start server:
Error: connect ECONNREFUSED
FATAL: password authentication failed
```

**Fix:** Verify these environment variables in Coolify:
```bash
PG_HOST=your-postgres-host
PG_PORT=5432
PG_DATABASE=mcculloch_db
PG_USERNAME=postgres
PG_PASSWORD=your-password
MONGODB_URI=mongodb://your-mongo-uri
```

### B. Port Configuration Issues
**Check Environment Variable:**
```bash
PORT=3000  # or whatever port Coolify expects
```

### C. Missing Environment Variables
**Required variables:**
```bash
NODE_ENV=production
API_VERSION=v1
JWT_SECRET=your-secret-key
```

## 3. Health Check Timing

The health check runs with these settings:
- **Start period:** 10 seconds (grace period)
- **Interval:** 30 seconds
- **Timeout:** 3 seconds
- **Retries:** 3

If the server takes longer than 10 seconds to start (e.g., slow database connection), it may fail the health check.

**Solution:** Increase `start-period` in Dockerfile if needed:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3
```

## 4. Steps to Fix

### Step 1: Check Coolify Logs
```bash
# In Coolify dashboard:
1. Click on your API application
2. Go to "Logs" tab
3. Look for error messages at startup
```

### Step 2: Verify Environment Variables
```bash
# In Coolify dashboard:
1. Go to "Environment Variables" section
2. Ensure all required variables are set
3. Pay special attention to database credentials
```

### Step 3: Test Database Connection
```bash
# If you have shell access to the container:
psql -h $PG_HOST -U $PG_USERNAME -d $PG_DATABASE
mongo $MONGODB_URI
```

### Step 4: Increase Health Check Start Period (if needed)
```bash
# Edit Server/Dockerfile and change:
--start-period=30s  # from 10s to 30s
```

## 5. Quick Test

Once you think it's fixed, test the health endpoint directly:
```bash
curl https://api.buymediamonds.co.uk/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "version": "v1",
  "timestamp": "2025-10-16T..."
}
```

## 6. Recent Changes

### Fixed Issues:
✅ Health check path corrected from `/api/v1/health` to `/health`
✅ CORS origins updated to include production domains

### Still Need to Fix:
❌ Server returning 503 - likely database connection issue
❌ Need to verify environment variables in Coolify

## Next Steps

1. **Redeploy** the application in Coolify (new commit fixes CORS)
2. **Check logs** immediately after deployment
3. **Look for database connection errors** in the logs
4. **Verify environment variables** are set correctly
5. **Test health endpoint** once server starts

## Environment Variables Template

Copy this to your Coolify environment variables section:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret

# PostgreSQL (UPDATE THESE!)
PG_HOST=your-postgres-host
PG_PORT=5432
PG_DATABASE=mcculloch_db
PG_USERNAME=postgres
PG_PASSWORD=your-postgres-password

# MongoDB (UPDATE THIS!)
MONGODB_URI=mongodb://your-mongo-host:27017/mcculloch_logs

# Frontend URL
FRONTEND_URL=https://buymediamonds.co.uk

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.buymediamonds.co.uk/api/v1/auth/google/callback

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
BCRYPT_SALT_ROUNDS=12
```
