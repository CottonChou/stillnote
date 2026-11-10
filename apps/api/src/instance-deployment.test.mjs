import { expect, test } from "bun:test";
import { resolveDeploymentVersionCreatedAt, resolveImageBuildMetadata, resolveInstanceDeploymentMetadata } from "./instance-deployment";

test("normalizes a runtime-supplied deployment version timestamp and rejects missing or invalid values", () => {
  expect(resolveDeploymentVersionCreatedAt({ deploymentVersionCreatedAt: "2026-10-02T08:00:00+08:00" }))
    .toBe("2026-10-02T00:00:00.000Z");
  expect(resolveDeploymentVersionCreatedAt({})).toBeNull();
  expect(resolveDeploymentVersionCreatedAt({ deploymentVersionCreatedAt: "unknown" })).toBeNull();
});

test("reports image build metadata only from valid build arguments", () => {
  expect(resolveImageBuildMetadata({
    STILLNOTE_BUILD_CREATED_AT: " 2026-01-02T03:04:05Z ",
    STILLNOTE_BUILD_TRIGGER: "github_release",
    STILLNOTE_BUILD_METHOD: "github_actions",
  })).toEqual({
    buildCreatedAt: "2026-01-02T03:04:05.000Z",
    buildProvenance: { trigger: "github_release", method: "github_actions" },
  });
  // A default self-build passes empty build arguments.
  expect(resolveImageBuildMetadata({ STILLNOTE_BUILD_CREATED_AT: "", STILLNOTE_BUILD_TRIGGER: "", STILLNOTE_BUILD_METHOD: "" })).toEqual({
    buildCreatedAt: null,
    buildProvenance: { trigger: "unknown", method: "unknown" },
  });
  expect(resolveImageBuildMetadata({ STILLNOTE_BUILD_CREATED_AT: "yesterday", STILLNOTE_BUILD_TRIGGER: "nightly", STILLNOTE_BUILD_METHOD: "kubernetes" })).toEqual({
    buildCreatedAt: null,
    buildProvenance: { trigger: "unknown", method: "unknown" },
  });
});

test("accepts docker as an explicit deployment method without inferring it", () => {
  expect(resolveInstanceDeploymentMetadata({ STILLNOTE_DEPLOYMENT_TRIGGER: "manual", STILLNOTE_DEPLOYMENT_METHOD: "docker" }))
    .toEqual({ trigger: "manual", method: "docker" });
  expect(resolveInstanceDeploymentMetadata({})).toEqual({ trigger: "unknown", method: "unknown" });
});
