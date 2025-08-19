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
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Handle static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]