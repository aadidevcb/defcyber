#!/bin/sh

# Ensure we're root
if [ "$(id -u)" -ne 0 ]; then
    echo "Run this script with sudo or as root."
    exit 1
fi

echo "[+] Installing required packages..."
if ! command -v iptables >/dev/null 2>&1; then
    apt update && apt install -y iptables
fi

for tool in awk expr; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "[!] Required tool '$tool' is missing."
        exit 1
    fi
done

MONITOR_SCRIPT="/usr/local/bin/iptables_speed_monitor.sh"
iptables -I INPUT 1 -j ACCEPT
iptables -I OUTPUT 1 -j ACCEPT

echo "[+] Writing monitor script to $MONITOR_SCRIPT..."

cat > "$MONITOR_SCRIPT" << 'EOF'
#!/bin/sh

OUTFILE="network.json"

get_bytes() {
    chain=$1
    val=$(iptables -L "$chain" -v -x | awk '$1 ~ /^[0-9]+$/ && $3 == "ACCEPT" {print $2; exit}')
    [ -z "$val" ] && val=0
    echo "$val"
}

while true; do
    in1=$(get_bytes INPUT)
    out1=$(get_bytes OUTPUT)
    sleep 1
    in2=$(get_bytes INPUT)
    out2=$(get_bytes OUTPUT)

    din=$(expr "$in2" - "$in1")
    dout=$(expr "$out2" - "$out1")

    echo "{\"down\":$din,\"up\":$dout}" > "$OUTFILE"
done
EOF

chmod +x "$MONITOR_SCRIPT"

echo "[+] Setup complete. Start monitoring Now"
$MONITOR_SCRIPT
