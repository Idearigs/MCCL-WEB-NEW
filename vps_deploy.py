import paramiko

host = "31.97.116.89"
user = "root"
password = "31102010Ashana@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd):
    _, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err and "Warning" not in err: print("ERR:", err)
    return out

NEW = "es8ok0og8wg0kcs4g484g04o-061753835333"

print("=== Pulling latest code in container ===")
run(f"docker exec {NEW} sh -c 'cd /app 2>/dev/null || cd /usr/share/nginx/html; git pull origin main 2>&1 | tail -5'")

# Alternative: copy the dist files directly from git
print("\n=== Finding git repo path on host ===")
path = run("find /root /home /srv /opt -name 'package.json' -path '*/Client/package.json' 2>/dev/null | head -3")
print(path)

# Try the typical Coolify path
print("\n=== List Coolify application directories ===")
run("ls /data/coolify/applications/ 2>/dev/null | head -10 || ls /var/lib/coolify/ 2>/dev/null | head -10")

client.close()
print("\nDone.")
