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

NEW = "es8ok0og8wg0kcs4g484g04o-061753835333"

# Write the nginx config file directly via SFTP
sftp = client.open_sftp()

nginx_conf = b"""server {
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

    # NEVER cache HTML - index.html references hashed asset filenames
    location ~* \\.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        try_files $uri /index.html;
    }

    # Hashed assets - cache forever (Vite content-hashes every filename)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

    # SPA routing - unknown paths fall back to index.html
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
"""

# Write to /tmp first, then copy into container
with sftp.open('/tmp/nginx_default.conf', 'wb') as f:
    f.write(nginx_conf)
sftp.close()

print("=== Copying nginx config into container ===")
run(f"docker cp /tmp/nginx_default.conf {NEW}:/etc/nginx/conf.d/default.conf")

print("\n=== Testing nginx config ===")
run(f"docker exec {NEW} nginx -t 2>&1 | grep -v Warning")

print("\n=== Reloading nginx ===")
run(f"docker exec {NEW} nginx -s reload")

print("\n=== Verify no-cache header on index.html ===")
run("curl -s -I http://10.0.1.8/ | grep -i 'cache-control'")

print("\n=== Verify asset still returns 200 ===")
asset = run(f"docker exec {NEW} ls /usr/share/nginx/html/assets/ | grep '\\.js$' | head -1").strip()
run(f"curl -s -o /dev/null -w '%{{http_code}}' http://10.0.1.8/assets/{asset}")

client.close()
print("\nDone.")
