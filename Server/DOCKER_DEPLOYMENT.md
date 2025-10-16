# Docker Deployment Guide

## Production Deployment (Coolify/VPS)

For production deployment on Coolify or a VPS, the server uses the standalone `Dockerfile` only.

**What Coolify does:**
1. Builds Docker image using `Dockerfile`
2. Runs the container with environment variables from Coolify configuration
3. Connects to external PostgreSQL and MongoDB instances

**Important:** Do NOT use `docker-compose.yml` for production. It is only for local development.

## Local Development

For local development with all services (PostgreSQL, MongoDB, Redis, etc.), use:

```bash
# The file is named docker-compose.local.yml to prevent Coolify from using it
docker compose -f docker-compose.local.yml up -d
```

**Services included in local development:**
- API Server (Node.js/Express)
- PostgreSQL Database
- MongoDB Database
- Redis Cache
- pgAdmin (database admin tool)
- Mongo Express (MongoDB admin tool)

## Why Two Different Approaches?

**Production (Coolify):**
- Uses managed database instances
- Environment variables set in Coolify dashboard
- Single container deployment
- Production-grade security and networking

**Local Development:**
- Self-contained with all services
- Easy to start/stop entire stack
- Development tools (pgAdmin, Mongo Express)
- Isolated test environment

## Troubleshooting

If Coolify shows "Cannot find module" errors:
1. Ensure `docker-compose.yml` does NOT exist in the repository
2. Only `docker-compose.local.yml` should be present
3. Coolify will use the standalone `Dockerfile` for builds
4. All environment variables should be set in Coolify dashboard

## Environment Variables

Production environment variables are set in Coolify:
- `NODE_ENV=production`
- `PORT=3000` (or your configured port)
- `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USERNAME`, `PG_PASSWORD`
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `ALLOWED_ORIGINS`

**Important:** Ensure `NODE_ENV` is set in Coolify environment variables but NOT marked as "Available at Buildtime" - it should only be available at runtime.
