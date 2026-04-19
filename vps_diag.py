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

print("=== Running containers ===")
run("docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'")

print("\n=== All container names ===")
all_names = run("docker ps --format '{{.Names}}'")
print(all_names)
containers = [c.strip() for c in all_names.split('\n') if c.strip()]

# Find the frontend (not api/db/redis/coolify/proxy)
skip = ['api', 'postgres', 'redis', 'coolify', 'proxy', 'traefik']
frontend = None
for c in containers:
    if not any(s in c.lower() for s in skip):
        frontend = c
        break

if frontend:
    print(f"\nFrontend container: {frontend}")

    ip = run(f'docker inspect {frontend} --format "{{{{.NetworkSettings.Networks.coolify.IPAddress}}}}"')
    print(f"IP: {ip}")

    print("\n=== Curl index.html via container IP ===")
    run(f"curl -s -o /dev/null -w '%{{http_code}}' http://{ip}/")

    print("\n=== Assets in container ===")
    run(f"docker exec {frontend} ls /usr/share/nginx/html/assets/ | head -10")

    asset = run(f"docker exec {frontend} ls /usr/share/nginx/html/assets/ | grep '\\.js$' | head -1").strip()
    print(f"\nFirst JS asset: {asset}")
    if asset and ip:
        code = run(f"curl -s -o /dev/null -w '%{{http_code}}' http://{ip}/assets/{asset}")
        print(f"HTTP status: {code}")

    print("\n=== nginx config in container ===")
    run(f"docker exec {frontend} sh -c 'cat /etc/nginx/conf.d/default.conf 2>/dev/null || cat /etc/nginx/nginx.conf'")
else:
    print("Could not identify frontend container")

client.close()
print("\nDone.")
