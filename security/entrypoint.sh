#!/bin/sh
./memcheck &
./legacy &
./backup &
wait