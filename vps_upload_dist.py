import paramiko
import os

host = "31.97.116.89"
user = "root"
password = "31102010Ashana@"

LOCAL_DIST = r"C:\xampp\htdocs\TESTMCCL\McCulloch Website\McCulloch Website\Client\dist"
REMOTE_TMP = "/tmp/mccl_dist"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=30)

def run(cmd):
    _, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err and "Warning" not in err: print("ERR:", err[:200])
    return out

# Find current frontend container
print("=== Current containers ===")
all_c = run("docker ps --format '{{.Names}}\t{{.Status}}'")
print(all_c)

skip = ['api', 'postgres', 'redis', 'coolify', 'proxy', 'traefik']
frontend = None
for line in all_c.split('\n'):
    name = line.split('\t')[0].strip()
    if name and not any(s in name.lower() for s in skip):
        frontend = name
        break

print(f"\nFrontend container: {frontend}")

if not frontend:
    client.close()
    exit(1)

# Check what vendor chunks are currently in the container
print("\n=== Current vendor chunks in container ===")
run(f"docker exec {frontend} ls /usr/share/nginx/html/assets/ | grep vendor")

# Check if already updated (has new vendor-D chunk)
assets = run(f"docker exec {frontend} ls /usr/share/nginx/html/assets/ | grep 'vendor-D'")
if assets:
    print("\nContainer already has new vendor chunk! Checking if site works...")
    ip = run(f'docker inspect {frontend} --format "{{{{.NetworkSettings.Networks.coolify.IPAddress}}}}"')
    run(f"curl -sI http://{ip}/ | grep -i cache-control")
    client.close()
    print("Done - already up to date.")
    exit(0)

# Upload dist
sftp = client.open_sftp()

def mkdir_p(sftp, remote_path):
    parts = remote_path.replace("\\", "/").split("/")
    path = ""
    for part in parts:
        if not part:
            path = "/"
            continue
        path = path + "/" + part if path != "/" else "/" + part
        try:
            sftp.stat(path)
        except FileNotFoundError:
            sftp.mkdir(path)

def upload_dir(sftp, local_dir, remote_dir):
    mkdir_p(sftp, remote_dir)
    count = 0
    for entry in os.scandir(local_dir):
        remote_path = remote_dir + "/" + entry.name
        if entry.is_dir():
            count += upload_dir(sftp, entry.path, remote_path)
        else:
            sftp.put(entry.path, remote_path)
            count += 1
    return count

print(f"\nCleaning remote tmp dir...")
run(f"rm -rf {REMOTE_TMP}")

print(f"Uploading dist/ ...")
total = upload_dir(sftp, LOCAL_DIST, REMOTE_TMP)
sftp.close()
print(f"Uploaded {total} files.")

print(f"\nCopying into container {frontend}...")
run(f"docker cp {REMOTE_TMP}/. {frontend}:/usr/share/nginx/html/")

print("\n=== Vendor chunks after update ===")
run(f"docker exec {frontend} ls /usr/share/nginx/html/assets/ | grep vendor")

# Re-apply nginx no-cache config
sftp2 = client.open_sftp()
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
with sftp2.open('/tmp/nginx_default.conf', 'wb') as f:
    f.write(nginx_conf)
sftp2.close()

print("\nApplying nginx no-cache config...")
run(f"docker cp /tmp/nginx_default.conf {frontend}:/etc/nginx/conf.d/default.conf")
run(f"docker exec {frontend} nginx -t 2>&1 | grep -v Warning | grep -v warn")
run(f"docker exec {frontend} nginx -s reload 2>&1 | grep -v Warning | grep -v warn")

ip = run(f'docker inspect {frontend} --format "{{{{.NetworkSettings.Networks.coolify.IPAddress}}}}"')
print(f"\n=== Smoke tests (IP: {ip}) ===")
run(f"curl -s -o /dev/null -w 'HTTP %{{http_code}}' http://{ip}/")
run(f"curl -sI http://{ip}/ | grep -i cache-control")

client.close()
print("\nDone.")
