# Multi-stage build for McCulloch Jewelry Website

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/client
COPY Client/package*.json ./
RUN npm ci
COPY Client/ .
RUN npm run build

# Stage 2: Setup the Node.js backend
FROM node:18-alpine AS backend-build
WORKDIR /app/server
COPY Server/package*.json ./
RUN npm ci
COPY Server/ .

# Stage 3: Production image
FROM node:18-alpine AS production
WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy backend files
COPY --from=backend-build /app/server ./server
WORKDIR /app/server
RUN npm ci --only=production

# Copy built frontend files
COPY --from=frontend-build /app/client/dist ./public

# Create a simple script to start both services
WORKDIR /app
RUN echo '#!/bin/sh' > start.sh && \
    echo 'serve -s ./public -p 3000 &' >> start.sh && \
    echo 'cd server && npm start &' >> start.sh && \
    echo 'wait' >> start.sh && \
    chmod +x start.sh

EXPOSE 3000 3001

CMD ["./start.sh"]