import fs from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(
    process.cwd(),
    "node_modules/onnxruntime-node/bin/napi-v3/linux/x64",
  );

  try {
    return Response.json({ dir, files: fs.readdirSync(dir) });
  } catch (e) {
    return Response.json({
      dir,
      error: String(e),
      cwd: process.cwd(),
      root: fs.readdirSync(process.cwd()),
    });
  }
}
