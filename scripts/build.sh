#!/bin/bash
# ShieldVIN — Build all dist outputs

set -e

echo "→ ShieldVIN build starting..."

# Ensure dist directory exists
mkdir -p dist

# Build Word document
echo "→ Building Word document..."
node src/docs/build_docx.js
echo "   ✓ dist/ShieldVIN_BusinessPlan.docx"

# Build Excel model
echo "→ Building Excel financial model..."
python src/excel/build_excel.py
echo "   ✓ dist/ShieldVIN_Financial_Model.xlsx"

echo ""
echo "✓ Build complete. Files in dist/"
ls -lh dist/
