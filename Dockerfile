# Multi-stage build for McCulloch Jewelry Website

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY Client/package*.json ./
RUN npm ci
COPY Client/ .
RUN npm run build

# Stage 2: Production image with nginx to serve the frontend
FROM nginx:alpine AS production

# Copy built React app to nginx
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY Client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]