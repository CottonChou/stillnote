import { describe, expect, test } from "bun:test";
import { resolveContainerImageSource } from "./container-image-source";

describe("container image source diagnostics", () => {
  test("recognizes official image repositories with tags or digests", () => {
    expect(resolveContainerImageSource("ghcr.io/cottonchou/stillnote")).toBe("official-ghcr");
    expect(resolveContainerImageSource("ghcr.io/cottonchou/stillnote:v1.2.3")).toBe("official-ghcr");
    expect(resolveContainerImageSource("GHCR.IO/COTTONCHOU/STILLNOTE@sha256:abc")).toBe("official-ghcr");
    expect(resolveContainerImageSource("ccr.ccs.tencentyun.com/stillnote/stillnote:latest")).toBe("official-cn-mirror");
  });

  test("does not expose custom image references through the classification", () => {
    expect(resolveContainerImageSource("registry.internal.example/team/stillnote:latest")).toBe("custom");
    expect(resolveContainerImageSource("ghcr.io/cottonchou/stillnote-fork")).toBe("custom");
    expect(resolveContainerImageSource("  ")).toBe("unknown");
    expect(resolveContainerImageSource(undefined)).toBe("unknown");
  });
});
