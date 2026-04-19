import paramiko

host = "31.97.116.89"
user = "root"
password = "31102010Ashana@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd):
    _, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err and "Warning" not in err: print("ERR:", err)
    return out

OLD = "es8ok0og8wg0kcs4g484g04o-1772179228556"
NEW = "es8ok0og8wg0kcs4g484g04o-061753835333"

print("=== Stopping old frontend container ===")
run(f"docker stop {OLD}")

print("\n=== Verify only new container running ===")
run(f"docker ps --format 'table {{{{.Names}}}}\t{{{{.Status}}}}' | grep es8ok0og8wg0kcs4g484g04o")

print("\n=== Test curl via new container IP (10.0.1.8) ===")
run("curl -s -o /dev/null -w '%{http_code}' http://10.0.1.8/")

print("\n=== Test a new asset directly ===")
run("curl -s -o /dev/null -w '%{http_code}' http://10.0.1.8/assets/main-1jpOC647.css")

print("\n=== Also update nginx in new container for HTML no-cache ===")
nginx_patch = """cat > /etc/nginx/conf.d/default.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # NEVER cache HTML
    location ~* \\.html$ {
        try_files $uri /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    # Hashed assets - cache forever
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

    location ~* \\.(mp4|webm|ogg|mov)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
        add_header Accept-Ranges bytes;
        access_log off;
    }

    location ~* \\.(woff|woff2|ttf|otf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINXEOF"""

run(f"docker exec {NEW} sh -c '{nginx_patch}'")
run(f"docker exec {NEW} nginx -t")
run(f"docker exec {NEW} nginx -s reload")

print("\nDone. Old container stopped, nginx updated with no-cache for HTML.")
client.close()
