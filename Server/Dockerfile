# McCulloch Backend API - Production Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (all packages including dev for build tools like bcrypt)
RUN npm install

# Copy application code
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads/products && \
    chmod -R 777 uploads

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
