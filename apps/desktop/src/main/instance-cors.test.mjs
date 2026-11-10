import { describe, expect, test } from "bun:test";
import { DESKTOP_APP_ORIGIN } from "./app-protocol.mjs";
import { createInstanceCorsBridge } from "./instance-cors.mjs";

const CONFIGURED_INSTANCE = "https://legacy-instance.example";

function createBridge(baseUrl = CONFIGURED_INSTANCE, maxTrackedRequests = 512) {
  let configuredApiBaseUrl = baseUrl;
  const bridge = createInstanceCorsBridge({
    getConfiguredApiBaseUrl: () => configuredApiBaseUrl,
    maxTrackedRequests,
  });
  return {
    bridge,
    setBaseUrl(next) {
      configuredApiBaseUrl = next;
    },
  };
}

describe("desktop instance CORS bridge", () => {
  test("rewrites lowercase HTTP/2 CORS headers from legacy edgeever-app://app backends", () => {
    const { bridge } = createBridge();

    const tracked = bridge.trackRequestOrigin({
      id: 101,
      url: `${CONFIGURED_INSTANCE}/api/v1/memos?limit=50`,
      requestHeaders: { origin: DESKTOP_APP_ORIGIN },
    });
    expect(tracked).toBe(true);

    const rewritten = bridge.rewriteResponseHeaders({
      id: 101,
      method: "GET",
      url: `${CONFIGURED_INSTANCE}/api/v1/memos?limit=50`,
      responseHeaders: {
        "access-control-allow-origin": ["edgeever-app://app"],
        "access-control-allow-credentials": ["false"],
        "content-type": ["application/json"],
      },
    });

    expect(rewritten).toEqual({
      "Access-Control-Allow-Origin": [DESKTOP_APP_ORIGIN],
      "Access-Control-Allow-Credentials": ["true"],
      "content-type": ["application/json"],
    });
    expect("access-control-allow-origin" in rewritten).toBe(false);
    expect("access-control-allow-credentials" in rewritten).toBe(false);
  });

  test("adds missing ACAO and merges x-stillnote-import-context on 204 OPTIONS preflight", () => {
    const { bridge } = createBridge();

    bridge.trackRequestOrigin({
      id: 102,
      url: `${CONFIGURED_INSTANCE}/api/v1/auth/login`,
      initiator: DESKTOP_APP_ORIGIN,
      requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
    });

    const rewritten = bridge.rewriteResponseHeaders({
      id: 102,
      method: "OPTIONS",
      url: `${CONFIGURED_INSTANCE}/api/v1/auth/login`,
      initiator: DESKTOP_APP_ORIGIN,
      responseHeaders: {
        vary: ["Origin, Access-Control-Request-Headers"],
        "access-control-allow-credentials": ["true"],
        "access-control-allow-headers": ["Content-Type,Authorization"],
      },
    });

    expect(rewritten).toEqual({
      vary: ["Origin, Access-Control-Request-Headers"],
      "Access-Control-Allow-Origin": [DESKTOP_APP_ORIGIN],
      "Access-Control-Allow-Credentials": ["true"],
      "Access-Control-Allow-Headers": ["Content-Type, Authorization, x-stillnote-import-context"],
      "Access-Control-Allow-Methods": ["GET, POST, PUT, PATCH, DELETE, OPTIONS"],
    });
  });

  test("bridges POST login and 403 Cloudflare challenge responses for configured instance", () => {
    const { bridge } = createBridge();

    bridge.trackRequestOrigin({
      id: 103,
      url: `${CONFIGURED_INSTANCE}/api/v1/auth/login`,
      requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
    });
    const loginHeaders = bridge.rewriteResponseHeaders({
      id: 103,
      method: "POST",
      url: `${CONFIGURED_INSTANCE}/api/v1/auth/login`,
      responseHeaders: {
        "content-type": ["application/json"],
        "set-cookie": ["stillnote_session=abc; HttpOnly; Secure; SameSite=None"],
      },
    });
    expect(loginHeaders["Access-Control-Allow-Origin"]).toEqual([DESKTOP_APP_ORIGIN]);
    expect(loginHeaders["Access-Control-Allow-Credentials"]).toEqual(["true"]);
    expect(loginHeaders["set-cookie"]).toEqual([
      "stillnote_session=abc; HttpOnly; Secure; SameSite=None",
    ]);

    bridge.trackRequestOrigin({
      id: 104,
      url: `${CONFIGURED_INSTANCE}/api/v1/auth/login`,
      requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
    });
    const challengeHeaders = bridge.rewriteResponseHeaders({
      id: 104,
      method: "POST",
      url: `${CONFIGURED_INSTANCE}/api/v1/auth/login`,
      responseHeaders: {
        "cf-mitigated": ["challenge"],
        "content-type": ["text/html; charset=UTF-8"],
      },
    });
    expect(challengeHeaders["cf-mitigated"]).toEqual(["challenge"]);
    expect(challengeHeaders["Access-Control-Allow-Origin"]).toEqual([DESKTOP_APP_ORIGIN]);
  });

  test("leaves third-party and AI provider origins untouched", () => {
    const { bridge, setBaseUrl } = createBridge();

    const thirdPartyTracked = bridge.trackRequestOrigin({
      id: 201,
      url: "https://api.openai.com/v1/chat/completions",
      initiator: DESKTOP_APP_ORIGIN,
      requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
    });
    expect(thirdPartyTracked).toBe(false);

    const thirdPartyHeaders = bridge.rewriteResponseHeaders({
      id: 201,
      method: "POST",
      url: "https://api.openai.com/v1/chat/completions",
      initiator: DESKTOP_APP_ORIGIN,
      responseHeaders: { "content-type": ["application/json"] },
    });
    expect(thirdPartyHeaders).toBeNull();

    setBaseUrl("");
    expect(
      bridge.trackRequestOrigin({
        id: 202,
        url: `${CONFIGURED_INSTANCE}/api/health`,
        requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
      })
    ).toBe(false);
    expect(
      bridge.rewriteResponseHeaders({
        id: 202,
        method: "GET",
        url: `${CONFIGURED_INSTANCE}/api/health`,
        initiator: DESKTOP_APP_ORIGIN,
        responseHeaders: {},
      })
    ).toBeNull();
  });

  test("rejects non-desktop initiators and spoofed Origin headers", () => {
    const { bridge } = createBridge();

    expect(
      bridge.trackRequestOrigin({
        id: 301,
        url: `${CONFIGURED_INSTANCE}/api/v1/memos`,
        initiator: "https://evil.example",
        requestHeaders: { Origin: "https://evil.example" },
      })
    ).toBe(false);

    expect(
      bridge.rewriteResponseHeaders({
        id: 301,
        method: "GET",
        url: `${CONFIGURED_INSTANCE}/api/v1/memos`,
        initiator: "https://evil.example",
        responseHeaders: {},
      })
    ).toBeNull();

    expect(
      bridge.trackRequestOrigin({
        id: 302,
        url: `${CONFIGURED_INSTANCE}/api/v1/memos`,
        initiator: DESKTOP_APP_ORIGIN,
        requestHeaders: { Origin: "https://evil.example" },
      })
    ).toBe(false);
  });

  test("bounds tracked request IDs without retaining completed requests", () => {
    const { bridge } = createBridge(CONFIGURED_INSTANCE, 2);

    bridge.trackRequestOrigin({
      id: 1,
      url: `${CONFIGURED_INSTANCE}/api/1`,
      requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
    });
    bridge.trackRequestOrigin({
      id: 2,
      url: `${CONFIGURED_INSTANCE}/api/2`,
      requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
    });
    bridge.trackRequestOrigin({
      id: 3,
      url: `${CONFIGURED_INSTANCE}/api/3`,
      requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
    });

    // Request 1 was evicted without fallback initiator; requests 2 and 3 remain tracked.
    expect(
      bridge.rewriteResponseHeaders({
        id: 1,
        method: "GET",
        url: `${CONFIGURED_INSTANCE}/api/1`,
        responseHeaders: {},
      })
    ).toBeNull();
    expect(
      bridge.rewriteResponseHeaders({
        id: 2,
        method: "GET",
        url: `${CONFIGURED_INSTANCE}/api/2`,
        responseHeaders: {},
      })?.["Access-Control-Allow-Origin"]
    ).toEqual([DESKTOP_APP_ORIGIN]);
    expect(
      bridge.rewriteResponseHeaders({
        id: 3,
        method: "GET",
        url: `${CONFIGURED_INSTANCE}/api/3`,
        responseHeaders: {},
      })?.["Access-Control-Allow-Origin"]
    ).toEqual([DESKTOP_APP_ORIGIN]);
  });

  test("attachToSession registers only onBeforeSendHeaders and onHeadersReceived", () => {
    const { bridge } = createBridge();
    const handlers = {};
    const untouchedHooks = [];

    const mockSession = {
      webRequest: {
        onBeforeSendHeaders(fn) {
          handlers.onBeforeSendHeaders = fn;
        },
        onHeadersReceived(fn) {
          handlers.onHeadersReceived = fn;
        },
        onBeforeRequest() {
          untouchedHooks.push("onBeforeRequest");
        },
        onCompleted() {
          untouchedHooks.push("onCompleted");
        },
        onErrorOccurred() {
          untouchedHooks.push("onErrorOccurred");
        },
        onBeforeRedirect() {
          untouchedHooks.push("onBeforeRedirect");
        },
      },
    };

    bridge.attachToSession(mockSession);

    expect(Object.keys(handlers).sort()).toEqual(["onBeforeSendHeaders", "onHeadersReceived"]);
    expect(untouchedHooks).toEqual([]);

    let beforeSendResult = null;
    handlers.onBeforeSendHeaders(
      {
        id: 500,
        url: `${CONFIGURED_INSTANCE}/api/v1/auth/me`,
        requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
      },
      (res) => {
        beforeSendResult = res;
      }
    );
    expect(beforeSendResult).toEqual({
      requestHeaders: { Origin: DESKTOP_APP_ORIGIN },
    });

    let headersResult = null;
    handlers.onHeadersReceived(
      {
        id: 500,
        method: "GET",
        url: `${CONFIGURED_INSTANCE}/api/v1/auth/me`,
        responseHeaders: { "content-type": ["application/json"] },
      },
      (res) => {
        headersResult = res;
      }
    );
    expect(headersResult).toEqual({
      responseHeaders: {
        "content-type": ["application/json"],
        "Access-Control-Allow-Origin": [DESKTOP_APP_ORIGIN],
        "Access-Control-Allow-Credentials": ["true"],
      },
    });
  });
});
