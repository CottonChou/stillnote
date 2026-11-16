import { describe, expect, test } from "bun:test";
import { formatBytes, type ResourceListItem } from "@stillnote/shared";
import {
  calculateAssetCategoryCounts,
  filterAssetResources,
  isDocumentResource,
} from "./workspace-utils";

describe("mobile workspace assets", () => {
  const mockResources: ResourceListItem[] = [
    {
      id: "res_img_1",
      memoId: "memo_1",
      originalMemoId: null,
      kind: "image",
      mimeType: "image/png",
      filename: "architecture-diagram.png",
      byteSize: 1024 * 1024 * 2.5,
      sha256: "hash1",
      width: 1920,
      height: 1080,
      createdAt: "2026-11-16T12:00:00Z",
      updatedAt: "2026-11-16T12:00:00Z",
      url: "/api/v1/resources/res_img_1/blob",
      memoTitle: "系统架构说明",
      memoExcerpt: "分布式存储与缓存层架构",
      memoDeleted: false,
    },
    {
      id: "res_doc_1",
      memoId: "memo_2",
      originalMemoId: null,
      kind: "attachment",
      mimeType: "application/pdf",
      filename: "quarterly-report.pdf",
      byteSize: 1024 * 512,
      sha256: "hash2",
      width: null,
      height: null,
      createdAt: "2026-11-15T12:00:00Z",
      updatedAt: "2026-11-15T12:00:00Z",
      url: "/api/v1/resources/res_doc_1/blob",
      memoTitle: "Q3 季度总结汇报",
      memoExcerpt: "各项 KPI 完成度分析",
      memoDeleted: false,
    },
    {
      id: "res_doc_2",
      memoId: "memo_3",
      originalMemoId: null,
      kind: "attachment",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: "meeting-minutes.docx",
      byteSize: 1024 * 128,
      sha256: "hash3",
      width: null,
      height: null,
      createdAt: "2026-11-14T12:00:00Z",
      updatedAt: "2026-11-14T12:00:00Z",
      url: "/api/v1/resources/res_doc_2/blob",
      memoTitle: "产品周会",
      memoExcerpt: "讨论移动端交互细节",
      memoDeleted: false,
    },
    {
      id: "res_other_1",
      memoId: "memo_4",
      originalMemoId: null,
      kind: "attachment",
      mimeType: "application/octet-stream",
      filename: "firmware.bin",
      byteSize: 1024 * 1024 * 8,
      sha256: "hash4",
      width: null,
      height: null,
      createdAt: "2026-11-13T12:00:00Z",
      updatedAt: "2026-11-13T12:00:00Z",
      url: "/api/v1/resources/res_other_1/blob",
      memoTitle: "固件刷写指南",
      memoExcerpt: "用于开发板测试",
      memoDeleted: false,
    },
  ];

  test("accurately classifies document resources vs other", () => {
    expect(isDocumentResource(mockResources[0]!)).toBe(false); // image
    expect(isDocumentResource(mockResources[1]!)).toBe(true);  // pdf
    expect(isDocumentResource(mockResources[2]!)).toBe(true);  // docx
    expect(isDocumentResource(mockResources[3]!)).toBe(false); // bin
  });

  test("calculates category counts for tabs", () => {
    const counts = calculateAssetCategoryCounts(mockResources);
    expect(counts).toEqual({
      all: 4,
      image: 1,
      document: 2,
      other: 1,
    });
  });

  test("filters resources by kind categories", () => {
    expect(filterAssetResources(mockResources, "all", "")).toHaveLength(4);
    expect(filterAssetResources(mockResources, "image", "")).toEqual([mockResources[0]!]);
    expect(filterAssetResources(mockResources, "document", "")).toEqual([mockResources[1]!, mockResources[2]!]);
    expect(filterAssetResources(mockResources, "other", "")).toEqual([mockResources[3]!]);
  });

  test("searches by filename", () => {
    const results = filterAssetResources(mockResources, "all", "report");
    expect(results).toHaveLength(1);
    expect(results[0]?.filename).toBe("quarterly-report.pdf");
  });

  test("searches by associated note title and excerpt", () => {
    const byTitle = filterAssetResources(mockResources, "all", "系统架构");
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0]?.id).toBe("res_img_1");

    const byExcerpt = filterAssetResources(mockResources, "all", "开发板");
    expect(byExcerpt).toHaveLength(1);
    expect(byExcerpt[0]?.id).toBe("res_other_1");
  });

  test("formats byte sizes accurately for display", () => {
    expect(formatBytes(mockResources[0]!.byteSize)).toBe("2.50 MB");
    expect(formatBytes(mockResources[1]!.byteSize)).toBe("512.0 KB");
    expect(formatBytes(mockResources[2]!.byteSize)).toBe("128.0 KB");
    expect(formatBytes(mockResources[3]!.byteSize)).toBe("8.00 MB");
  });
});
