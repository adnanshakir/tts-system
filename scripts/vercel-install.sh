#!/bin/bash
echo "[vercel-install] Starting..."
node scripts/patch-onnx.js
rm -rf node_modules/onnxruntime-node
npm install
echo "[vercel-install] Done"
