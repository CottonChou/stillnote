import { join, resolve } from "node:path";

const SUPPORTED_STORAGE_BACKENDS = new Set(["local", "s3"]);

const parseInteger = (value, fallback, name, minimum, maximum) => {
  const normalized = value?.trim();
  if (!normalized) return fallback;

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return parsed;
};

export const resolveSelfHostedConfig = (environment = process.env, projectRoot = process.cwd()) => {
  const dataDirectory = resolve(environment.STILLNOTE_DATA_DIR ?? join(projectRoot, ".stillnote-data"));
  const storageBackend = (environment.STILLNOTE_STORAGE_BACKEND ?? "local").trim().toLowerCase();

  if (!SUPPORTED_STORAGE_BACKENDS.has(storageBackend)) {
    throw new Error("STILLNOTE_STORAGE_BACKEND must be either local or s3");
  }
  if (storageBackend === "s3" && !environment.STILLNOTE_S3_BUCKET?.trim()) {
    throw new Error("STILLNOTE_S3_BUCKET is required when STILLNOTE_STORAGE_BACKEND=s3");
  }

  return {
    dataDirectory,
    databaseFile: resolve(environment.STILLNOTE_SQLITE_FILE ?? join(dataDirectory, "stillnote.sqlite")),
    resourcesDirectory: resolve(environment.STILLNOTE_RESOURCES_DIR ?? join(dataDirectory, "resources")),
    webDirectory: resolve(environment.STILLNOTE_WEB_DIR ?? join(projectRoot, "apps/web/dist")),
    hostname: environment.STILLNOTE_HOST?.trim() || "0.0.0.0",
    port: parseInteger(environment.PORT ?? environment.STILLNOTE_PORT, 8787, "STILLNOTE_PORT", 1, 65_535),
    idleTimeout: parseInteger(
      environment.STILLNOTE_IDLE_TIMEOUT_SECONDS,
      120,
      "STILLNOTE_IDLE_TIMEOUT_SECONDS",
      10,
      255,
    ),
    storageBackend,
  };
};
