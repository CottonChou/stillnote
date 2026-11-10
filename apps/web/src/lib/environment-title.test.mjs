import { describe, expect, test } from "bun:test";
import { withEnvironmentTitlePrefix } from "./environment-title.ts";

describe("environment tab title", () => {
  test("marks local development tabs as DEV", () => {
    expect(withEnvironmentTitlePrefix("StillNote", { development: true, profile: "local" }))
      .toBe("[DEV] StillNote");
    expect(withEnvironmentTitlePrefix("StillNote", { development: true, profile: "" }))
      .toBe("[DEV] StillNote");
  });

  test("marks the local demo profile as DEMO", () => {
    expect(withEnvironmentTitlePrefix("StillNote", { development: true, profile: "demo" }))
      .toBe("[DEMO] StillNote");
  });

  test("is idempotent during hot reloads and leaves production titles unchanged", () => {
    expect(withEnvironmentTitlePrefix("[LOCAL DEMO] StillNote", { development: true, profile: "demo" }))
      .toBe("[DEMO] StillNote");
    expect(withEnvironmentTitlePrefix("StillNote", { development: false, profile: "demo" }))
      .toBe("StillNote");
  });
});
