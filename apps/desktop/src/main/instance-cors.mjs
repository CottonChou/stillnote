import { DESKTOP_APP_ORIGIN } from "./app-protocol.mjs";
import { instanceOrigin } from "./session-credential.mjs";

const REQUIRED_PREFLIGHT_ALLOW_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-stillnote-import-context",
];
const DEFAULT_PREFLIGHT_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

function findHeaderValues(headers, targetName) {
  if (!headers || typeof headers !== "object") {
    return null;
  }
  const normalizedTarget = targetName.toLowerCase();
  const collected = [];
  let found = false;
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== normalizedTarget) {
      continue;
    }
    found = true;
    if (Array.isArray(value)) {
      collected.push(...value.map(String));
    } else if (typeof value === "string") {
      collected.push(value);
    }
  }
  return found ? collected : null;
}

function deleteHeadersCaseInsensitive(headers, targetName) {
  const normalizedTarget = targetName.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === normalizedTarget) {
      delete headers[key];
    }
  }
}

function mergeCommaSeparatedHeader(existingValues, requiredValues) {
  const seen = new Set();
  const merged = [];
  for (const rawValue of existingValues ?? []) {
    for (const part of String(rawValue).split(",")) {
      const trimmed = part.trim();
      if (!trimmed) {
        continue;
      }
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) {
        continue;
      }
      seen.add(lower);
      merged.push(trimmed);
    }
  }
  for (const required of requiredValues) {
    const lower = required.toLowerCase();
    if (seen.has(lower)) {
      continue;
    }
    seen.add(lower);
    merged.push(required);
  }
  return merged.join(", ");
}

/**
 * Bridges CORS responses strictly for the user-configured StillNote instance origin
 * when the packaged desktop renderer runs under `stillnote-app://app` against older
 * servers that only allow `edgeever-app://app` (or gateways stripping CORS headers).
 */
export function createInstanceCorsBridge({
  getConfiguredApiBaseUrl,
  allowedRendererOrigin = DESKTOP_APP_ORIGIN,
  maxTrackedRequests = 512,
}) {
  const trackedOrigins = new Map();

  function configuredInstanceOrigin() {
    const baseUrl = typeof getConfiguredApiBaseUrl === "function" ? getConfiguredApiBaseUrl() : "";
    return instanceOrigin(baseUrl);
  }

  function rememberTrackedOrigin(requestId, targetOrigin) {
    if (requestId == null) {
      return;
    }
    if (trackedOrigins.has(requestId)) {
      trackedOrigins.delete(requestId);
    } else if (trackedOrigins.size >= maxTrackedRequests) {
      const oldestKey = trackedOrigins.keys().next().value;
      if (oldestKey !== undefined) {
        trackedOrigins.delete(oldestKey);
      }
    }
    trackedOrigins.set(requestId, targetOrigin);
  }

  function trackRequestOrigin(details) {
    const targetOrigin = instanceOrigin(details?.url);
    const configuredOrigin = configuredInstanceOrigin();
    if (!targetOrigin || !configuredOrigin || targetOrigin !== configuredOrigin) {
      return false;
    }

    const headerOrigins = findHeaderValues(details?.requestHeaders, "origin");
    const requestOrigin = headerOrigins?.find((value) => value.trim())?.trim() ?? null;
    if (requestOrigin) {
      if (requestOrigin !== allowedRendererOrigin) {
        return false;
      }
      rememberTrackedOrigin(details?.id, configuredOrigin);
      return true;
    }

    if (details?.initiator === allowedRendererOrigin) {
      rememberTrackedOrigin(details?.id, configuredOrigin);
      return true;
    }

    return false;
  }

  function rewriteResponseHeaders(details) {
    const trackedOrigin =
      details?.id != null && trackedOrigins.has(details.id)
        ? trackedOrigins.get(details.id)
        : null;
    if (details?.id != null) {
      trackedOrigins.delete(details.id);
    }

    const configuredOrigin = configuredInstanceOrigin();
    const targetOrigin = instanceOrigin(details?.url);
    if (!configuredOrigin || !targetOrigin || targetOrigin !== configuredOrigin) {
      return null;
    }

    const initiatedByRenderer =
      trackedOrigin === configuredOrigin || details?.initiator === allowedRendererOrigin;
    if (!initiatedByRenderer) {
      return null;
    }

    const responseHeaders = { ...details?.responseHeaders };
    deleteHeadersCaseInsensitive(responseHeaders, "access-control-allow-origin");
    deleteHeadersCaseInsensitive(responseHeaders, "access-control-allow-credentials");
    responseHeaders["Access-Control-Allow-Origin"] = [allowedRendererOrigin];
    responseHeaders["Access-Control-Allow-Credentials"] = ["true"];

    if (String(details?.method ?? "").toUpperCase() === "OPTIONS") {
      const existingAllowHeaders = findHeaderValues(responseHeaders, "access-control-allow-headers");
      deleteHeadersCaseInsensitive(responseHeaders, "access-control-allow-headers");
      responseHeaders["Access-Control-Allow-Headers"] = [
        mergeCommaSeparatedHeader(existingAllowHeaders, REQUIRED_PREFLIGHT_ALLOW_HEADERS),
      ];

      const existingAllowMethods = findHeaderValues(responseHeaders, "access-control-allow-methods");
      if (!existingAllowMethods || existingAllowMethods.every((value) => !value.trim())) {
        deleteHeadersCaseInsensitive(responseHeaders, "access-control-allow-methods");
        responseHeaders["Access-Control-Allow-Methods"] = [DEFAULT_PREFLIGHT_ALLOW_METHODS];
      }
    }

    return responseHeaders;
  }

  /**
   * Hooks only `onBeforeSendHeaders` and `onHeadersReceived` so we never overwrite
   * updater network diagnostics listeners (`onBeforeRequest`, `onCompleted`, etc.).
   */
  function attachToSession(ses) {
    if (!ses?.webRequest) {
      return;
    }
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      trackRequestOrigin(details);
      callback({ requestHeaders: details.requestHeaders });
    });
    ses.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = rewriteResponseHeaders(details);
      if (responseHeaders) {
        callback({ responseHeaders });
        return;
      }
      callback({ responseHeaders: details.responseHeaders });
    });
  }

  return {
    trackRequestOrigin,
    rewriteResponseHeaders,
    attachToSession,
  };
}
