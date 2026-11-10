import { describe, expect, test } from "bun:test";
import { isAllowedPrintPreviewUrl, isResourceDownloadUrl } from "./window-open-policy.mjs";

test("resource downloads require a safe resource ID and explicit download filename", () => {
  for (const url of ["stillnote-resource://resource/note?download=note.html", "stillnote-staged://pending?download=note.txt"]) {
    expect(isResourceDownloadUrl(url)).toBe(true);
  }
  for (const url of ["stillnote-resource://resource/note", "stillnote-staged://pending", "https://example.org/note?download=note.html", "stillnote-resource://user@resource/note?download=note.html", "stillnote-resource://resource/%2e%2e?download=note.html", "stillnote-staged://pending?download=%00"]) {
    expect(isResourceDownloadUrl(url)).toBe(false);
  }
});

describe("desktop window open policy", () => {
  test("allows only the packaged print preview beside the app entry", () => {
    const appUrl = "file:///Applications/StillNote.app/Contents/Resources/web/index.html";

    expect(isAllowedPrintPreviewUrl(
      "file:///Applications/StillNote.app/Contents/Resources/web/note-print.html?token=abc",
      appUrl,
    )).toBe(true);
    expect(isAllowedPrintPreviewUrl("file:///note-print.html?token=abc", appUrl)).toBe(false);
    expect(isAllowedPrintPreviewUrl(
      "file:///Applications/StillNote.app/Contents/Resources/web/mobile-edit.html",
      appUrl,
    )).toBe(false);
  });

  test("allows the same-origin print preview in desktop development", () => {
    const appUrl = "http://127.0.0.1:5173/";

    expect(isAllowedPrintPreviewUrl("http://127.0.0.1:5173/note-print.html?token=abc", appUrl)).toBe(true);
    expect(isAllowedPrintPreviewUrl("https://example.com/note-print.html", appUrl)).toBe(false);
    expect(isAllowedPrintPreviewUrl("http://127.0.0.1:5173/settings", appUrl)).toBe(false);
  });

  test("allows only the print preview on the private desktop origin", () => {
    const appUrl = "stillnote-app://app/index.html";

    expect(isAllowedPrintPreviewUrl("stillnote-app://app/note-print.html?token=abc", appUrl)).toBe(true);
    expect(isAllowedPrintPreviewUrl("stillnote-app://other/note-print.html", appUrl)).toBe(false);
    expect(isAllowedPrintPreviewUrl("stillnote-app://app/mobile-edit.html", appUrl)).toBe(false);
  });
});
