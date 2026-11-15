import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { isMountedInstallerPath } from "./installation-location.mjs";
import { macApplicationBundlePath } from "./local-data-reset.mjs";

export const MAC_UPDATE_SCRIPT = [
  'parent_pid="$1"',
  'staged_app="$2"',
  'target_app="$3"',
  'staging_dir="$4"',
  '',
  '# 1. Wait for parent StillNote process to exit (up to 300 seconds)',
  'attempt=0',
  'while /bin/kill -0 "$parent_pid" 2>/dev/null && [ "$attempt" -lt 3000 ]; do',
  '  /bin/sleep 0.1',
  '  attempt=$((attempt + 1))',
  'done',
  'if /bin/kill -0 "$parent_pid" 2>/dev/null; then',
  '  exit 1',
  'fi',
  '',
  '# 2. Verify that the staged application bundle exists',
  'if [ ! -d "$staged_app" ]; then',
  '  exit 1',
  'fi',
  '',
  '# 3. Atomically replace the installed application bundle',
  'backup_app="${target_app}.old.$$"',
  'if /bin/mv "$target_app" "$backup_app" 2>/dev/null; then',
  '  if /bin/cp -R "$staged_app" "$target_app"; then',
  '    /bin/rm -rf "$backup_app" 2>/dev/null || true',
  '  else',
  '    # Roll back to the original bundle if copying failed',
  '    /bin/rm -rf "$target_app" 2>/dev/null || true',
  '    /bin/mv "$backup_app" "$target_app" 2>/dev/null || true',
  '    exit 1',
  '  fi',
  'else',
  '  /bin/rm -rf "$target_app" 2>/dev/null || true',
  '  if ! /bin/cp -R "$staged_app" "$target_app"; then',
  '    exit 1',
  '  fi',
  'fi',
  '',
  '# 4. Remove quarantine attribute so macOS Gatekeeper allows launch',
  '/usr/bin/xattr -dr com.apple.quarantine "$target_app" 2>/dev/null || true',
  '',
  '# 5. Clean up the staging directory',
  '/bin/rm -rf "$staging_dir" 2>/dev/null || true',
  '',
  '# 6. Relaunch the newly updated StillNote application',
  '/usr/bin/open -n "$target_app"',
].join("\n");

export class MacAppUpdaterError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "MacAppUpdaterError";
    this.code = code;
  }
}

export const findDownloadedMacUpdateZip = ({ cacheDirectory, version }) => {
  const pendingDir = join(cacheDirectory, "@stillnotedesktop-updater", "pending");
  if (!existsSync(pendingDir)) return null;

  try {
    const entries = readdirSync(pendingDir);
    // Prefer exact version match if version is provided
    if (version) {
      const versionPattern = new RegExp(`^StillNote-${version.replace(/^v/, "")}-mac-.*\\.zip$`, "i");
      const matched = entries.find((name) => versionPattern.test(name));
      if (matched) return join(pendingDir, matched);
    }
    // Fall back to any StillNote-*-mac-*.zip file
    const genericMatched = entries.find((name) => /^StillNote-.*-mac-.*\.zip$/i.test(name));
    if (genericMatched) return join(pendingDir, genericMatched);
  } catch {
    return null;
  }
  return null;
};

export const extractMacAppFromZip = ({
  zipPath,
  destinationDirectory,
  dittoRunner = spawnSync,
}) => {
  if (!zipPath || !existsSync(zipPath)) {
    throw new MacAppUpdaterError("zip-not-found", `Downloaded macOS update zip does not exist: ${zipPath}`);
  }
  const result = dittoRunner("/usr/bin/ditto", ["-xk", zipPath, destinationDirectory], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new MacAppUpdaterError("ditto-extraction-failed", `Failed to extract update zip with ditto: ${detail}`);
  }

  const entries = readdirSync(destinationDirectory);
  const appName = entries.find((name) => name.toLowerCase().endsWith(".app"));
  if (!appName) {
    throw new MacAppUpdaterError("app-bundle-not-found", "No .app bundle was found in the extracted update archive");
  }
  return join(destinationDirectory, appName);
};

export const applyMacInPlaceUpdate = async ({
  zipPath,
  executablePath,
  parentPid,
  stagingDirectory,
  spawnProcess = spawn,
  dittoRunner = spawnSync,
}) => {
  const targetAppPath = macApplicationBundlePath(executablePath);

  if (isMountedInstallerPath(targetAppPath)) {
    throw new MacAppUpdaterError(
      "read-only-installer-volume",
      "StillNote cannot be updated in-place while running from a mounted installer volume",
    );
  }

  const stageDir = stagingDirectory || join(dirname(targetAppPath), `.stillnote-update-stage-${Date.now()}`);
  await mkdir(stageDir, { recursive: true });

  let stagedAppPath;
  try {
    stagedAppPath = extractMacAppFromZip({
      zipPath,
      destinationDirectory: stageDir,
      dittoRunner,
    });
  } catch (error) {
    await rm(stageDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }

  const helper = spawnProcess(
    "/bin/sh",
    [
      "-c",
      MAC_UPDATE_SCRIPT,
      "stillnote-mac-update",
      String(parentPid),
      stagedAppPath,
      targetAppPath,
      stageDir,
    ],
    {
      detached: true,
      stdio: "ignore",
    },
  );

  try {
    await new Promise((resolveSpawn, rejectSpawn) => {
      helper.once("spawn", resolveSpawn);
      helper.once("error", rejectSpawn);
    });
  } catch (error) {
    await rm(stageDir, { recursive: true, force: true }).catch(() => {});
    throw new MacAppUpdaterError(
      "helper-spawn-failed",
      "Failed to launch background update installation helper",
      { cause: error },
    );
  }

  helper.unref();
  return { scheduled: true, stagedAppPath, targetAppPath };
};
