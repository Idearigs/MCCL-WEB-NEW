# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Force rebuild timestamp
RUN echo "Build timestamp: $(date)" > /tmp/build.txt

# Install PostgreSQL client (for database operations)
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install ALL dependencies including devDependencies
# Using npm install instead of npm ci to ensure everything is installed
RUN npm install && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown nodejs:nodejs /app/uploads

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port (can be overridden by environment variable)
EXPOSE 3000

# Health check - uses PORT environment variable or defaults to 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; \
    require('http').get('http://localhost:' + port + '/health', (res) => { \
      if (res.statusCode === 200) process.exit(0); \
      else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Start the application
CMD ["npm", "start"]