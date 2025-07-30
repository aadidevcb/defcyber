

import json
import os
import docker
import time

# CONFIGURABLES
SHARED_FOLDER = os.path.join(os.path.dirname(__file__), 'security')
NETWORK_FILE = os.path.join(SHARED_FOLDER, 'network.json')
PORTS_FILE = os.path.join(SHARED_FOLDER, 'ports.json')
ALLOWED_PORTS = [22, 80, 443]  # Update as needed
DOCKER_CONTAINER_NAME = "my_container"  # Change to your actual container name

def network_check():
    try:
        with open(NETWORK_FILE, 'r') as f:
            data = json.load(f)
        down = data.get('down', 0)
        up = data.get('up', 0)
        print(f"Network usage - Down: {down}, Up: {up}")
        if up > 10000 or down > 100000:
            print("Threshold exceeded! Initiating lockdown...")
            shutdown()
        else:
            print("Network usage within limits.")
    except Exception as e:
        print(f"Error reading network file: {e}")

def ports_open():
    try:
        with open(PORTS_FILE, 'r') as f:
            data = json.load(f)
        open_ports = data.get('open_ports', [])
        extra_ports = [p for p in open_ports if p not in ALLOWED_PORTS]
        if extra_ports:
            print("Extra open ports detected:", extra_ports)
        else:
            print("No unauthorized open ports.")
    except Exception as e:
        print(f"Error reading ports file: {e}")

def shutdown():
    try:
        client = docker.from_env()
        container = client.containers.get(DOCKER_CONTAINER_NAME)
        exec_log = container.exec_run("/app/firewall shutdown", stdout=True, stderr=True)
        print("Shutdown Output:", exec_log.output.decode())
    except Exception as e:
        print(f"Error during shutdown: {e}")

def reset():
    try:
        client = docker.from_env()
        container = client.containers.get(DOCKER_CONTAINER_NAME)
        exec_log = container.exec_run("/app/firewall normal", stdout=True, stderr=True)
        print("Reset Output:", exec_log.output.decode())
    except Exception as e:
        print(f"Error during reset: {e}")

def run_manager_loop(interval=5):
    print("Starting manager loop. Press Ctrl+C to stop.")
    try:
        while True:
            network_check()
            ports_open()
            time.sleep(interval)
    except KeyboardInterrupt:
        print("Manager loop stopped.")

# The shutdown and reset functions are importable for Django or other scripts

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Manager Utility")
    parser.add_argument("action", choices=["run", "network_check", "ports_open", "shutdown", "reset"], help="Action to perform")
    parser.add_argument("--interval", type=int, default=5, help="Loop interval in seconds (for run mode)")
    args = parser.parse_args()
    if args.action == "run":
        run_manager_loop(args.interval)
    elif args.action == "network_check":
        network_check()
    elif args.action == "ports_open":
        ports_open()
    elif args.action == "shutdown":
        shutdown()
    elif args.action == "reset":
        reset()
