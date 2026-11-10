import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandBackground = "#187958";

export const renderBrandPng = async (
  input,
  destination,
  size,
  { preserveAlpha = false, background = brandBackground } = {},
) => {
  const outputPath = path.join(projectRoot, destination);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const pipeline = sharp(input, { density: 384 }).resize(size, size, {
    fit: "contain",
    kernel: sharp.kernel.lanczos3,
  });
  if (!preserveAlpha) {
    pipeline.flatten({ background }).removeAlpha();
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(outputPath);
};

export const prepareMobileIcons = async () => {
  const [iconSource, adaptiveForegroundSource, adaptiveTransparentSource] = await Promise.all([
    readFile(path.join(projectRoot, "assets/brand/edgeever-icon.svg")),
    readFile(path.join(projectRoot, "apps/mobile/assets/adaptive-icon-foreground.svg")),
    readFile(path.join(projectRoot, "apps/mobile/assets/adaptive-icon-transparent.svg")),
  ]);

  await Promise.all([
    renderBrandPng(iconSource, "apps/mobile/assets/icon.png", 1024),
    renderBrandPng(iconSource, "apps/mobile/store-assets/play-icon-512.png", 512),
    renderBrandPng(adaptiveForegroundSource, "apps/mobile/assets/adaptive-icon-foreground.png", 1024, {
      preserveAlpha: true,
    }),
    renderBrandPng(adaptiveTransparentSource, "apps/mobile/assets/adaptive-icon-transparent.png", 1024, {
      preserveAlpha: true,
    }),
  ]);
};

if (import.meta.main) {
  await prepareMobileIcons();
  console.log("已同步 Android 图标资源");
}
