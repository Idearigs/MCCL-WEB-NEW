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

print("=== OLD container assets ===")
run(f"docker exec {OLD} ls /usr/share/nginx/html/assets/ | grep '\\.js$' | head -5")

print("\n=== NEW container assets ===")
run(f"docker exec {NEW} ls /usr/share/nginx/html/assets/ | grep '\\.js$' | head -5")

print("\n=== OLD container IP ===")
old_ip = run(f'docker inspect {OLD} --format "{{{{.NetworkSettings.Networks.coolify.IPAddress}}}}"')
print(f"OLD IP: {old_ip}")

print("\n=== NEW container IP ===")
new_ip = run(f'docker inspect {NEW} --format "{{{{.NetworkSettings.Networks.coolify.IPAddress}}}}"')
print(f"NEW IP: {new_ip}")

print("\n=== Traefik labels on NEW container ===")
run(f"docker inspect {NEW} --format '{{{{json .Config.Labels}}}}' | python3 -c \"import sys,json; labels=json.load(sys.stdin); [print(k,'=',v) for k,v in labels.items() if 'traefik' in k.lower()]\"")

print("\n=== Traefik labels on OLD container ===")
run(f"docker inspect {OLD} --format '{{{{json .Config.Labels}}}}' | python3 -c \"import sys,json; labels=json.load(sys.stdin); [print(k,'=',v) for k,v in labels.items() if 'traefik' in k.lower()]\"")

print("\n=== curl via OLD container IP (root) ===")
run(f"curl -s -o /dev/null -w '%{{http_code}}' http://{old_ip}/")

print("\n=== curl known OLD hash asset from OLD container ===")
# The 404 asset hash
run(f"curl -s -o /dev/null -w '%{{http_code}}' http://{old_ip}/assets/main-1jpOC647.css")

print("\n=== Does OLD container have new assets? ===")
run(f"docker exec {OLD} ls /usr/share/nginx/html/assets/ | grep 'main-' | head -10")

client.close()
print("\nDone.")
