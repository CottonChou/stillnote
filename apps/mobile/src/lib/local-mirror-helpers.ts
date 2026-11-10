import type { MemoDetail, MemoSummary } from "@edgeever/shared";

export type StoredMemoSummaryRow = {
  summary_json: string | null;
  data_json?: string | null;
};

export type StoredMemoDetailStatusRow = {
  data_json: string;
  has_detail: number;
  revision: number;
};

export const toMemoSummary = (memo: MemoSummary | MemoDetail): MemoSummary => {
  const summary: MemoSummary = {
    id: memo.id,
    notebookId: memo.notebookId,
    title: memo.title,
    excerpt: memo.excerpt,
    tags: memo.tags,
    isPinned: memo.isPinned,
    isArchived: memo.isArchived,
    isDeleted: memo.isDeleted,
    revision: memo.revision,
    createdAt: memo.createdAt,
    updatedAt: memo.updatedAt,
    deletedAt: memo.deletedAt,
  };
  if (memo.diagramKind !== undefined) {
    summary.diagramKind = memo.diagramKind;
  }
  if (memo.diagramPreview !== undefined) {
    summary.diagramPreview = memo.diagramPreview;
  }
  if (memo.structuredTable !== undefined) {
    summary.structuredTable = memo.structuredTable;
  }
  if (memo.tablePreview !== undefined) {
    summary.tablePreview = memo.tablePreview;
  }
  if (memo.infographic !== undefined) {
    summary.infographic = memo.infographic;
  }
  if (memo.poster !== undefined) {
    summary.poster = memo.poster;
  }
  if (memo.videoNote !== undefined) {
    summary.videoNote = memo.videoNote;
  }
  return summary;
};

export const parseStoredMemoSummary = (
  summaryJson: string | null | undefined,
  fallbackDataJson?: string | null,
): MemoSummary | null => {
  if (summaryJson) {
    try {
      return JSON.parse(summaryJson) as MemoSummary;
    } catch {
      return null;
    }
  }
  if (fallbackDataJson) {
    try {
      return toMemoSummary(JSON.parse(fallbackDataJson) as MemoDetail);
    } catch {
      return null;
    }
  }
  return null;
};

export const shouldReuseCachedMemoDetail = (
  row: StoredMemoDetailStatusRow | null | undefined,
  minRevision?: number,
) => {
  if (!row || row.has_detail !== 1 || !row.data_json) {
    return false;
  }
  if (typeof minRevision === "number" && Number.isFinite(minRevision) && row.revision < minRevision) {
    return false;
  }
  return true;
};

export const computeStaleRemoteMemoIds = (
  existingIds: readonly string[],
  syncedServerIds: ReadonlySet<string>,
): string[] => existingIds.filter((id) => !id.startsWith("local:") && !syncedServerIds.has(id));

export const chunkValues = <T>(values: readonly T[], chunkSize: number): T[][] => {
  const safeSize = Math.max(1, Math.floor(chunkSize));
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += safeSize) {
    chunks.push(values.slice(index, index + safeSize));
  }
  return chunks;
};
