/**
 * Build a complete macOS ICNS (and 1024 PNG master) for the desktop app.
 *
 * Why this exists:
 * electron-builder converting a lone 512 PWA PNG yields a thin ICNS that often
 * omits ic10 (1024). Dock then falls back to the generic empty placeholder —
 * including after clean installs. We prebuild a full iconutil pack and commit it.
 *
 * Usage: bun run prepare:desktop:icons
 */
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { assertMacIcnsComplete } from "./desktop-icns.mjs";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const sourcePng = join(projectRoot, "assets/brand/stillnote-icon.png");
const brandMarkPath = join(projectRoot, "assets/brand/stillnote-mark.svg");
const assetsDir = join(projectRoot, "apps/desktop/assets");

// Apple macOS App Icon Grid places the rounded-square tile at 824x824 inside
// a 1024x1024 canvas (100px margin per side) with a subtle downward shadow.
// Keeping edge-to-edge 1024x1024 makes the Dock tile ~24% wider/taller than native apps.
export const DESKTOP_ICON_CANVAS_SIZE = 1024;
export const DESKTOP_ICON_TILE_SIZE = 824;
export const DESKTOP_ICON_INSET = (DESKTOP_ICON_CANVAS_SIZE - DESKTOP_ICON_TILE_SIZE) / 2;
const DESKTOP_ICON_SHADOW_OFFSET_Y = 12;
const DESKTOP_ICON_SHADOW_SIGMA = 12;
const DESKTOP_ICON_SHADOW_OPACITY = 0.24;

/** iconutil expects these exact basenames inside a .iconset directory. */
const ICONSET_FILES = [
  { name: "icon_16x16.png", size: 16 },
  { name: "icon_16x16@2x.png", size: 32 },
  { name: "icon_32x32.png", size: 32 },
  { name: "icon_32x32@2x.png", size: 64 },
  { name: "icon_128x128.png", size: 128 },
  { name: "icon_128x128@2x.png", size: 256 },
  { name: "icon_256x256.png", size: 256 },
  { name: "icon_256x256@2x.png", size: 512 },
  { name: "icon_512x512.png", size: 512 },
  { name: "icon_512x512@2x.png", size: 1024 },
];

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stderr || result.stdout || result.error}`,
    );
  }
  return result;
};

const writeResizedPng = async (sourceBuffer, size, destination) => {
  await sharp(sourceBuffer)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9 })
    .toFile(destination);
};

export const buildDesktopIconMaster = async (sourceBuffer) => {
  const tileBuffer = await sharp(sourceBuffer)
    .resize(DESKTOP_ICON_TILE_SIZE, DESKTOP_ICON_TILE_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .png()
    .toBuffer();

  const { data: tileRaw, info } = await sharp(tileBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const shadowRaw = Buffer.alloc(tileRaw.length);
  for (let offset = 0; offset < tileRaw.length; offset += 4) {
    shadowRaw[offset] = 0;
    shadowRaw[offset + 1] = 0;
    shadowRaw[offset + 2] = 0;
    shadowRaw[offset + 3] = Math.round(tileRaw[offset + 3] * DESKTOP_ICON_SHADOW_OPACITY);
  }

  const shadowTileBuffer = await sharp(shadowRaw, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  const unblurredShadowCanvas = await sharp({
    create: {
      width: DESKTOP_ICON_CANVAS_SIZE,
      height: DESKTOP_ICON_CANVAS_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: shadowTileBuffer,
        left: DESKTOP_ICON_INSET,
        top: DESKTOP_ICON_INSET + DESKTOP_ICON_SHADOW_OFFSET_Y,
      },
    ])
    .png()
    .toBuffer();

  // Sharp applies .blur() before .composite() in a single pipeline, so blur in a second pass.
  const shadowCanvas = await sharp(unblurredShadowCanvas)
    .blur(DESKTOP_ICON_SHADOW_SIGMA)
    .png()
    .toBuffer();

  return sharp(shadowCanvas)
    .composite([
      {
        input: tileBuffer,
        left: DESKTOP_ICON_INSET,
        top: DESKTOP_ICON_INSET,
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
};

const TRAY_TEMPLATE_ALPHA_THRESHOLD = 80;
const TRAY_MARK_CENTER = { x: 512, y: 512 };
// 22pt matches other macOS menu-bar extras. A round stroke adds ink so the
// folded note keeps up with filled marks like Notion and WeChat without
// crowding the compact 22pt menu-bar slot.
export const TRAY_MARK_SCALE = 1;
export const TRAY_MARK_STROKE_WIDTH = 36;
export const TRAY_TEMPLATE_SIZE = 22;
export const TRAY_TEMPLATE_SIZE_2X = 44;

export const buildMacTrayTemplateSvg = (markSvg) => {
  const pathMatch = markSvg.match(/<path\b[^>]*\sd="([^"]+)"/);
  if (!pathMatch) throw new Error("Brand mark is missing a path");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="StillNote">
  <g transform="translate(512 512) scale(${TRAY_MARK_SCALE}) translate(-${TRAY_MARK_CENTER.x} -${TRAY_MARK_CENTER.y})">
    <path fill="#000000" stroke="#000000" stroke-width="${TRAY_MARK_STROKE_WIDTH}" stroke-linejoin="round" paint-order="stroke fill" fill-rule="evenodd" d="${pathMatch[1]}" />
  </g>
</svg>
`;
};

export const prepareTrayIcons = async ({
  markPath = brandMarkPath,
  assetsDirectory = assetsDir,
} = {}) => {
  await mkdir(assetsDirectory, { recursive: true });
  const markSvg = await readFile(markPath, "utf8");
  const templateSvg = buildMacTrayTemplateSvg(markSvg);
  await writeFile(join(assetsDirectory, "trayTemplate.svg"), templateSvg);

  const sourceBuffer = Buffer.from(templateSvg);
  const render = async (size, density, fileName) => {
    const { data, info } = await sharp(sourceBuffer, { density: 384 })
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: sharp.kernel.lanczos3,
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let offset = 0; offset < data.length; offset += 4) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = data[offset + 3] >= TRAY_TEMPLATE_ALPHA_THRESHOLD ? 255 : 0;
    }
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .withMetadata({ density })
      .png({ compressionLevel: 9 })
      .toFile(join(assetsDirectory, fileName));
  };

  await render(TRAY_TEMPLATE_SIZE, 72, "trayTemplate.png");
  await render(TRAY_TEMPLATE_SIZE_2X, 144, "trayTemplate@2x.png");
  console.log("[prepare-desktop-icons] wrote macOS tray template icons from the brand mark");
};

export const prepareDesktopIcons = async ({
  sourcePath = sourcePng,
  assetsDirectory = assetsDir,
  requireIconutil = process.platform === "darwin",
} = {}) => {
  await mkdir(assetsDirectory, { recursive: true });
  await prepareTrayIcons({ assetsDirectory });
  const sourceBuffer = await readFile(sourcePath);
  const masterBuffer = await buildDesktopIconMaster(sourceBuffer);

  // Master PNG used by electron-builder on Windows/Linux and as a Dock fallback.
  await writeFile(join(assetsDirectory, "icon.png"), masterBuffer);

  if (!requireIconutil) {
    console.log("[prepare-desktop-icons] skipped iconutil on non-macOS; master PNG written.");
    return { icnsPath: join(assetsDirectory, "icon.icns"), pngPath: join(assetsDirectory, "icon.png") };
  }

  const workRoot = await mkdtemp(join(tmpdir(), "stillnote-desktop-icon-"));
  const iconsetDir = join(workRoot, "StillNote.iconset");
  await mkdir(iconsetDir, { recursive: true });

  try {
    for (const { name, size } of ICONSET_FILES) {
      if (size === DESKTOP_ICON_CANVAS_SIZE) {
        await writeFile(join(iconsetDir, name), masterBuffer);
      } else {
        await writeResizedPng(masterBuffer, size, join(iconsetDir, name));
      }
    }

    const icnsPath = join(assetsDirectory, "icon.icns");
    run("iconutil", ["-c", "icns", iconsetDir, "-o", icnsPath]);
    const icnsData = await readFile(icnsPath);
    assertMacIcnsComplete(icnsData, icnsPath);

    console.log(`[prepare-desktop-icons] wrote ${icnsPath} (${icnsData.length} bytes)`);
    console.log(`[prepare-desktop-icons] wrote ${join(assetsDirectory, "icon.png")} (${DESKTOP_ICON_CANVAS_SIZE}×${DESKTOP_ICON_CANVAS_SIZE} master, ${DESKTOP_ICON_TILE_SIZE}×${DESKTOP_ICON_TILE_SIZE} Dock tile)`);
    return { icnsPath, pngPath: join(assetsDirectory, "icon.png") };
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
};

if (import.meta.main) {
  try {
    await prepareDesktopIcons();
  } catch (error) {
    console.error(`[prepare-desktop-icons] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
