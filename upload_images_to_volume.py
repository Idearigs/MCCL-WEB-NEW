"""
Upload missing product images to VPS Docker volume.
"""

import os
import paramiko

HOST = '31.97.116.89'
PORT = 22
USER = 'root'
PASSWORD = '31102010Ashana@'
VOLUME_PRODUCTS = '/var/lib/docker/volumes/xsgkgg808g0g4oso8cwgkkkk-mcculloch-media/_data/products'

BASE = 'C:/xampp/htdocs/TESTMCCL/McCulloch Website/McCulloch Website'
SERVER_UPLOADS = os.path.join(BASE, 'Server', 'uploads', 'products')
CLIENT_IMAGES = os.path.join(BASE, 'Client', 'images', 'Engagement-rings')


def connect():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
    ssh.get_transport().set_keepalive(15)
    sftp = ssh.open_sftp()
    sftp.get_channel().settimeout(120)
    return ssh, sftp


def remote_mkdir(sftp, path):
    """Create remote directory, silently ignore if exists."""
    try:
        sftp.mkdir(path)
    except OSError:
        pass  # already exists or permission (volume root)


def ensure_remote_dir(sftp, remote_dir):
    """Create all path components."""
    parts = [p for p in remote_dir.split('/') if p]
    current = ''
    for part in parts:
        current += '/' + part
        remote_mkdir(sftp, current)


def upload_dir(sftp, local_dir, remote_dir, ssh_holder):
    """Recursively upload local_dir to remote_dir. Returns count uploaded."""
    ensure_remote_dir(sftp, remote_dir)
    total = 0
    for item in sorted(os.listdir(local_dir)):
        local_path = os.path.join(local_dir, item)
        clean_item = item.replace(' - ', '-').replace(' ', '')
        remote_path = remote_dir.rstrip('/') + '/' + clean_item
        if os.path.isdir(local_path):
            total += upload_dir(sftp, local_path, remote_path, ssh_holder)
        else:
            try:
                sftp.stat(remote_path)
            except FileNotFoundError:
                try:
                    sftp.put(local_path, remote_path)
                    total += 1
                except Exception as e:
                    print(f'    ERROR uploading {item}: {e}')
    return total


def main():
    print(f'Connecting to {HOST}...')
    ssh, sftp = connect()
    print('Connected.\n')

    grand_total = 0

    # 1. Upload BJ-001 to BJ-099 from Server/uploads/products/
    print('=== Uploading BJ-001 to BJ-099 (Server/uploads/products/) ===')
    for folder in sorted(os.listdir(SERVER_UPLOADS)):
        local_path = os.path.join(SERVER_UPLOADS, folder)
        if not os.path.isdir(local_path) or not folder.startswith('BJ-0'):
            continue
        remote_path = f'{VOLUME_PRODUCTS}/{folder}'
        try:
            count = upload_dir(sftp, local_path, remote_path, ssh)
        except Exception as e:
            print(f'  {folder}: ERROR {e} — reconnecting...')
            try: sftp.close(); ssh.close()
            except: pass
            ssh, sftp = connect()
            count = upload_dir(sftp, local_path, remote_path, ssh)
        if count:
            print(f'  {folder}: uploaded {count} files')
        else:
            print(f'  {folder}: already up to date')
        grand_total += count

    # 2. Upload BJ-112 to BJ-119 from Client/images/Engagement-rings/
    print('\n=== Uploading BJ-112 to BJ-119 (Client/images/Engagement-rings/) ===')
    for folder in sorted(os.listdir(CLIENT_IMAGES)):
        local_path = os.path.join(CLIENT_IMAGES, folder)
        if not os.path.isdir(local_path) or not folder.startswith('BJ-'):
            continue
        try:
            bj_num = int(folder.replace('BJ-', ''))
        except ValueError:
            continue
        if bj_num < 112:
            continue
        remote_path = f'{VOLUME_PRODUCTS}/{folder}'
        try:
            count = upload_dir(sftp, local_path, remote_path, ssh)
        except Exception as e:
            print(f'  {folder}: ERROR {e} — reconnecting...')
            try: sftp.close(); ssh.close()
            except: pass
            ssh, sftp = connect()
            count = upload_dir(sftp, local_path, remote_path, ssh)
        if count:
            print(f'  {folder}: uploaded {count} files')
        else:
            print(f'  {folder}: already up to date')
        grand_total += count

    # 3. Upload loose media/image_url files from Server/uploads/products/ root
    print('\n=== Uploading loose media files ===')
    for item in sorted(os.listdir(SERVER_UPLOADS)):
        local_path = os.path.join(SERVER_UPLOADS, item)
        if os.path.isdir(local_path):
            continue
        if not (item.startswith('media') or item.startswith('image_url')):
            continue
        remote_path = f'{VOLUME_PRODUCTS}/{item}'
        try:
            sftp.stat(remote_path)
        except FileNotFoundError:
            try:
                sftp.put(local_path, remote_path)
                print(f'  {item}: uploaded')
                grand_total += 1
            except Exception as e:
                print(f'  {item}: ERROR {e}')

    sftp.close()
    ssh.close()
    print(f'\nDone. Total files uploaded: {grand_total}')


if __name__ == '__main__':
    main()
