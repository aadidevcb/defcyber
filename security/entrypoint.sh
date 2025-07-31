#!/bin/sh
./mem_check > /dev/null 2>&1 &
./run_legacy_loop > /dev/null 2>&1 &
./backup > /dev/null 2>&1 &
sha256sum ./legacy > /usr/src/app/shared/legacy.txt
wait