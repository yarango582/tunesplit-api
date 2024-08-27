#!/bin/bash

echo "Running diagnostics..."

echo "Python version:"
python3 --version

echo "Spleeter version:"
spleeter --version

echo "FFmpeg version:"
ffmpeg -version | head -n 1

echo "Disk space:"
df -h

echo "Memory info:"
free -m

echo "Testing Spleeter:"
spleeter separate -p spleeter:5stems -o /tmp/spleeter_test /dev/null

echo "Spleeter test output directory contents:"
ls -R /tmp/spleeter_test

echo "Diagnostics completed."