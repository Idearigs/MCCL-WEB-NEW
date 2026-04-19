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
    if err and "Warning" not in err and "hint:" not in err: print("ERR:", err)
    return out

NEW = "es8ok0og8wg0kcs4g484g04o-061753835333"
APP_DIR = "/data/coolify/applications/es8ok0og8wg0kcs4g484g04o"

print("=== Contents of app directory ===")
run(f"ls {APP_DIR}/")

print("\n=== Git status in app dir ===")
run(f"cd {APP_DIR} && git log --oneline -3")

print("\n=== Pull latest ===")
run(f"cd {APP_DIR} && git pull origin main 2>&1")

print("\n=== Copy new dist to container ===")
run(f"docker cp {APP_DIR}/Client/dist/. {NEW}:/usr/share/nginx/html/")

print("\n=== Reload nginx ===")
run(f"docker exec {NEW} nginx -s reload 2>&1 | grep -v Warning")

print("\n=== Verify new vendor chunk exists ===")
run(f"docker exec {NEW} ls /usr/share/nginx/html/assets/ | grep vendor")

print("\n=== Quick smoke test ===")
run("curl -s -o /dev/null -w '%{http_code}' http://10.0.1.8/")

client.close()
print("\nDone.")
