import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyMacInPlaceUpdate,
  extractMacAppFromZip,
  findDownloadedMacUpdateZip,
  MAC_UPDATE_SCRIPT,
  MacAppUpdaterError,
} from "./mac-app-updater.mjs";

describe("macOS in-place app updater", () => {
  test("finds the downloaded macOS update zip from the cache directory", () => {
    const tempCache = join(tmpdir(), `stillnote-cache-test-${Date.now()}`);
    const pendingDir = join(tempCache, "@stillnotedesktop-updater", "pending");
    mkdirSync(pendingDir, { recursive: true });

    try {
      const zipPath = join(pendingDir, "StillNote-2.18.2-mac-arm64.zip");
      writeFileSync(zipPath, "dummy-zip-content");

      expect(findDownloadedMacUpdateZip({ cacheDirectory: tempCache, version: "2.18.2" }))
        .toBe(zipPath);
      expect(findDownloadedMacUpdateZip({ cacheDirectory: tempCache, version: "v2.18.2" }))
        .toBe(zipPath);
      expect(findDownloadedMacUpdateZip({ cacheDirectory: tempCache, version: "2.18.3" }))
        .toBe(zipPath); // falls back to generic match

      expect(findDownloadedMacUpdateZip({ cacheDirectory: "/nonexistent-dir", version: "2.18.2" }))
        .toBeNull();
    } finally {
      rmSync(tempCache, { recursive: true, force: true });
    }
  });

  test("rejects in-place updates when running from a mounted installer volume", async () => {
    try {
      await applyMacInPlaceUpdate({
        zipPath: "/tmp/dummy.zip",
        executablePath: "/Volumes/StillNote/StillNote.app/Contents/MacOS/StillNote",
        parentPid: 12345,
      });
      throw new Error("expected mounted volume check to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(MacAppUpdaterError);
      expect(error.code).toBe("read-only-installer-volume");
    }
  });

  test("extracts the app bundle from the update zip using ditto runner", () => {
    const tempDir = join(tmpdir(), `stillnote-extract-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    const dummyZip = join(tempDir, "update.zip");
    writeFileSync(dummyZip, "dummy");

    let dittoCommand;
    let dittoArgs;

    const mockDittoRunner = (cmd, args) => {
      dittoCommand = cmd;
      dittoArgs = args;
      // Simulate extraction creating StillNote.app
      mkdirSync(join(args[2], "StillNote.app"), { recursive: true });
      return { status: 0, stdout: "", stderr: "" };
    };

    try {
      const appPath = extractMacAppFromZip({
        zipPath: dummyZip,
        destinationDirectory: tempDir,
        dittoRunner: mockDittoRunner,
      });

      expect(dittoCommand).toBe("/usr/bin/ditto");
      expect(dittoArgs).toEqual(["-xk", dummyZip, tempDir]);
      expect(appPath).toBe(join(tempDir, "StillNote.app"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("schedules macOS in-place update by launching detached shell helper", async () => {
    const tempDir = join(tmpdir(), `stillnote-schedule-test-${Date.now()}`);
    const stageDir = join(tempDir, "stage");
    const dummyZip = join(tempDir, "update.zip");
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(dummyZip, "dummy");

    let spawnArgs;
    let unrefCalled = false;

    const mockSpawn = (...args) => {
      spawnArgs = args;
      const helper = new EventEmitter();
      helper.unref = () => { unrefCalled = true; };
      queueMicrotask(() => helper.emit("spawn"));
      return helper;
    };

    const mockDitto = (_cmd, args) => {
      mkdirSync(join(args[2], "StillNote.app"), { recursive: true });
      return { status: 0, stdout: "", stderr: "" };
    };

    try {
      const result = await applyMacInPlaceUpdate({
        zipPath: dummyZip,
        executablePath: "/Applications/StillNote.app/Contents/MacOS/StillNote",
        parentPid: 9999,
        stagingDirectory: stageDir,
        spawnProcess: mockSpawn,
        dittoRunner: mockDitto,
      });

      expect(result.scheduled).toBe(true);
      expect(result.targetAppPath).toBe("/Applications/StillNote.app");
      expect(unrefCalled).toBe(true);

      expect(spawnArgs[0]).toBe("/bin/sh");
      expect(spawnArgs[1][0]).toBe("-c");
      expect(spawnArgs[1][1]).toBe(MAC_UPDATE_SCRIPT);
      expect(spawnArgs[1].slice(-4)).toEqual([
        "9999",
        join(stageDir, "StillNote.app"),
        "/Applications/StillNote.app",
        stageDir,
      ]);
      expect(spawnArgs[2]).toEqual({ detached: true, stdio: "ignore" });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
