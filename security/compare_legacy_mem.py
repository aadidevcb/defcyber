import os
import subprocess
import time
import hashlib
import re
import sys

LEGACY_PATH = './legacy'  # Path to the legacy binary
LEGACY_ARGS = []          # Add any required arguments here
DUMP_DIR = './Temp'

# Helper to compute SHA256 of a byte buffer
def sha256_bytes(data):
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()

# Helper to parse /proc/<pid>/maps and dump all regions
def dump_all_regions(pid, tag):
    maps_path = f'/proc/{pid}/maps'
    mem_path = f'/proc/{pid}/mem'
    regions = {}
    try:
        with open(maps_path, 'r') as maps, open(mem_path, 'rb') as mem:
            for line in maps:
                m = re.match(r'([0-9a-f]+)-([0-9a-f]+) ([rwxp-]+) .*?\s*(\S*)$', line)
                if not m:
                    continue
                start, end, perms, region_name = m.groups()
                if 'r' not in perms:
                    continue
                start = int(start, 16)
                end = int(end, 16)
                size = end - start
                try:
                    mem.seek(start)
                    data = mem.read(size)
                    sha = sha256_bytes(data)
                    regions[(region_name or '[anon]', start, end, perms)] = sha
                    # Optionally, save each region to a file for manual inspection
                    # with open(f'{DUMP_DIR}/dump_{tag}_{region_name}_{start:x}-{end:x}.bin', 'wb') as f:
                    #     f.write(data)
                except Exception as e:
                    regions[(region_name or '[anon]', start, end, perms)] = f'ERROR: {e}'
    except Exception as e:
        print(f'Error dumping regions for pid {pid}: {e}')
    return regions

def run_and_dump(tag):
    # Start legacy process
    proc = subprocess.Popen([LEGACY_PATH] + LEGACY_ARGS)
    time.sleep(1)  # Give it time to initialize
    pid = proc.pid
    print(f'Launched legacy (pid={pid}) for {tag}')
    regions = dump_all_regions(pid, tag)
    proc.terminate()
    proc.wait()
    return regions

def print_region_hashes(regions, label):
    print(f'\n--- Memory region SHA256 for {label} ---')
    for (name, start, end, perms), sha in sorted(regions.items(), key=lambda x: (x[0][0], x[0][1])):
        print(f'{name:20} {start:08x}-{end:08x} {perms}  {sha}')

def main():
    os.makedirs(DUMP_DIR, exist_ok=True)
    regions1 = run_and_dump('run1')
    regions2 = run_and_dump('run2')
    print_region_hashes(regions1, 'run1')
    print_region_hashes(regions2, 'run2')
    print('\n--- Region hash comparison by (name, perms) (true=same, false=different) ---')
    # Build dicts by (region_name, perms)
    def by_name_perms(regions):
        d = {}
        for (name, start, end, perms), sha in regions.items():
            d[(name, perms)] = sha
        return d
    r1 = by_name_perms(regions1)
    r2 = by_name_perms(regions2)
    all_keys = set(r1.keys()) | set(r2.keys())
    for key in sorted(all_keys):
        sha1 = r1.get(key)
        sha2 = r2.get(key)
        same = (sha1 == sha2)
        print(f'{key[0]:20} {key[1]}  {same}')
        print(f'  run1: {sha1}')
        print(f'  run2: {sha2}')

if __name__ == '__main__':
    if not os.path.exists(LEGACY_PATH):
        print(f'Error: {LEGACY_PATH} not found. Set LEGACY_PATH to your legacy binary.')
        sys.exit(1)
    main()
