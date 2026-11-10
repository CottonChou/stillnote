import type { createStillNoteClient, ListMemosResponse, MemoFilterMode, MemoSortMode } from "@stillnote/client";
import {
  getNotebookScopeIds,
  hasSyncStateReset,
  isSyncMetadataInitialized,
  type MemoDetail,
  type MemoSummary,
  type Notebook,
  type TagSummary,
} from "@stillnote/shared";
import * as SQLite from "expo-sqlite";
import {
  chunkValues,
  computeStaleRemoteMemoIds,
  parseStoredMemoSummary,
  shouldReuseCachedMemoDetail,
  toMemoSummary,
  type StoredMemoDetailStatusRow,
  type StoredMemoSummaryRow,
} from "./local-mirror-helpers";
import { serializeMobileDatabaseWrites } from "./mobile-database-access";
import { filterLocalMemosByExactTag, summarizeMobileTags } from "./mobile-tags";

const DATABASE_NAME = "stillnote-mobile.db";
const SUMMARY_PAGE_SIZE = 200;
const CHANGE_PAGE_SIZE = 200;
const SQLITE_ID_BATCH_SIZE = 400;

let databasePromise: Promise<ReturnType<typeof serializeMobileDatabaseWrites>> | null = null;
const syncPromises = new Map<string, Promise<number>>();
const notebookSyncPromises = new Map<string, Promise<MobileNotebookSyncResult>>();

type StoredNotebookRow = { data_json: string; memo_count: number; last_memo_updated_at: string | null };
type CursorRow = { value: string };
type SyncMetaRow = CursorRow & { key: string };
type IdMappingRow = { remote_id: string };
type SoftDeleteMemoRow = {
  summary_json: string;
  data_json: string;
  has_detail: number;
  is_deleted: number;
};

export type LocalMemoListParams = {
  notebookId?: string | null;
  notebookIds?: string[];
  q?: string;
  tag?: string;
  trash?: boolean;
  sort?: MemoSortMode;
  filter?: MemoFilterMode;
  limit?: number;
  offset?: number;
};

export type MobileBootstrapProgress = {
  loadedCount: number;
  totalCount: number;
};

export type MobileNotebookSyncOptions = {
  notebookId?: string | null;
  includeDescendants?: boolean;
};

export type MobileNotebookSyncResult = {
  syncedMemoCount: number;
  deletedMemoCount: number;
  notebookCount: number;
};

type MobileLocalMirrorSyncOptions = {
  onBootstrapProgress?: (progress: MobileBootstrapProgress) => void | Promise<void>;
};

export const createMobileDataScope = (baseUrl: string, userId?: string | null) =>
  `${baseUrl.trim().toLowerCase()}|${userId ?? "anonymous"}`;

export const isMobileLocalMirrorInitialized = async (scope: string) => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SyncMetaRow>(
    `SELECT key, value FROM mobile_sync_meta WHERE scope = ? AND key IN ('cursor', 'identity')`,
    scope
  );
  const metadata = new Map(rows.map((row) => [row.key, row.value]));
  const cursorValue = metadata.get("cursor");
  const identityValue = metadata.get("identity");
  return isSyncMetadataInitialized(cursorValue, identityValue);
};

export const listLocalNotebooks = async (scope: string): Promise<{ notebooks: Notebook[] }> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StoredNotebookRow>(
    `SELECT n.data_json,
            COUNT(CASE WHEN m.is_deleted = 0 THEN 1 END) AS memo_count,
            MAX(CASE WHEN m.is_deleted = 0 THEN m.updated_at END) AS last_memo_updated_at
     FROM mobile_notebooks n
     LEFT JOIN mobile_memos m ON m.scope = n.scope AND m.notebook_id = n.id
     WHERE n.scope = ?
     GROUP BY n.id, n.data_json
     ORDER BY n.sort_order ASC, n.name COLLATE NOCASE ASC`,
    scope
  );

  return {
    notebooks: rows.map((row) => ({
      ...(JSON.parse(row.data_json) as Notebook),
      memoCount: row.memo_count,
      lastMemoUpdatedAt: row.last_memo_updated_at,
    })),
  };
};

export const upsertLocalNotebook = async (scope: string, notebook: Notebook) => {
  const db = await getDatabase();
  await upsertNotebook(db, scope, notebook);
};

export const listLocalTags = async (scope: string): Promise<{ tags: TagSummary[] }> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StoredMemoSummaryRow>(
    `SELECT summary_json,
            CASE WHEN summary_json = '' THEN data_json ELSE '' END AS data_json
     FROM mobile_memos
     WHERE scope = ? AND is_deleted = 0`,
    scope
  );
  const memos = rows.flatMap((row) => {
    const summary = parseStoredMemoSummary(row.summary_json, row.data_json);
    return summary ? [summary] : [];
  });
  return { tags: summarizeMobileTags(memos) };
};

export const listLocalMemos = async (scope: string, params: LocalMemoListParams): Promise<ListMemosResponse> => {
  const db = await getDatabase();
  const conditions = ["scope = ?", "is_deleted = ?"];
  const binds: (string | number)[] = [scope, params.trash ? 1 : 0];

  if (params.notebookIds?.length) {
    conditions.push(`notebook_id IN (${params.notebookIds.map(() => "?").join(", ")})`);
    binds.push(...params.notebookIds);
  } else if (params.notebookId) {
    conditions.push("notebook_id = ?");
    binds.push(params.notebookId);
  }
  if (params.q?.trim()) {
    conditions.push("(title LIKE ? OR content_text LIKE ? OR tags_text LIKE ?)");
    const q = `%${params.q.trim()}%`;
    binds.push(q, q, q);
  }
  if (params.filter === "tagged") {
    conditions.push("tags_text <> ''");
  } else if (params.filter === "untagged") {
    conditions.push("tags_text = ''");
  } else if (params.filter === "pinned") {
    conditions.push("is_pinned = 1");
  }

  const orderBy = params.trash
    ? "deleted_at DESC, id DESC"
    : params.sort === "created-desc"
      ? "is_pinned DESC, created_at DESC, id DESC"
      : params.sort === "title-asc"
        ? "is_pinned DESC, title COLLATE NOCASE ASC, updated_at DESC, id DESC"
        : params.sort === "title-desc"
          ? "is_pinned DESC, title COLLATE NOCASE DESC, updated_at DESC, id DESC"
          : "is_pinned DESC, updated_at DESC, id DESC";
  const tag = params.tag?.trim() ?? "";
  const limit = params.limit ?? 50;
  const offset = Math.max(0, params.offset ?? 0);
  const whereSql = conditions.join(" AND ");

  if (tag) {
    const rows = await db.getAllAsync<StoredMemoSummaryRow>(
      `SELECT summary_json,
              CASE WHEN summary_json = '' THEN data_json ELSE '' END AS data_json
       FROM mobile_memos
       WHERE ${whereSql}
       ORDER BY ${orderBy}`,
      ...binds
    );
    const memos = filterLocalMemosByExactTag(
      rows.flatMap((row) => {
        const summary = parseStoredMemoSummary(row.summary_json, row.data_json);
        return summary ? [summary] : [];
      }),
      tag
    );
    const page = memos.slice(offset, offset + limit);
    return {
      memos: page,
      totalCount: memos.length,
      nextCursor: offset + page.length < memos.length ? String(offset + page.length) : null,
    };
  }

  const countRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM mobile_memos WHERE ${whereSql}`,
    ...binds
  );
  const rows = await db.getAllAsync<StoredMemoSummaryRow>(
    `SELECT summary_json,
            CASE WHEN summary_json = '' THEN data_json ELSE '' END AS data_json
     FROM mobile_memos
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    ...binds,
    limit,
    offset
  );
  const totalCount = countRow?.count ?? rows.length;
  const nextOffset = offset + rows.length;

  return {
    memos: rows.flatMap((row) => {
      const summary = parseStoredMemoSummary(row.summary_json, row.data_json);
      return summary ? [summary] : [];
    }),
    totalCount,
    nextCursor: nextOffset < totalCount ? String(nextOffset) : null,
  };
};

export const getLocalMemo = async (
  scope: string,
  memoId: string,
  options?: { minRevision?: number }
): Promise<MemoDetail | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<StoredMemoDetailStatusRow>(
    `SELECT data_json, has_detail, revision FROM mobile_memos WHERE scope = ? AND id = ?`,
    scope,
    memoId
  );
  if (!shouldReuseCachedMemoDetail(row, options?.minRevision)) {
    return null;
  }
  try {
    return JSON.parse(row!.data_json) as MemoDetail;
  } catch {
    return null;
  }
};

export const resolveLocalMemo = async (scope: string, memoId: string): Promise<MemoDetail | null> => {
  const direct = await getLocalMemo(scope, memoId);
  if (direct) {
    return direct;
  }
  const db = await getDatabase();
  const mapping = await db.getFirstAsync<IdMappingRow>(
    `SELECT remote_id FROM mobile_id_mappings WHERE scope = ? AND temporary_id = ?`,
    scope,
    memoId
  );
  return mapping ? getLocalMemo(scope, mapping.remote_id) : null;
};

export const upsertLocalMemo = async (scope: string, memo: MemoDetail) => {
  const db = await getDatabase();
  await upsertMemo(db, scope, memo);
};

export const deleteLocalMemo = async (scope: string, memoId: string) => {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM mobile_memos WHERE scope = ? AND id = ?`, scope, memoId);
};

/** Soft-delete a mirror row so list views hide it without waiting for a remote sync. */
export const softDeleteLocalMemo = async (scope: string, memoId: string) => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SoftDeleteMemoRow>(
    `SELECT summary_json, data_json, has_detail, is_deleted FROM mobile_memos WHERE scope = ? AND id = ?`,
    scope,
    memoId
  );
  if (!row || row.is_deleted === 1) {
    return false;
  }
  const now = new Date().toISOString();
  const summary = parseStoredMemoSummary(row.summary_json, row.data_json);
  const nextSummaryJson = summary
    ? JSON.stringify({
        ...summary,
        isDeleted: true,
        deletedAt: now,
        updatedAt: now,
      })
    : row.summary_json;

  let nextDataJson = row.data_json;
  if (row.has_detail === 1 && row.data_json) {
    try {
      const detail = JSON.parse(row.data_json) as MemoDetail;
      nextDataJson = JSON.stringify({
        ...detail,
        isDeleted: true,
        deletedAt: now,
        updatedAt: now,
      });
    } catch {
      nextDataJson = row.data_json;
    }
  }

  await db.runAsync(
    `UPDATE mobile_memos
     SET is_deleted = 1,
         deleted_at = ?,
         updated_at = ?,
         summary_json = ?,
         data_json = ?
     WHERE scope = ? AND id = ?`,
    now,
    now,
    nextSummaryJson,
    nextDataJson,
    scope,
    memoId
  );
  return true;
};

export const replaceLocalMemoId = async (scope: string, temporaryId: string, memo: MemoDetail) => {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await upsertMemo(tx, scope, memo);
    await tx.runAsync(`DELETE FROM mobile_memos WHERE scope = ? AND id = ?`, scope, temporaryId);
    await tx.runAsync(
      `INSERT OR REPLACE INTO mobile_id_mappings (scope, temporary_id, remote_id, created_at) VALUES (?, ?, ?, ?)`,
      scope,
      temporaryId,
      memo.id,
      new Date().toISOString()
    );
  });
};

export const syncMobileLocalMirror = async (
  client: ReturnType<typeof createStillNoteClient>,
  scope: string,
  options: MobileLocalMirrorSyncOptions = {}
) => {
  const existing = syncPromises.get(scope);
  if (existing) {
    return existing;
  }
  const operation = performMobileLocalMirrorSync(client, scope, options).finally(() => {
    syncPromises.delete(scope);
  });
  syncPromises.set(scope, operation);
  return operation;
};

const performMobileLocalMirrorSync = async (
  client: ReturnType<typeof createStillNoteClient>,
  scope: string,
  options: MobileLocalMirrorSyncOptions = {}
) => {
  const db = await getDatabase();
  const cursorRow = await db.getFirstAsync<CursorRow>(
    `SELECT value FROM mobile_sync_meta WHERE scope = ? AND key = 'cursor'`,
    scope
  );
  const identityRow = await db.getFirstAsync<CursorRow>(
    `SELECT value FROM mobile_sync_meta WHERE scope = ? AND key = 'identity'`,
    scope
  );
  let cursor = cursorRow ? Number(cursorRow.value) : null;
  let syncIdentity = identityRow?.value ?? null;

  if (cursor === null || !Number.isFinite(cursor) || syncIdentity === null) {
    const anchorPage = await client.getMobileSyncBootstrapPage(null, 1);
    const snapshotCursor = anchorPage.snapshotCursor ?? 0;
    const snapshotTotalCount = anchorPage.totalCount ?? 0;
    const snapshotIdentity = anchorPage.syncIdentity || "legacy";
    const loadedIds = new Set<string>();

    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(`DELETE FROM mobile_notebooks WHERE scope = ?`, scope);
      // Offline-created memos are owned by the local sync queue and must
      // survive a remote snapshot rebuild.
      await tx.runAsync(`DELETE FROM mobile_memos WHERE scope = ? AND id NOT LIKE 'local:%'`, scope);
      for (const notebook of anchorPage.notebooks) {
        await upsertNotebook(tx, scope, notebook);
      }
      for (const memo of anchorPage.memos) {
        await upsertMemo(tx, scope, memo);
        loadedIds.add(memo.id);
      }
    });

    await options.onBootstrapProgress?.({
      loadedCount: loadedIds.size,
      totalCount: Math.max(snapshotTotalCount, loadedIds.size),
    });

    const pullSummaryPartition = async (trash: boolean) => {
      let listCursor: string | null = null;
      while (true) {
        const page = await client.listMemos({
          cursor: listCursor,
          includeTotal: false,
          limit: SUMMARY_PAGE_SIZE,
          trash,
        });
        if (page.memos.length > 0) {
          await db.withExclusiveTransactionAsync(async (tx) => {
            for (const memo of page.memos) {
              await upsertMemoSummary(tx, scope, memo);
              loadedIds.add(memo.id);
            }
          });
          await options.onBootstrapProgress?.({
            loadedCount: loadedIds.size,
            totalCount: Math.max(snapshotTotalCount, loadedIds.size),
          });
        }
        if (!page.nextCursor) {
          break;
        }
        listCursor = page.nextCursor;
      }
    };

    await pullSummaryPartition(false);
    await pullSummaryPartition(true);

    cursor = snapshotCursor;
    syncIdentity = snapshotIdentity;
    await setCursor(db, scope, cursor);
    await setSyncIdentity(db, scope, syncIdentity);
  }

  while (true) {
    const page = await client.getMobileSyncChanges(cursor, CHANGE_PAGE_SIZE);
    if (hasSyncStateReset(
      { cursor, syncIdentity },
      { serverCursor: page.serverCursor, syncIdentity: page.syncIdentity },
    )) {
      // A restored/replaced server database can legitimately restart its
      // change sequence. Rebuild the mirror instead of treating the stale
      // local cursor as proof that no remote notes exist.
      await db.runAsync(`DELETE FROM mobile_sync_meta WHERE scope = ? AND key IN ('cursor', 'identity')`, scope);
      return performMobileLocalMirrorSync(client, scope, options);
    }
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const change of page.changes) {
        if (change.entityType === "memo") {
          if (change.memo) {
            await upsertMemo(tx, scope, change.memo);
          } else {
            await tx.runAsync(`DELETE FROM mobile_memos WHERE scope = ? AND id = ?`, scope, change.entityId);
          }
        } else if (change.notebook) {
          await upsertNotebook(tx, scope, change.notebook);
        } else {
          await tx.runAsync(`DELETE FROM mobile_notebooks WHERE scope = ? AND id = ?`, scope, change.entityId);
        }
      }
      await setCursor(tx, scope, page.cursor);
    });
    cursor = page.cursor;
    if (!page.hasMore) {
      return cursor;
    }
  }
};

export const syncMobileNotebook = async (
  client: ReturnType<typeof createStillNoteClient>,
  scope: string,
  options: MobileNotebookSyncOptions = {}
): Promise<MobileNotebookSyncResult> => {
  const includeDescendants = options.includeDescendants ?? true;
  const targetId = options.notebookId?.trim() || null;
  const lockKey = `${scope}|${targetId ?? "*"}|${includeDescendants ? "desc" : "self"}`;
  const existing = notebookSyncPromises.get(lockKey);
  if (existing) {
    return existing;
  }

  const operation = (async (): Promise<MobileNotebookSyncResult> => {
    const activeFullSync = syncPromises.get(scope);
    if (activeFullSync) {
      await activeFullSync.catch(() => 0);
    }

    const db = await getDatabase();
    const { notebooks } = await client.listNotebooks();
    const scopeNotebookIds = targetId
      ? new Set(getNotebookScopeIds(notebooks, targetId, includeDescendants))
      : null;

    const syncedIds = new Set<string>();
    const pages: MemoSummary[][] = [];
    let listCursor: string | null = null;
    while (true) {
      const page = await client.listMemos({
        cursor: listCursor,
        includeDescendants: targetId ? includeDescendants : undefined,
        includeTotal: false,
        limit: SUMMARY_PAGE_SIZE,
        notebookId: targetId ?? undefined,
        trash: false,
      });
      if (page.memos.length > 0) {
        pages.push(page.memos);
        for (const memo of page.memos) {
          syncedIds.add(memo.id);
        }
      }
      if (!page.nextCursor) {
        break;
      }
      listCursor = page.nextCursor;
    }

    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(`DELETE FROM mobile_notebooks WHERE scope = ?`, scope);
      for (const notebook of notebooks) {
        await upsertNotebook(tx, scope, notebook);
      }
      for (const memo of pages[0] ?? []) {
        await upsertMemoSummary(tx, scope, memo);
      }
    });

    for (let index = 1; index < pages.length; index += 1) {
      const memos = pages[index];
      await db.withExclusiveTransactionAsync(async (tx) => {
        for (const memo of memos) {
          await upsertMemoSummary(tx, scope, memo);
        }
      });
    }

    const existingRows = await db.getAllAsync<{ id: string; notebook_id: string }>(
      `SELECT id, notebook_id FROM mobile_memos
       WHERE scope = ? AND is_deleted = 0 AND id NOT LIKE 'local:%'`,
      scope
    );
    const scopedExistingIds = scopeNotebookIds
      ? existingRows.filter((row) => scopeNotebookIds.has(row.notebook_id)).map((row) => row.id)
      : existingRows.map((row) => row.id);
    const staleIds = computeStaleRemoteMemoIds(scopedExistingIds, syncedIds);

    for (const batch of chunkValues(staleIds, SQLITE_ID_BATCH_SIZE)) {
      await db.runAsync(
        `DELETE FROM mobile_memos WHERE scope = ? AND id IN (${batch.map(() => "?").join(", ")})`,
        scope,
        ...batch
      );
    }

    return {
      syncedMemoCount: syncedIds.size,
      deletedMemoCount: staleIds.length,
      notebookCount: notebooks.length,
    };
  })().finally(() => {
    notebookSyncPromises.delete(lockKey);
  });

  notebookSyncPromises.set(lockKey, operation);
  return operation;
};

const getDatabase = async () => {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS mobile_notebooks (
        scope TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER NOT NULL,
        data_json TEXT NOT NULL, PRIMARY KEY (scope, id)
      );
      CREATE TABLE IF NOT EXISTS mobile_memos (
        scope TEXT NOT NULL, id TEXT NOT NULL, notebook_id TEXT NOT NULL, title TEXT NOT NULL,
        content_text TEXT NOT NULL, tags_text TEXT NOT NULL, is_pinned INTEGER NOT NULL,
        is_deleted INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        deleted_at TEXT, summary_json TEXT NOT NULL DEFAULT '', data_json TEXT NOT NULL,
        has_detail INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (scope, id)
      );
      CREATE INDEX IF NOT EXISTS idx_mobile_memos_feed ON mobile_memos(scope, is_deleted, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_mobile_memos_notebook ON mobile_memos(scope, notebook_id, is_deleted, updated_at DESC);
      CREATE TABLE IF NOT EXISTS mobile_sync_meta (
        scope TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (scope, key)
      );
      CREATE TABLE IF NOT EXISTS mobile_id_mappings (
        scope TEXT NOT NULL, temporary_id TEXT NOT NULL, remote_id TEXT NOT NULL, created_at TEXT NOT NULL,
        PRIMARY KEY (scope, temporary_id)
      );
    `);

    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(mobile_memos)`);
    const columnNames = new Set(columns.map((column) => column.name));
    if (!columnNames.has("summary_json")) {
      await db.execAsync(`ALTER TABLE mobile_memos ADD COLUMN summary_json TEXT NOT NULL DEFAULT '';`);
    }
    if (!columnNames.has("has_detail")) {
      await db.execAsync(`ALTER TABLE mobile_memos ADD COLUMN has_detail INTEGER NOT NULL DEFAULT 1;`);
    }
    if (!columnNames.has("revision")) {
      await db.execAsync(`ALTER TABLE mobile_memos ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;`);
      try {
        await db.execAsync(
          `UPDATE mobile_memos SET revision = COALESCE(CAST(json_extract(data_json, '$.revision') AS INTEGER), 0) WHERE data_json <> '';`
        );
      } catch {
        // Older SQLite builds without json1 still work cleanly; newer remote revisions will re-hydrate on open.
      }
    }

    return serializeMobileDatabaseWrites(db);
  });
  return databasePromise;
};

const upsertNotebook = (db: Pick<SQLite.SQLiteDatabase, "runAsync">, scope: string, notebook: Notebook) =>
  db.runAsync(
    `INSERT OR REPLACE INTO mobile_notebooks (scope, id, name, sort_order, data_json) VALUES (?, ?, ?, ?, ?)`,
    scope,
    notebook.id,
    notebook.name,
    notebook.sortOrder,
    JSON.stringify(notebook)
  );

const upsertMemo = (db: Pick<SQLite.SQLiteDatabase, "runAsync">, scope: string, memo: MemoDetail) => {
  const summary = toMemoSummary(memo);
  return db.runAsync(
    `INSERT OR REPLACE INTO mobile_memos
      (scope, id, notebook_id, title, content_text, tags_text, is_pinned, is_deleted, created_at, updated_at, deleted_at, summary_json, data_json, has_detail, revision)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    scope,
    memo.id,
    memo.notebookId,
    memo.title ?? "",
    memo.contentText,
    memo.tags.join(" "),
    memo.isPinned ? 1 : 0,
    memo.isDeleted ? 1 : 0,
    memo.createdAt,
    memo.updatedAt,
    memo.deletedAt,
    JSON.stringify(summary),
    JSON.stringify(memo),
    memo.revision ?? 0
  );
};

const upsertMemoSummary = (db: Pick<SQLite.SQLiteDatabase, "runAsync">, scope: string, memo: MemoSummary) => {
  const summary = toMemoSummary(memo);
  return db.runAsync(
    `INSERT INTO mobile_memos
      (scope, id, notebook_id, title, content_text, tags_text, is_pinned, is_deleted, created_at, updated_at, deleted_at, summary_json, data_json, has_detail, revision)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0, ?)
     ON CONFLICT(scope, id) DO UPDATE SET
      notebook_id = excluded.notebook_id,
      title = excluded.title,
      content_text = CASE
        WHEN mobile_memos.has_detail = 1 AND mobile_memos.revision = excluded.revision
        THEN mobile_memos.content_text
        ELSE excluded.content_text
      END,
      tags_text = excluded.tags_text,
      is_pinned = excluded.is_pinned,
      is_deleted = excluded.is_deleted,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      summary_json = excluded.summary_json,
      data_json = CASE
        WHEN mobile_memos.has_detail = 1 AND mobile_memos.revision = excluded.revision
        THEN mobile_memos.data_json
        ELSE ''
      END,
      has_detail = CASE
        WHEN mobile_memos.has_detail = 1 AND mobile_memos.revision = excluded.revision
        THEN 1
        ELSE 0
      END,
      revision = excluded.revision`,
    scope,
    memo.id,
    memo.notebookId,
    memo.title ?? "",
    memo.excerpt ?? "",
    memo.tags.join(" "),
    memo.isPinned ? 1 : 0,
    memo.isDeleted ? 1 : 0,
    memo.createdAt,
    memo.updatedAt,
    memo.deletedAt,
    JSON.stringify(summary),
    memo.revision ?? 0
  );
};

const setCursor = (db: Pick<SQLite.SQLiteDatabase, "runAsync">, scope: string, cursor: number) =>
  db.runAsync(
    `INSERT OR REPLACE INTO mobile_sync_meta (scope, key, value) VALUES (?, 'cursor', ?)`,
    scope,
    String(cursor)
  );

const setSyncIdentity = (db: Pick<SQLite.SQLiteDatabase, "runAsync">, scope: string, identity: string) =>
  db.runAsync(
    `INSERT OR REPLACE INTO mobile_sync_meta (scope, key, value) VALUES (?, 'identity', ?)`,
    scope,
    identity
  );
