#!/bin/bash
set -e

echo "[vercel-install] Starting Vercel install script..."

# 1. Patch package.json with the override
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.overrides = { ...pkg.overrides, 'onnxruntime-node': 'npm:onnxruntime-web@*' };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('[vercel-install] Patched package.json with onnxruntime override');
"

# 2. Remove cached onnxruntime-node to force reinstall via override
rm -rf node_modules/onnxruntime-node node_modules/.package-lock.json
echo "[vercel-install] Cleared cached onnxruntime-node"

# 3. Install dependencies (override will now take effect)
npm install

# 4. Verify the swap worked
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('node_modules/onnxruntime-node/package.json', 'utf8'));
if (p.name === 'onnxruntime-web') {
  console.log('[vercel-install] SUCCESS: onnxruntime-node replaced with onnxruntime-web@' + p.version);
} else {
  console.error('[vercel-install] FAILED: onnxruntime-node is still ' + p.name + '@' + p.version);
  process.exit(1);
}
"
