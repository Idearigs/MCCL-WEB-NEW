# McCulloch Website Backend API

A production-ready Node.js/Express backend with PostgreSQL and MongoDB support.
<!-- auto-deploy test -->

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (recommended)
- PostgreSQL 15+ (if running locally)
- MongoDB 7+ (if running locally)

### 1. Environment Setup

```bash
# Clone and navigate to Server directory
cd Server

# Copy environment file and update values
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Required for production
NODE_ENV=development
PG_PASSWORD=your_postgres_password
MONGODB_URI=mongodb://localhost:27017/mcculloch_logs
JWT_SECRET=your_super_secret_jwt_key
```

### 2. Docker Setup (Recommended)

```bash
# Start all services (API + Databases)
docker-compose up -d

# Or start with admin tools for development
docker-compose --profile dev-tools up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

**Access Points:**
- API: http://localhost:5000
- PostgreSQL: localhost:5432
- MongoDB: localhost:27017
- PgAdmin: http://localhost:8080 (admin@mcculloch.com / admin)
- Mongo Express: http://localhost:8081 (admin / admin)

### 3. Local Development Setup

If you prefer running without Docker:

```bash
# Install dependencies
npm install

# Start PostgreSQL (using your preferred method)
# Example with Homebrew on macOS:
brew services start postgresql
createdb mcculloch_db

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Start the development server
npm run dev
```

## 📁 Project Structure

```
Server/
├── config/                 # Configuration files
│   ├── database.js         # Database connections
│   └── index.js           # App configuration
├── controllers/           # Route handlers
├── middleware/           # Express middleware
│   ├── auth.js          # Authentication
│   ├── errorHandler.js  # Error handling
│   ├── security.js      # Security utilities
│   └── validation.js    # Input validation
├── models/              # Database models
├── routes/              # API route definitions
├── services/            # Business logic
├── utils/               # Helper utilities
├── validators/          # Input validation schemas
├── scripts/             # Database initialization
│   ├── init-postgres.sql
│   └── init-mongo.js
├── tests/               # Test files
├── docker-compose.yml   # Docker services
├── Dockerfile          # Container definition
└── index.js            # Application entry point
```

## 🛠️ Available Scripts

```bash
npm start         # Start production server
npm run dev       # Start development server with hot reload
npm test          # Run test suite
npm run test:watch # Run tests in watch mode
npm run lint      # Check code style
npm run lint:fix  # Fix code style issues
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate limiting** - Prevent abuse
- **JWT Authentication** - Secure token-based auth
- **Input validation** - Joi & express-validator
- **CORS** - Configurable cross-origin requests
- **bcryptjs** - Password hashing
- **Security logging** - Track security events

## 🗄️ Database Architecture

### PostgreSQL (Structured Data)
- **Users** - Authentication & profiles
- **Products** - Catalog management
- **Orders** - Transaction records
- **Categories** - Product organization

### MongoDB (Flexible Data)
- **Logs** - System & application logs
- **Analytics** - User behavior tracking
- **Audit** - Action history
- **Content** - CMS data

## 🔌 API Endpoints

### Health Check
```http
GET /health
```

### API Info
```http
GET /api/v1
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📦 Deployment

### Docker Deployment
```bash
# Build production image
docker build -t mcculloch-api .

# Run container
docker run -d \
  --name mcculloch-api \
  -p 5000:5000 \
  --env-file .env \
  mcculloch-api
```

### Coolify Deployment
1. Upload your codebase to Git repository
2. Create new service in Coolify
3. Set environment variables in Coolify dashboard
4. Deploy using Docker Compose configuration

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | development | No |
| `PORT` | Server port | 5000 | No |
| `JWT_SECRET` | JWT signing key | - | Yes (prod) |
| `PG_HOST` | PostgreSQL host | localhost | No |
| `PG_PASSWORD` | PostgreSQL password | - | Yes |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | localhost:3000 | No |

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if databases are running
docker-compose ps

# View database logs
docker-compose logs postgres
docker-compose logs mongodb

# Restart databases
docker-compose restart postgres mongodb
```

### Permission Errors
```bash
# Fix file permissions
chmod +x scripts/*.sh
sudo chown -R $USER:$USER uploads/
```

### Port Conflicts
If ports 5000, 5432, or 27017 are in use:

1. Stop conflicting services
2. Update ports in `docker-compose.yml`
3. Update `.env` accordingly

## 📝 Development Workflow

1. **Create feature branch**
2. **Write tests first** (TDD approach)
3. **Implement functionality**
4. **Run linting & tests**
5. **Update documentation**
6. **Submit PR**

## 📊 Monitoring

- **Winston logging** - Structured logs
- **Health checks** - Docker & Kubernetes ready
- **Error tracking** - Comprehensive error handling
- **Performance monitoring** - Request/response logging

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use conventional commit messages

## 📄 License

ISC License - see package.json for details