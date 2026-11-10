import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DESKTOP_APP_ENTRY_URL,
  createDesktopAppProtocolHandler,
  resolveDesktopAppRequestPath,
} from "./app-protocol.mjs";

describe("desktop app protocol", () => {
  test("maps only the private app origin into the bundled web root", () => {
    expect(DESKTOP_APP_ENTRY_URL).toBe("stillnote-app://app/index.html");
    expect(resolveDesktopAppRequestPath("stillnote-app://app/assets/main.js", "/bundle/web"))
      .toBe("/bundle/web/assets/main.js");
    expect(resolveDesktopAppRequestPath("stillnote-app://other/assets/main.js", "/bundle/web")).toBeNull();
    expect(resolveDesktopAppRequestPath("https://app/assets/main.js", "/bundle/web")).toBeNull();
    expect(resolveDesktopAppRequestPath("stillnote-app://app/%E0%A4%A", "/bundle/web")).toBeNull();
  });

  test("serves files with explicit content types and rejects escapes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "stillnote-app-protocol-"));
    const webRoot = join(directory, "web");
    const outside = join(directory, "outside.txt");
    try {
      await mkdir(join(webRoot, "assets"), { recursive: true });
      await writeFile(join(webRoot, "index.html"), "<!doctype html><title>StillNote</title>");
      await writeFile(join(webRoot, "assets/main.js"), "globalThis.ready = true;");
      await writeFile(outside, "private");
      await symlink(outside, join(webRoot, "escape.txt"));
      const handle = createDesktopAppProtocolHandler({ webRoot });

      const response = await handle(new Request(DESKTOP_APP_ENTRY_URL));
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
      expect(await response.text()).toContain("StillNote");

      expect((await handle(new Request("stillnote-app://app/../outside.txt"))).status).toBe(404);
      expect((await handle(new Request("stillnote-app://app/escape.txt"))).status).toBe(404);
      expect((await handle(new Request(DESKTOP_APP_ENTRY_URL, { method: "POST" }))).status).toBe(405);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
