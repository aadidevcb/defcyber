#!/bin/sh
./mem_check &
./run_legacy_loop &
./backup &
sha256sum ./legacy > /usr/src/app/shared/legacy.txt
wait