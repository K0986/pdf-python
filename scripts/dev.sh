#!/bin/bash
set -e

echo "🛠️  Starting PDF Forge Local Development Environment..."
echo "1. Checking Python venv..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt

echo "2. Launching PDF Forge..."
python run.py
