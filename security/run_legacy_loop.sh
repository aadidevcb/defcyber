#!/bin/sh
# Run the legacy file every 2 seconds infinitely

while true; do
    ./legacy 
    echo "Hiiiii"
    sleep 1
done
