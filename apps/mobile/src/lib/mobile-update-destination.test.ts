import { expect, test } from "bun:test";
import { ANDROID_INSTALL_UPDATE_SOURCES, GITHUB_LATEST_RELEASE_URL } from "./mobile-release";
import { openMobileInstallUpdateSource } from "./mobile-update-destination";

const github = ANDROID_INSTALL_UPDATE_SOURCES.find((source) => source.id === "github");

if (!github) {
  throw new Error("Android update sources are incomplete");
}

test("opens GitHub fork release URL through the regular URL handler", async () => {
  const openedUrls: string[] = [];
  const linking = {
    async openURL(url: string) {
      expect(this).toBe(linking);
      openedUrls.push(url);
    },
  };

  const result = await openMobileInstallUpdateSource(github, {
    linking,
  });

  expect(result).toEqual({ status: "opened" });
  expect(openedUrls).toEqual([GITHUB_LATEST_RELEASE_URL]);
});
