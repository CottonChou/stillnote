import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { parseIcnsEntries } from "./desktop-icns.mjs";
import {
  buildDesktopIconMaster,
  DESKTOP_ICON_CANVAS_SIZE,
  DESKTOP_ICON_INSET,
  DESKTOP_ICON_TILE_SIZE,
} from "./prepare-desktop-icons.mjs";

const measureOpaqueBounds = async (pngBuffer, alphaThreshold = 200) => {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] >= alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return {
    width: info.width,
    height: info.height,
    minX,
    minY,
    maxX,
    maxY,
    opaqueWidth: maxX - minX + 1,
    opaqueHeight: maxY - minY + 1,
  };
};

describe("prepare-desktop-icons", () => {
  test("frames an edge-to-edge tile to macOS Dock HIG bounds (824x824 in 1024x1024)", async () => {
    const fullBleedSquare = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 24, g: 121, b: 88, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const master = await buildDesktopIconMaster(fullBleedSquare);
    const bounds = await measureOpaqueBounds(master);

    expect(bounds.width).toBe(DESKTOP_ICON_CANVAS_SIZE);
    expect(bounds.height).toBe(DESKTOP_ICON_CANVAS_SIZE);
    expect(bounds.minX).toBe(DESKTOP_ICON_INSET);
    expect(bounds.minY).toBe(DESKTOP_ICON_INSET);
    expect(bounds.maxX).toBe(DESKTOP_ICON_CANVAS_SIZE - DESKTOP_ICON_INSET - 1);
    expect(bounds.maxY).toBe(DESKTOP_ICON_CANVAS_SIZE - DESKTOP_ICON_INSET - 1);
    expect(bounds.opaqueWidth).toBe(DESKTOP_ICON_TILE_SIZE);
    expect(bounds.opaqueHeight).toBe(DESKTOP_ICON_TILE_SIZE);
  });

  test("committed desktop icon.png and icns ic10 keep macOS Dock padding", async () => {
    const assetsDir = join(import.meta.dir, "../apps/desktop/assets");
    const pngBounds = await measureOpaqueBounds(await readFile(join(assetsDir, "icon.png")));
    expect(pngBounds.width).toBe(1024);
    expect(pngBounds.height).toBe(1024);
    expect(pngBounds.opaqueWidth).toBe(DESKTOP_ICON_TILE_SIZE);
    expect(pngBounds.opaqueHeight).toBe(DESKTOP_ICON_TILE_SIZE);
    expect(pngBounds.minX).toBeGreaterThanOrEqual(DESKTOP_ICON_INSET);
    expect(pngBounds.minY).toBeGreaterThanOrEqual(DESKTOP_ICON_INSET);

    const icnsBuffer = await readFile(join(assetsDir, "icon.icns"));
    const ic10 = parseIcnsEntries(icnsBuffer).find((entry) => entry.type === "ic10");
    expect(ic10).toBeDefined();
    const ic10Png = icnsBuffer.subarray(ic10.offset + 8, ic10.offset + ic10.length);
    const ic10Bounds = await measureOpaqueBounds(ic10Png);
    expect(ic10Bounds.width).toBe(1024);
    expect(ic10Bounds.height).toBe(1024);
    expect(ic10Bounds.opaqueWidth).toBe(DESKTOP_ICON_TILE_SIZE);
    expect(ic10Bounds.opaqueHeight).toBe(DESKTOP_ICON_TILE_SIZE);
  });
});
