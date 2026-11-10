import { expect, test } from "bun:test";
import {
  hasSyncCursorRewound,
  hasSyncIdentityChanged,
  isSyncMetadataInitialized,
  splitSyncBootstrapWriteBatches,
} from "@stillnote/shared";
import {
  chunkValues,
  computeStaleRemoteMemoIds,
  parseStoredMemoSummary,
  shouldReuseCachedMemoDetail,
  toMemoSummary,
} from "./local-mirror-helpers";

test("rebuilds the mobile mirror when the server change cursor rewinds", () => {
  expect(hasSyncCursorRewound(42, 7)).toBe(true);
  expect(hasSyncCursorRewound(42, 42)).toBe(false);
  expect(hasSyncCursorRewound(42, 64)).toBe(false);
});

test("keeps compatibility with servers that do not report their current cursor", () => {
  expect(hasSyncCursorRewound(42)).toBe(false);
});

test("rebuilds the mobile mirror when the server data identity changes", () => {
  expect(hasSyncIdentityChanged("workspace-created-at-a", "workspace-created-at-b")).toBe(true);
  expect(hasSyncIdentityChanged("workspace-created-at-a", "workspace-created-at-a")).toBe(false);
});

test("keeps compatibility with servers that do not report a data identity", () => {
  expect(hasSyncIdentityChanged("legacy")).toBe(false);
});

test("waits for a complete local mirror before rendering an empty notebook", () => {
  expect(isSyncMetadataInitialized("42", "workspace-a")).toBe(true);
  expect(isSyncMetadataInitialized(null, "workspace-a")).toBe(false);
  expect(isSyncMetadataInitialized("42", null)).toBe(false);
  expect(isSyncMetadataInitialized("not-a-number", "workspace-a")).toBe(false);
});

test("splits the initial mirror into progressive write batches", () => {
  const items = Array.from({ length: 123 }, (_, index) => index);
  expect(splitSyncBootstrapWriteBatches(items, 50).map((batch) => batch.length)).toEqual([50, 50, 23]);
  expect(splitSyncBootstrapWriteBatches([], 50)).toEqual([[]]);
});

test("builds compact memo summaries without full content blobs", () => {
  const summary = toMemoSummary({
    id: "memo_1",
    notebookId: "nb_1",
    title: "标题",
    excerpt: "摘要",
    diagramKind: "mindmap",
    tags: ["工作"],
    isPinned: true,
    isArchived: false,
    isDeleted: false,
    revision: 4,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    deletedAt: null,
    contentJson: { type: "doc", content: [] },
    contentMarkdown: "# 标题",
    contentText: "正文很长",
    contentHash: "hash_1",
    sourceMemoIds: [],
    mergeSourceCount: 0,
    mergedIntoMemoId: null,
  });

  expect(summary).toEqual({
    id: "memo_1",
    notebookId: "nb_1",
    title: "标题",
    excerpt: "摘要",
    diagramKind: "mindmap",
    tags: ["工作"],
    isPinned: true,
    isArchived: false,
    isDeleted: false,
    revision: 4,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    deletedAt: null,
  });
  expect("contentJson" in summary).toBe(false);
  expect("contentMarkdown" in summary).toBe(false);
});

test("parses summary_json first and falls back to legacy data_json", () => {
  const summaryJson = JSON.stringify({
    id: "memo_1",
    notebookId: "nb_1",
    title: "Fast",
    excerpt: "Meta",
    tags: ["tag"],
    isPinned: false,
    isArchived: false,
    isDeleted: false,
    revision: 2,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    deletedAt: null,
  });
  expect(parseStoredMemoSummary(summaryJson, "{bad")?.title).toBe("Fast");
  expect(parseStoredMemoSummary("", summaryJson)?.title).toBe("Fast");
  expect(parseStoredMemoSummary("{bad", null)).toBeNull();
});

test("only reuses cached full note content when has_detail is 1 and revision is up to date", () => {
  expect(shouldReuseCachedMemoDetail({ data_json: "{\"id\":\"m1\"}", has_detail: 0, revision: 3 })).toBe(false);
  expect(shouldReuseCachedMemoDetail({ data_json: "", has_detail: 1, revision: 3 })).toBe(false);
  expect(shouldReuseCachedMemoDetail({ data_json: "{\"id\":\"m1\"}", has_detail: 1, revision: 2 }, 3)).toBe(false);
  expect(shouldReuseCachedMemoDetail({ data_json: "{\"id\":\"m1\"}", has_detail: 1, revision: 3 }, 3)).toBe(true);
});

test("computes stale remote memo ids while preserving offline local drafts and chunking deletes", () => {
  const stale = computeStaleRemoteMemoIds(
    ["memo_1", "memo_2", "local:draft_1", "memo_3"],
    new Set(["memo_1", "memo_3"]),
  );
  expect(stale).toEqual(["memo_2"]);
  expect(chunkValues(["a", "b", "c", "d", "e"], 2)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
});
