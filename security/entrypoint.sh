#!/bin/sh
./memcheck &
./run_legacy_loop &
./backup &
wait