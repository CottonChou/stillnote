import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { prepareDesktopIcons } from "./prepare-desktop-icons.mjs";
import { prepareMobileIcons, renderBrandPng } from "./prepare-mobile-icons.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(projectRoot, "assets/brand/edgeever-icon.png");
const svgSourcePath = path.join(projectRoot, "assets/brand/edgeever-icon.svg");
const svgSource = await readFile(svgSourcePath);
await sharp(svgSource, { density: 384 })
  .resize(1024, 1024, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: sharp.kernel.lanczos3,
  })
  .png({ compressionLevel: 9 })
  .toFile(sourcePath);

const source = await readFile(sourcePath);

await copyFile(svgSourcePath, path.join(projectRoot, "apps/web/public/favicon.svg"));
await copyFile(svgSourcePath, path.join(projectRoot, "apps/site/public/favicon.svg"));

const pngTargets = [
  ["apps/web/public/pwa-192x192.png", 192, { preserveAlpha: true }],
  ["apps/web/public/pwa-512x512.png", 512, { preserveAlpha: true }],
  ["apps/web/public/maskable-icon-512x512.png", 512, { background: "#187958" }],
  ["apps/web/public/apple-touch-icon.png", 180, { background: "#187958" }],
  ["apps/site/public/icon-192.png", 192, { preserveAlpha: true }],
  ["apps/site/public/icon-512.png", 512, { preserveAlpha: true }],
  ["apps/site/public/apple-touch-icon.png", 180, { background: "#187958" }],
  ["apps/ios/EdgeEver/Resources/Assets.xcassets/AppIcon.appiconset/icon.png", 1024, { background: "#187958" }],
  ["apps/extension/public/icons/icon-16.png", 16, { preserveAlpha: true }],
  ["apps/extension/public/icons/icon-32.png", 32, { preserveAlpha: true }],
  ["apps/extension/public/icons/icon-48.png", 48, { preserveAlpha: true }],
  ["apps/extension/public/icons/icon-128.png", 128, { preserveAlpha: true }],
  ["apps/extension/store-assets/store-icon-128.png", 128, { preserveAlpha: true }],
];

for (const [destination, size, options] of pngTargets) {
  await renderBrandPng(source, destination, size, options);
}

await prepareMobileIcons();

const faviconPng = await sharp(source, { density: 384 }).resize(32, 32).png().toBuffer();
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(32, 6);
icoHeader.writeUInt8(32, 7);
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(faviconPng.length, 14);
icoHeader.writeUInt32LE(22, 18);
await writeFile(path.join(projectRoot, "apps/site/public/favicon.ico"), Buffer.concat([icoHeader, faviconPng]));

await prepareDesktopIcons();
console.log("[prepare-brand-icons] updated shared brand icons");
