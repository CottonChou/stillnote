PRAGMA foreign_keys = ON;

-- Allow the renamed StillNote publisher while keeping legacy rows valid.
CREATE TABLE workspace_extensions_next (
  workspace_id TEXT NOT NULL,
  extension_id TEXT NOT NULL,
  extension_type TEXT NOT NULL CHECK (extension_type IN ('plugin', 'theme')),
  version TEXT NOT NULL CHECK (length(trim(version)) > 0 AND length(version) <= 80),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('marketplace', 'github', 'manifest')),
  verified INTEGER NOT NULL CHECK (verified IN (0, 1)),
  manifest_url TEXT NOT NULL CHECK (length(trim(manifest_url)) > 0 AND length(manifest_url) <= 2000),
  repository_url TEXT CHECK (repository_url IS NULL OR (length(trim(repository_url)) > 0 AND length(repository_url) <= 500)),
  release_tag TEXT CHECK (release_tag IS NULL OR (length(trim(release_tag)) > 0 AND length(release_tag) <= 80)),
  publisher TEXT CHECK (publisher IS NULL OR publisher IN ('stillnote', 'edgeever')),
  installed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (workspace_id, extension_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

INSERT INTO workspace_extensions_next
SELECT
  workspace_id, extension_id, extension_type, version, enabled, source_kind, verified,
  manifest_url, repository_url, release_tag,
  CASE WHEN publisher = 'edgeever' THEN 'stillnote' ELSE publisher END,
  installed_at, updated_at, deleted_at
FROM workspace_extensions;

DROP TABLE workspace_extensions;
ALTER TABLE workspace_extensions_next RENAME TO workspace_extensions;

CREATE INDEX idx_workspace_extensions_workspace_updated
  ON workspace_extensions(workspace_id, deleted_at, updated_at DESC);

-- Rebrand only the untouched default welcome memo repaired by migration 0071.
UPDATE memos
SET title = '欢迎来到 StillNote',
    excerpt = '这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。',
    tags_json = '["stillnote","welcome"]',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'memo_welcome'
  AND workspace_id = 'ws_default'
  AND title = ('欢迎来到 ' || 'Edge' || 'Ever')
  AND created_by = 'system'
  AND updated_by = 'system'
  AND is_deleted = 0
  AND NOT EXISTS (SELECT 1 FROM memo_revisions WHERE memo_id = 'memo_welcome')
  AND EXISTS (
    SELECT 1 FROM memo_contents
    WHERE memo_id = 'memo_welcome'
      AND revision = 1
      AND content_hash = '30fae5a337f8b9709505c5ab00ee921410b78632c14f4b7577c88aea0f9fc390'
  );

UPDATE memo_contents
SET content_json = '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"欢迎来到 StillNote"}]},{"type":"paragraph","content":[{"type":"text","text":"这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。"}]},{"type":"paragraph","content":[{"type":"text","text":"接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。"}]}]}',
    content_markdown = '## 欢迎来到 StillNote' || char(10) || char(10) || '这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。' || char(10) || char(10) || '接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。',
    content_text = '欢迎来到 StillNote 这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。 接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。',
    content_hash = '253da40ec4cad527bfe05080c78c55b9275b352705d40755946f999c402314c3',
    revision = revision + 1,
    updated_at = (SELECT updated_at FROM memos WHERE id = 'memo_welcome')
WHERE memo_id = 'memo_welcome'
  AND revision = 1
  AND content_hash = '30fae5a337f8b9709505c5ab00ee921410b78632c14f4b7577c88aea0f9fc390'
  AND NOT EXISTS (SELECT 1 FROM memo_revisions WHERE memo_id = 'memo_welcome')
  AND EXISTS (
    SELECT 1 FROM memos
    WHERE id = 'memo_welcome' AND workspace_id = 'ws_default'
      AND title = '欢迎来到 StillNote'
      AND created_by = 'system' AND updated_by = 'system' AND is_deleted = 0
  );

UPDATE memo_search_documents
SET title = '欢迎来到 StillNote',
    content_text = '欢迎来到 StillNote 这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。 接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。',
    tags = 'stillnote welcome'
WHERE memo_id = 'memo_welcome'
  AND EXISTS (
    SELECT 1 FROM memo_contents
    WHERE memo_id = 'memo_welcome'
      AND revision = 2
      AND content_hash = '253da40ec4cad527bfe05080c78c55b9275b352705d40755946f999c402314c3'
  );
