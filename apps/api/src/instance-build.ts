declare const __STILLNOTE_INSTANCE_BUILD_ID__: string;

const bundledBuildId = typeof __STILLNOTE_INSTANCE_BUILD_ID__ !== "undefined"
  ? __STILLNOTE_INSTANCE_BUILD_ID__
  : "";
const runtimeBuildId = typeof process !== "undefined"
  ? process.env.STILLNOTE_BUILD_ID ?? process.env.GITHUB_SHA ?? ""
  : "";

export const INSTANCE_BUILD_ID = (bundledBuildId || runtimeBuildId).trim() || "unknown";
