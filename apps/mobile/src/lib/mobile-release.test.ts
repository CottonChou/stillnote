import { expect, test } from "bun:test";
import {
  ANDROID_INSTALL_UPDATE_SOURCES,
  findNewerMobileRelease,
  GITHUB_LATEST_RELEASE_URL,
} from "./mobile-release";

const responseWithTag = (
  tagName: string,
  androidVersion = tagName.replace(/^v/, "").replace(/-.*$/, ""),
  fileName = `StillNote-${androidVersion}-android-signed.apk`,
) => new Response(JSON.stringify({
  assets: [{
    browser_download_url: `https://github.com/CottonChou/stillnote/releases/download/${tagName}/${fileName}`,
    digest: `sha256:${"a".repeat(64)}`,
    name: fileName,
    size: 48_000_000,
  }],
  html_url: `https://github.com/CottonChou/stillnote/releases/tag/${tagName}`,
  tag_name: tagName,
}), {
  headers: { "Content-Type": "application/json" },
  status: 200,
});

test("finds a newer formal GitHub release with signed fork APK", async () => {
  const release = await findNewerMobileRelease("2.16.1", async () => responseWithTag("v2.16.2"));

  expect(release).toEqual({
    digest: `sha256:${"a".repeat(64)}`,
    downloadUrl: "https://github.com/CottonChou/stillnote/releases/download/v2.16.2/StillNote-2.16.2-android-signed.apk",
    fileName: "StillNote-2.16.2-android-signed.apk",
    releaseUrl: "https://github.com/CottonChou/stillnote/releases/tag/v2.16.2",
    size: 48_000_000,
    version: "2.16.2",
  });
});

test("accepts upstream-named APK and custom tag suffix on the fork release", async () => {
  const release = await findNewerMobileRelease(
    "2.16.1",
    async () => responseWithTag("v2.16.2-custom", "2.16.2", "stillnote-android-v2.16.2-arm64-v8a.apk")
  );

  expect(release).toEqual({
    digest: `sha256:${"a".repeat(64)}`,
    downloadUrl: "https://github.com/CottonChou/stillnote/releases/download/v2.16.2-custom/stillnote-android-v2.16.2-arm64-v8a.apk",
    fileName: "stillnote-android-v2.16.2-arm64-v8a.apk",
    releaseUrl: "https://github.com/CottonChou/stillnote/releases/tag/v2.16.2-custom",
    size: 48_000_000,
    version: "2.16.2",
  });
});

test("does not treat the current or an older release as an update", async () => {
  expect(await findNewerMobileRelease("2.16.1", async () => responseWithTag("v2.16.1-custom", "2.16.1"))).toBeNull();
  expect(await findNewerMobileRelease("2.16.1", async () => responseWithTag("v2.16.0"))).toBeNull();
});

test("uses the actual APK asset version instead of the overall release tag", async () => {
  expect(await findNewerMobileRelease("1.6.50", async () => responseWithTag("v1.7.0", "1.6.50"))).toBeNull();
  expect(await findNewerMobileRelease("1.6.49", async () => responseWithTag("v1.7.0", "1.6.50"))).toEqual({
    digest: `sha256:${"a".repeat(64)}`,
    downloadUrl: "https://github.com/CottonChou/stillnote/releases/download/v1.7.0/StillNote-1.6.50-android-signed.apk",
    fileName: "StillNote-1.6.50-android-signed.apk",
    releaseUrl: "https://github.com/CottonChou/stillnote/releases/tag/v1.7.0",
    size: 48_000_000,
    version: "1.6.50",
  });
});

test("rejects upstream URLs and invalid release responses instead of claiming the app is current", async () => {
  await expect(findNewerMobileRelease("0.4.14", async () => responseWithTag("latest", "0.4.15"))).rejects.toThrow(
    "Invalid GitHub release version"
  );
  await expect(findNewerMobileRelease("0.4.14", async () => new Response(null, { status: 403 }))).rejects.toThrow(
    "status 403"
  );
  await expect(findNewerMobileRelease("0.4.14", async () => new Response(JSON.stringify({
    assets: [],
    tag_name: "v0.4.15",
  })))).rejects.toThrow("exactly one Android APK");
  await expect(findNewerMobileRelease("0.4.14", async () => new Response(JSON.stringify({
    assets: [{
      browser_download_url: "https://github.com/other-owner/other-repo/releases/download/v0.4.15/OtherApp-0.4.15-android-signed.apk",
      digest: `sha256:${"a".repeat(64)}`,
      name: "OtherApp-0.4.15-android-signed.apk",
      size: 48_000_000,
    }],
    tag_name: "v0.4.15",
  })))).rejects.toThrow("exactly one Android APK");
});

test("offers only the latest fork GitHub Release as manual update destination", () => {
  expect(ANDROID_INSTALL_UPDATE_SOURCES).toEqual([
    {
      id: "github",
      url: GITHUB_LATEST_RELEASE_URL,
    },
  ]);
});
