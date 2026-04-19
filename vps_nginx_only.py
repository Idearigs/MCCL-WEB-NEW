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
    if err and "Warning" not in err: print("ERR:", err[:300])
    return out

CONTAINER = "es8ok0og8wg0kcs4g484g04o-071033239959"

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

    location ~* \\.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        try_files $uri /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

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
with sftp.open('/tmp/nginx_default.conf', 'wb') as f:
    f.write(nginx_conf)
sftp.close()

print("Copying nginx config...")
run(f"docker cp /tmp/nginx_default.conf {CONTAINER}:/etc/nginx/conf.d/default.conf")

print("Testing config...")
result = run(f"docker exec {CONTAINER} nginx -t 2>&1 | grep -v Warning | grep -v warn")

print("Reloading nginx...")
run(f"docker exec {CONTAINER} nginx -s reload 2>&1 | grep -v Warning | grep -v warn")

ip = run(f'docker inspect {CONTAINER} --format "{{{{.NetworkSettings.Networks.coolify.IPAddress}}}}"')
print(f"\nSmoke tests (IP: {ip}):")
run(f"curl -s -o /dev/null -w 'Index: HTTP %{{http_code}}\\n' http://{ip}/")
run(f"curl -sI http://{ip}/ | grep -i cache-control")
asset = run(f"docker exec {CONTAINER} ls /usr/share/nginx/html/assets/ | grep 'vendor-D' | head -1").strip()
run(f"curl -s -o /dev/null -w 'vendor.js: HTTP %{{http_code}}\\n' http://{ip}/assets/{asset}")

client.close()
print("Done.")
