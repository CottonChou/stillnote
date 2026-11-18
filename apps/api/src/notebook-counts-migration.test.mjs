import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { globSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Hono } from "hono";
import { createSelfHostedStorageAdapter } from "./self-hosted-storage-adapter.ts";
import { registerNotebookRoutes } from "./notebook-routes.ts";
import { registerMemoRoutes } from "./memo-routes.ts";
import { registerResourceRoutes } from "./resource-routes.ts";
import { serveSharedResource } from "./share-routes.ts";
import { deleteStoredObjects, resolveObjectStorage } from "./object-storage.ts";
import { pruneExpiredAuditEventsStatement } from "./audit.ts";
import {
  createNotebookRecord,
  findNotebooks,
  getNotebook,
  listNotebooks,
  resolveNotebookPath,
} from "./notebook-service.ts";
import {
  createMemoRecord,
  deleteMemosRecord,
  emptyTrashMemosRecord,
  getMemoDetail,
  moveMemosToNotebook,
  restoreMemosRecord,
  updateMemoRecord,
} from "./memo-service.ts";
import { listMemos } from "./memo-list-service.ts";
import { MAX_SEARCH_DOCUMENT_CONTENT_CHARS } from "./memo-search-index.ts";

const cleanups = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

const actor = { actorType: "user", actorId: "usr_owner" };
const auth = {
  kind: "user",
  actorType: "user",
  actorId: "usr_owner",
  username: "owner",
  displayName: "Owner",
  scopes: [],
  workspaceId: "ws_default",
  role: "owner",
};

const createMigratedDb = ({ stopBefore0093 = false } = {}) => {
  const sqlite = new Database(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const directory = mkdtempSync(join(tmpdir(), "stillnote-d1-opt-"));
  cleanups.push(() => {
    sqlite.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const migrations = globSync("migrations/*.sql").sort();
  for (const file of migrations) {
    if (stopBefore0093 && file.endsWith("0093_notebook_counts_and_d1_optimizations.sql")) break;
    sqlite.exec(readFileSync(file, "utf8"));
  }
  const storage = createSelfHostedStorageAdapter(sqlite, directory);
  return { sqlite, storage, db: storage.db, env: { storage } };
};

const assertNotebookStatsMatch = (sqlite) => {
  const rows = sqlite.query("SELECT id, workspace_id, memo_count, last_memo_updated_at FROM notebooks").all();
  for (const row of rows) {
    const expected = sqlite.query(
      `SELECT COUNT(*) AS memo_count, MAX(updated_at) AS last_memo_updated_at
       FROM memos
       WHERE notebook_id = ? AND workspace_id = ? AND is_deleted = 0`,
    ).get(row.id, row.workspace_id);
    expect({ id: row.id, memo_count: row.memo_count, last_memo_updated_at: row.last_memo_updated_at }).toEqual({
      id: row.id,
      memo_count: expected.memo_count,
      last_memo_updated_at: expected.last_memo_updated_at,
    });
  }
};

describe("0093 notebook counts and D1 read/write optimizations", () => {
  test("backfills notebook stats on upgrade without spamming mobile_sync_changes or backup_revision", () => {
    const { sqlite } = createMigratedDb({ stopBefore0093: true });
    sqlite.exec(`
      INSERT INTO notebooks (id, workspace_id, name, slug, is_deleted, created_at, updated_at) VALUES
        ('nb_active', 'ws_default', 'Active', 'active', 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
        ('nb_deleted', 'ws_default', 'Deleted', 'deleted', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
      INSERT INTO memos (id, workspace_id, notebook_id, title, is_deleted, created_at, updated_at) VALUES
        ('memo_a1', 'ws_default', 'nb_active', 'A1', 0, '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z'),
        ('memo_a2', 'ws_default', 'nb_active', 'A2', 0, '2026-01-01T00:00:00.000Z', '2026-01-05T00:00:00.000Z'),
        ('memo_a3', 'ws_default', 'nb_active', 'A3 trashed', 1, '2026-01-01T00:00:00.000Z', '2026-01-09T00:00:00.000Z');
    `);
    const syncCountBefore = sqlite.query("SELECT COUNT(*) AS count FROM mobile_sync_changes").get().count;
    const backupRevBefore = sqlite.query("SELECT backup_revision FROM workspaces WHERE id = 'ws_default'").get().backup_revision;

    sqlite.exec(readFileSync("migrations/0093_notebook_counts_and_d1_optimizations.sql", "utf8"));

    assertNotebookStatsMatch(sqlite);
    expect(sqlite.query("SELECT memo_count, last_memo_updated_at FROM notebooks WHERE id = 'nb_active'").get()).toEqual({
      memo_count: 2,
      last_memo_updated_at: "2026-01-05T00:00:00.000Z",
    });
    expect(sqlite.query("SELECT COUNT(*) AS count FROM mobile_sync_changes").get().count).toBe(syncCountBefore);
    expect(sqlite.query("SELECT backup_revision FROM workspaces WHERE id = 'ws_default'").get().backup_revision).toBe(backupRevBefore);
  });

  test("maintains exact memo_count and last_memo_updated_at across full memo lifecycle without notebook sync noise", async () => {
    const { sqlite, db, env } = createMigratedDb();
    const nb1 = await createNotebookRecord(db, "ws_default", { name: "Alpha" }, actor);
    const nb2 = await createNotebookRecord(db, "ws_default", { name: "Beta" }, actor);
    expect(nb1.memoCount).toBe(0);
    expect(nb1.lastMemoUpdatedAt).toBeNull();
    assertNotebookStatsMatch(sqlite);

    const notebookSyncCount = () => sqlite.query(
      "SELECT COUNT(*) AS count FROM mobile_sync_changes WHERE entity_type = 'notebook'",
    ).get().count;
    const notebookSyncBefore = notebookSyncCount();

    const m1 = await createMemoRecord(db, "ws_default", {
      notebookId: nb1.id, title: "M1", contentMarkdown: "one", updatedAt: "2026-02-01T00:00:00.000Z",
    }, actor, "owner");
    const m2 = await createMemoRecord(db, "ws_default", {
      notebookId: nb1.id, title: "M2", contentMarkdown: "two", updatedAt: "2026-02-05T00:00:00.000Z",
    }, actor, "owner");
    assertNotebookStatsMatch(sqlite);
    expect(await getNotebook(db, "ws_default", nb1.id)).toMatchObject({
      memoCount: 2,
      lastMemoUpdatedAt: "2026-02-05T00:00:00.000Z",
    });

    // Touch m1 with a newer timestamp
    await updateMemoRecord(db, "ws_default", m1.id, { title: "M1 edited", updatedAt: "2026-02-10T00:00:00.000Z" }, actor, "owner");
    assertNotebookStatsMatch(sqlite);
    expect((await getNotebook(db, "ws_default", nb1.id)).lastMemoUpdatedAt).toBe("2026-02-10T00:00:00.000Z");

    // Move m1 (newest) to nb2 -> nb1 should fall back to m2's timestamp
    await moveMemosToNotebook(db, "ws_default", [m1.id], nb2.id, actor, "owner");
    assertNotebookStatsMatch(sqlite);
    expect((await getNotebook(db, "ws_default", nb1.id)).memoCount).toBe(1);
    expect((await getNotebook(db, "ws_default", nb1.id)).lastMemoUpdatedAt).toBe("2026-02-05T00:00:00.000Z");
    expect((await getNotebook(db, "ws_default", nb2.id)).memoCount).toBe(1);

    // Soft-delete m2 -> nb1 becomes empty
    await deleteMemosRecord(env, "ws_default", [m2.id], false, actor);
    assertNotebookStatsMatch(sqlite);
    expect((await getNotebook(db, "ws_default", nb1.id))).toMatchObject({ memoCount: 0, lastMemoUpdatedAt: null });

    // Restore m2 -> nb1 goes back to 1
    await restoreMemosRecord(db, "ws_default", [m2.id], actor);
    assertNotebookStatsMatch(sqlite);
    expect((await getNotebook(db, "ws_default", nb1.id)).memoCount).toBe(1);

    // Rollback keeps stats consistent
    expect(() => sqlite.transaction(() => {
      sqlite.query(
        `INSERT INTO memos (id, workspace_id, notebook_id, title, is_deleted, created_at, updated_at)
         VALUES ('memo_rollback', 'ws_default', ?, 'Rolled back', 0, '2026-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z')`,
      ).run(nb1.id);
      throw new Error("rollback");
    })()).toThrow("rollback");
    assertNotebookStatsMatch(sqlite);

    // None of the memo mutations should have spammed notebook sync events
    expect(notebookSyncCount()).toBe(notebookSyncBefore);
  });

  test("notebook queries avoid LEFT JOIN memos and use partial index idx_notebooks_workspace_active", async () => {
    const { sqlite, storage, db } = createMigratedDb();
    const parent = await createNotebookRecord(db, "ws_default", { name: "Projects" }, actor);
    const child = await createNotebookRecord(db, "ws_default", { name: "StillNote", parentId: parent.id }, actor);

    const executed = [];
    const origPrepare = db.prepare.bind(db);
    db.prepare = (sql) => {
      const stmt = origPrepare(sql);
      const origBind = stmt.bind.bind(stmt);
      stmt.bind = (...values) => {
        executed.push({ sql, values });
        return origBind(...values);
      };
      return stmt;
    };

    const all = await listNotebooks(db, "ws_default");
    expect(all.some((n) => n.id === child.id)).toBe(true);
    expect(await findNotebooks(db, "ws_default", { name: "still", parentId: parent.id, exact: false, limit: 10 })).toHaveLength(1);
    const resolved = await resolveNotebookPath(db, "ws_default", "Projects/StillNote");
    expect(resolved.resolved).toBe(true);
    expect(resolved.notebook.id).toBe(child.id);

    for (const { sql } of executed) {
      expect(sql).not.toMatch(/LEFT JOIN memos/i);
      expect(sql).not.toMatch(/GROUP BY/i);
    }

    const plans = executed.map(({ sql, values }) =>
      sqlite.query(`EXPLAIN QUERY PLAN ${sql}`).all(...values).map((row) => row.detail).join(" | "),
    );
    expect(plans.every((plan) => plan.includes("idx_notebooks_workspace_active"))).toBe(true);

    // Check GET /api/v1/notebooks?includeStats=0
    const app = new Hono();
    app.use("/api/v1/*", async (c, next) => { c.set("auth", auth); await next(); });
    registerNotebookRoutes(app, async () => {});
    const res = await app.request("/api/v1/notebooks?includeStats=0", {}, { storage });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notebooks.every((n) => n.memoCount === 0 && n.lastMemoUpdatedAt === null)).toBe(true);
  });

  test("skips FTS5 search document update on metadata-only PATCH and truncates oversized indexed text", async () => {
    const { sqlite, db } = createMigratedDb();
    const nb1 = await createNotebookRecord(db, "ws_default", { name: "Source" }, actor);
    const nb2 = await createNotebookRecord(db, "ws_default", { name: "Target" }, actor);
    const oversized = "alpha ".repeat(8_000); // 48,000 chars > 32,768 cap

    const created = await createMemoRecord(db, "ws_default", {
      notebookId: nb1.id,
      title: "Long Article",
      contentMarkdown: oversized,
      tags: ["reading"],
    }, actor, "owner");

    const storedContent = sqlite.query("SELECT content_text FROM memo_contents WHERE memo_id = ?").get(created.id).content_text;
    const indexedContent = sqlite.query("SELECT content_text FROM memo_search_documents WHERE memo_id = ?").get(created.id).content_text;
    expect(storedContent.length).toBeGreaterThan(MAX_SEARCH_DOCUMENT_CONTENT_CHARS);
    expect(indexedContent.length).toBe(MAX_SEARCH_DOCUMENT_CONTENT_CHARS);

    const preparedSql = [];
    const origPrepare = db.prepare.bind(db);
    db.prepare = (sql) => {
      preparedSql.push(sql);
      return origPrepare(sql);
    };

    const moved = await updateMemoRecord(db, "ws_default", created.id, { notebookId: nb2.id }, actor, "owner");
    expect(moved.memo.notebookId).toBe(nb2.id);
    expect(preparedSql.some((sql) => sql.includes("memo_search_documents"))).toBe(false);
  });

  test("empties trash in bounded pages without bumping backup_revision for already-trashed memos", async () => {
    const { sqlite, storage, db, env } = createMigratedDb();
    const nb = await createNotebookRecord(db, "ws_default", { name: "TrashTest" }, actor);
    const ids = [];
    for (let i = 0; i < 5; i += 1) {
      const memo = await createMemoRecord(db, "ws_default", { notebookId: nb.id, title: `Note ${i}`, contentMarkdown: `body ${i}` }, actor, "owner");
      ids.push(memo.id);
    }
    await deleteMemosRecord(env, "ws_default", ids, false, actor);

    const app = new Hono();
    app.use("/api/v1/*", async (c, next) => { c.set("auth", auth); await next(); });
    registerMemoRoutes(app, {
      clampNumber: (v, min, max) => Math.min(Math.max(v, min), max),
      createImageResource: async () => ({ id: "res" }),
      createMemo: createMemoRecord,
      createMemoEditSession: async () => null,
      deleteMemo: async () => {},
      deleteMemos: deleteMemosRecord,
      emptyTrash: emptyTrashMemosRecord,
      getMemoDetail,
      listMemos,
      listMemoRevisions: async () => [],
      duplicateMemo: async () => { throw new Error("unused"); },
      mergeMemos: async () => { throw new Error("unused"); },
      moveMemos: moveMemosToNotebook,
      restoreMemo: async () => { throw new Error("unused"); },
      restoreMemoRevision: async () => { throw new Error("unused"); },
      updateMemo: updateMemoRecord,
    });

    const revBeforePurge = sqlite.query("SELECT backup_revision FROM workspaces WHERE id = 'ws_default'").get().backup_revision;

    const first = await (await app.request("/api/v1/memos/trash/empty?limit=2", { method: "DELETE" }, { storage })).json();
    expect(first).toEqual({ ok: true, deleted: 2, hasMore: true });

    const second = await (await app.request("/api/v1/memos/trash/empty?limit=2", { method: "DELETE" }, { storage })).json();
    expect(second).toEqual({ ok: true, deleted: 2, hasMore: true });

    const third = await (await app.request("/api/v1/memos/trash/empty?limit=2", { method: "DELETE" }, { storage })).json();
    expect(third).toEqual({ ok: true, deleted: 1, hasMore: false });

    const revAfterPurge = sqlite.query("SELECT backup_revision FROM workspaces WHERE id = 'ws_default'").get().backup_revision;
    expect(revAfterPurge).toBe(revBeforePurge);
    expect(sqlite.query("SELECT COUNT(*) AS count FROM memos WHERE workspace_id = 'ws_default' AND is_deleted = 1").get().count).toBe(0);
  });

  test("batch move consolidates audit_events to 1 row and cursor pagination skips COUNT(*) by default", async () => {
    const { sqlite, db } = createMigratedDb();
    const nb1 = await createNotebookRecord(db, "ws_default", { name: "Box1" }, actor);
    const nb2 = await createNotebookRecord(db, "ws_default", { name: "Box2" }, actor);
    const createdIds = [];
    for (let i = 0; i < 3; i += 1) {
      const m = await createMemoRecord(db, "ws_default", { notebookId: nb1.id, title: `Item ${i}`, tags: ["work"] }, actor, "owner");
      createdIds.push(m.id);
    }

    await moveMemosToNotebook(db, "ws_default", createdIds, nb2.id, actor, "owner");
    const moveEvents = sqlite.query("SELECT metadata_json FROM audit_events WHERE action = 'memo.move'").all();
    expect(moveEvents).toHaveLength(1);
    expect(JSON.parse(moveEvents[0].metadata_json)).toMatchObject({ batch: true, count: 3, toNotebookId: nb2.id });

    const queries = [];
    const origPrepare = db.prepare.bind(db);
    db.prepare = (sql) => {
      queries.push(sql);
      return origPrepare(sql);
    };

    const page1 = await listMemos(db, { workspaceId: "ws_default", notebookId: nb2.id, limit: 2 });
    expect(page1.totalCount).toBe(3);
    expect(page1.nextCursor).toBeTruthy();
    expect(queries.some((sql) => /COUNT\s*\(/i.test(sql))).toBe(true);

    queries.length = 0;
    const page2 = await listMemos(db, { workspaceId: "ws_default", notebookId: nb2.id, limit: 2, cursor: page1.nextCursor });
    expect(page2.memos).toHaveLength(1);
    expect(page2.totalCount).toBeUndefined();
    expect(queries.some((sql) => /COUNT\s*\(/i.test(sql))).toBe(false);
  });

  test("0094 indexes eliminate TEMP B-TREE on memo feeds/resources and skip redundant single-page COUNT/SUM", async () => {
    const { sqlite, storage, db } = createMigratedDb();
    const nb = await createNotebookRecord(db, "ws_default", { name: "Perf" }, actor);
    const memo = await createMemoRecord(db, "ws_default", { notebookId: nb.id, title: "Hello Index", contentMarkdown: "searchable body" }, actor, "owner");

    // Raw insert without explicit workspace_id must be auto-populated by trigger
    const revBefore = sqlite.query("SELECT backup_revision FROM workspaces WHERE id = 'ws_default'").get().backup_revision;
    sqlite.query(
      `INSERT INTO resources (id, memo_id, bucket_name, object_key, storage_config_id, kind, mime_type, filename, byte_size, sha256)
       VALUES ('res_auto_ws', ?, 'stillnote-resources', 'k1', 'builtin', 'image', 'image/png', 'a.png', 123, 'abcdef1234567890')`,
    ).run(memo.id);
    expect(sqlite.query("SELECT workspace_id FROM resources WHERE id = 'res_auto_ws'").get()).toEqual({ workspace_id: "ws_default" });
    // Trigger-synced workspace_id should not double-bump backup_revision beyond the single INSERT
    expect(sqlite.query("SELECT backup_revision FROM workspaces WHERE id = 'ws_default'").get().backup_revision).toBe(revBefore + 1);

    // Check EXPLAIN QUERY PLAN for default feed, notebook feed, trash feed, and resource listing
    const feedPlans = [
      sqlite.query(`EXPLAIN QUERY PLAN SELECT m.id FROM memos m INNER JOIN memo_contents mc ON mc.memo_id = m.id WHERE m.workspace_id = ? AND m.is_deleted = 0 ORDER BY m.is_pinned DESC, m.updated_at DESC, m.id DESC LIMIT 101`).all("ws_default"),
      sqlite.query(`EXPLAIN QUERY PLAN SELECT m.id FROM memos m INNER JOIN memo_contents mc ON mc.memo_id = m.id WHERE m.workspace_id = ? AND m.is_deleted = 0 AND m.notebook_id = ? ORDER BY m.is_pinned DESC, m.updated_at DESC, m.id DESC LIMIT 101`).all("ws_default", nb.id),
      sqlite.query(`EXPLAIN QUERY PLAN SELECT m.id FROM memos m INNER JOIN memo_contents mc ON mc.memo_id = m.id WHERE m.workspace_id = ? AND m.is_deleted = 1 ORDER BY m.deleted_at DESC, m.id DESC LIMIT 101`).all("ws_default"),
      sqlite.query(`EXPLAIN QUERY PLAN SELECT r.id, m.title FROM resources r LEFT JOIN memos m ON m.id = r.memo_id WHERE r.workspace_id = ? AND r.is_deleted = 0 ORDER BY r.created_at DESC, r.id DESC LIMIT 500`).all("ws_default"),
    ].map((rows) => rows.map((row) => row.detail).join(" | "));
    expect(feedPlans[0]).toContain("idx_memos_workspace_active_feed");
    expect(feedPlans[0]).not.toContain("TEMP B-TREE");
    expect(feedPlans[1]).toContain("idx_memos_workspace_notebook_active_feed");
    expect(feedPlans[1]).not.toContain("TEMP B-TREE");
    expect(feedPlans[2]).toContain("idx_memos_workspace_trash_feed");
    expect(feedPlans[2]).not.toContain("TEMP B-TREE");
    expect(feedPlans[3]).toContain("idx_resources_workspace_active_created");
    expect(feedPlans[3]).not.toContain("TEMP B-TREE");

    // Single-page search skips COUNT(*) and pushes workspace_id into LIKE branch
    const sqlLog = [];
    const origPrepare = db.prepare.bind(db);
    db.prepare = (sql) => {
      sqlLog.push(sql);
      return origPrepare(sql);
    };
    const searchRes = await listMemos(db, { workspaceId: "ws_default", notebookId: nb.id, query: "searchable", limit: 20 });
    expect(searchRes.memos).toHaveLength(1);
    expect(searchRes.totalCount).toBe(1);
    expect(sqlLog).toHaveLength(1);
    expect(sqlLog[0]).not.toMatch(/SELECT COUNT\(\*\)/i);
    expect(sqlLog[0]).toContain("AND m.workspace_id = ? AND m.is_deleted = 0 AND m.notebook_id = ?");

    // GET /api/v1/resources skips COUNT/SUM when results fit in limit
    sqlLog.length = 0;
    const app = new Hono();
    app.use("/api/v1/*", async (c, next) => { c.set("auth", auth); await next(); });
    registerResourceRoutes(app, {
      clampNumber: (v, min, max) => Math.min(Math.max(v, min), max),
      createAttachmentResource: async () => { throw new Error("unused"); },
      createImageResource: async () => { throw new Error("unused"); },
      getMemoDetail,
      getResourceRow: async () => null,
      initiateResourceUpload: async () => { throw new Error("unused"); },
      uploadResourcePart: async () => { throw new Error("unused"); },
      completeResourceUpload: async () => { throw new Error("unused"); },
      abortResourceUpload: async () => { throw new Error("unused"); },
      replaceResourceContent: async () => { throw new Error("unused"); },
    });
    const listRes = await app.request("/api/v1/resources?limit=50", {}, { storage });
    expect(listRes.status).toBe(200);
    expect(await listRes.json()).toMatchObject({
      summary: { totalCount: 1, totalBytes: 123, imageCount: 1, attachmentCount: 0 },
    });
    expect(sqlLog).toHaveLength(1);
    expect(sqlLog[0]).not.toMatch(/SUM\(/i);
  });

  test("R2 optimizations: builtin short-circuit, batched deletes, ETag 304 without store.get, immutable versioned cache, and 20MiB legacy cap", async () => {
    let dbQueries = 0;
    const deletedBatches = [];
    let storeGets = 0;
    const fakeStore = {
      get: async () => {
        storeGets += 1;
        return {
          body: new Uint8Array([1, 2, 3]),
          writeHttpMetadata: (h) => h.set("Content-Type", "image/png"),
        };
      },
      delete: async (keys) => { deletedBatches.push(keys); },
    };
    const env = {
      storage: {
        db: { prepare: () => { dbQueries += 1; throw new Error("Unexpected D1 query for builtin storage"); } },
        resources: fakeStore,
      },
    };

    // 1. resolveObjectStorage("builtin") does zero D1 queries
    const resolved = await resolveObjectStorage(env, "builtin");
    expect(resolved.store).toBe(fakeStore);
    expect(dbQueries).toBe(0);

    // 2. deleteStoredObjects chunks > 500 keys into batches of 500
    const many = Array.from({ length: 1_205 }, (_, i) => ({ storage_config_id: "builtin", object_key: `k_${i}` }));
    await deleteStoredObjects(env, many);
    expect(deletedBatches.map((b) => b.length)).toEqual([500, 500, 205]);

    // 3. Authenticated blob route returns ETag, supports 304 without calling R2.get, and immutable cache when ?v= matches sha256 prefix
    const fakeResource = {
      id: "res_etag_1",
      memo_id: "memo_1",
      original_memo_id: null,
      bucket_name: "stillnote-resources",
      object_key: "k_etag",
      storage_config_id: "builtin",
      kind: "image",
      mime_type: "image/png",
      filename: "pic.png",
      byte_size: 3,
      sha256: "deadbeef1234567890abcdef",
      width: 10,
      height: 10,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const app = new Hono();
    app.use("/api/v1/*", async (c, next) => { c.set("auth", auth); await next(); });
    registerResourceRoutes(app, {
      clampNumber: (v, min, max) => Math.min(Math.max(v, min), max),
      createAttachmentResource: async () => { throw new Error("unused"); },
      createImageResource: async () => { throw new Error("unused"); },
      getMemoDetail: async () => null,
      getResourceRow: async () => fakeResource,
      initiateResourceUpload: async () => { throw new Error("unused"); },
      uploadResourcePart: async () => { throw new Error("unused"); },
      completeResourceUpload: async () => { throw new Error("unused"); },
      abortResourceUpload: async () => { throw new Error("unused"); },
      replaceResourceContent: async () => { throw new Error("unused"); },
    });

    const first = await app.request("/api/v1/resources/res_etag_1/blob?v=deadbeef1234", {}, env);
    expect(first.status).toBe(200);
    expect(first.headers.get("ETag")).toBe('"deadbeef1234567890abcdef"');
    expect(first.headers.get("Cache-Control")).toBe("private, max-age=31536000, immutable");
    expect(storeGets).toBe(1);

    const cached = await app.request("/api/v1/resources/res_etag_1/blob?v=deadbeef1234", {
      headers: { "If-None-Match": '"deadbeef1234567890abcdef"' },
    }, env);
    expect(cached.status).toBe(304);
    expect(cached.headers.get("ETag")).toBe('"deadbeef1234567890abcdef"');
    expect(storeGets).toBe(1); // Zero R2 reads on 304!

    // 4. Shared resource also returns 304 without R2.get while keeping private, no-store
    const shareApp = new Hono();
    shareApp.get("/shared", (c) => serveSharedResource(c, {
      ...fakeResource,
      workspace_id: "ws_default",
      password_hash: null,
      expires_at: null,
    }));
    const shared304 = await shareApp.request("/shared", {
      headers: { "If-None-Match": 'W/"deadbeef1234567890abcdef"' },
    }, env);
    expect(shared304.status).toBe(304);
    expect(shared304.headers.get("Cache-Control")).toBe("private, no-store");
    expect(shared304.headers.get("ETag")).toBe('"deadbeef1234567890abcdef"');
    expect(storeGets).toBe(1);

    // 5. Legacy single-request upload rejects >20MiB payloads before buffering in Worker memory
    const oversized = await app.request("/api/v1/memos/memo_1/resources", {
      method: "POST",
      headers: { "Content-Length": String(25 * 1024 * 1024) },
    }, env);
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toMatchObject({ error: { code: "multipart_upload_required" } });
  });

  test("prunes expired audit_events via idx_audit_events_created_at without removing recent rows", async () => {
    const { sqlite, db } = createMigratedDb();
    sqlite.query(
      `INSERT INTO audit_events (id, actor_type, actor_id, action, entity_type, entity_id, metadata_json, created_at)
       VALUES
         ('audit_old', 'user', 'usr_owner', 'memo.update', 'memo', 'm1', '{}', '2020-01-01T00:00:00.000Z'),
         ('audit_new', 'user', 'usr_owner', 'memo.update', 'memo', 'm1', '{}', '2026-11-18T00:00:00.000Z')`,
    ).run();

    const plan = sqlite.query(
      `EXPLAIN QUERY PLAN DELETE FROM audit_events WHERE id IN (SELECT id FROM audit_events WHERE created_at < ? ORDER BY created_at ASC LIMIT ?)`,
    ).all("2026-08-01T00:00:00.000Z", 500).map((r) => r.detail).join(" | ");
    expect(plan).toContain("idx_audit_events_created_at");

    await pruneExpiredAuditEventsStatement(db, "2026-08-01T00:00:00.000Z", 500).run();
    const remaining = sqlite.query("SELECT id FROM audit_events WHERE id IN ('audit_old', 'audit_new')").all();
    expect(remaining).toEqual([{ id: "audit_new" }]);
  });
});
