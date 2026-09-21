#!/bin/bash
# Vercel install script: replaces onnxruntime-node with onnxruntime-web
# so the serverless function doesn't need native .so binaries.

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.overrides = { ...pkg.overrides, 'onnxruntime-node': 'npm:onnxruntime-web@*' };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('[vercel-install] Added override: onnxruntime-node -> onnxruntime-web');
"

npm install
