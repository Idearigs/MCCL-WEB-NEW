#!/bin/bash

# Create media folder structure in the uploads volume
mkdir -p /app/uploads/products/images
mkdir -p /app/uploads/products/videos
mkdir -p /app/uploads/watches/images
mkdir -p /app/uploads/watches/videos

# Set permissions
chmod -R 755 /app/uploads

echo "✓ Media folder structure created:"
echo "  /app/uploads/products/images"
echo "  /app/uploads/products/videos"
echo "  /app/uploads/watches/images"
echo "  /app/uploads/watches/videos"
