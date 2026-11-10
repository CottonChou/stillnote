import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const globals = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("image gallery layout", () => {
  test("floats the wrapping toolbar above the images and reveals it on hover or keyboard focus", () => {
    const toolbar = globals.match(/\.ProseMirror \.stillnote-image-gallery__toolbar \{([^}]+)\}/)?.[1];
    expect(toolbar).toContain("position: absolute;");
    expect(toolbar).toContain("bottom: 100%;");
    expect(toolbar).toContain("flex-wrap: wrap;");
    expect(toolbar).toContain("max-width: 100%;");
    expect(toolbar).toContain("margin-bottom: 0.5rem;");
    expect(toolbar).toContain("visibility: hidden;");
    expect(toolbar).toContain("pointer-events: none;");
    expect(toolbar).not.toContain("opacity: 0");
    expect(globals).toMatch(
      /\.ProseMirror \.stillnote-image-gallery:hover > \.stillnote-image-gallery__toolbar,\s*\.ProseMirror \.stillnote-image-gallery:focus-within > \.stillnote-image-gallery__toolbar \{\s*visibility: visible;\s*pointer-events: auto;/,
    );
  });

  test("fills React image node grid cells without exposing a persistent background", () => {
    expect(globals).toContain(
      ".stillnote-image-gallery__content > div > div > .stillnote-image-node {",
    );
    expect(globals).toMatch(
      /\.stillnote-image-gallery__content > div > div > \.stillnote-image-node \{[\s\S]*?width: 100% !important;[\s\S]*?min-width: 0;[\s\S]*?background: transparent;/,
    );
    expect(globals).toMatch(
      /\.stillnote-image-gallery__content > div > div > \.stillnote-image-node > img \{[\s\S]*?width: 100% !important;[\s\S]*?object-fit: cover;/,
    );
  });
});
