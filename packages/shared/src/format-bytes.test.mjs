import { describe, expect, test } from "bun:test";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  test("formats byte boundaries and zero correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-100)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(1536)).toBe("1.50 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
    expect(formatBytes(12.5 * 1024 * 1024)).toBe("12.5 MB");
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.00 GB");
  });
});
