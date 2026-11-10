import { describe, expect, test } from "bun:test";
import { userDataDirectoryFromArguments } from "./user-data-directory.mjs";

describe("desktop user data directory", () => {
  test("reads the equals form", () => {
    expect(userDataDirectoryFromArguments(["StillNote", "--user-data-dir=/tmp/stillnote-profile"]))
      .toBe("/tmp/stillnote-profile");
  });

  test("reads the separate value form", () => {
    expect(userDataDirectoryFromArguments(["StillNote", "--user-data-dir", "/tmp/stillnote-profile"]))
      .toBe("/tmp/stillnote-profile");
  });

  test("ignores missing and empty values", () => {
    expect(userDataDirectoryFromArguments(["StillNote"])).toBe("");
    expect(userDataDirectoryFromArguments(["StillNote", "--user-data-dir="])).toBe("");
  });
});
