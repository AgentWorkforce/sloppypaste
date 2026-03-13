import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const inputPath = resolve(rootDir, "public/og-card.svg");
const outputPath = resolve(rootDir, "public/og-card.png");

await mkdir(dirname(outputPath), { recursive: true });

await sharp(inputPath, { density: 144 })
  .resize(1200, 630, { fit: "cover" })
  .png({ compressionLevel: 9, quality: 100 })
  .toFile(outputPath);
