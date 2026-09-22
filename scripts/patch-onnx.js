const fs = require("fs");
const path = require("path");

const pkgPath = path.join(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

pkg.overrides = Object.assign({}, pkg.overrides, {
  "onnxruntime-node": "npm:onnxruntime-web@*",
});

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log("[vercel-install] Patched package.json with onnxruntime override");
