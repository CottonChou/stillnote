-- Repair only the exact, untouched installation seed. SQL does not interpret \n.
-- Update the memo first so existing sync triggers announce the content change.
-- Both statements re-check the old content; replaying this migration is a no-op.
UPDATE memos
SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'memo_welcome'
  AND id IN (SELECT memo_id FROM memo_contents WHERE memo_id = 'memo_welcome'
  AND revision = 0
  AND content_hash = 'b1b22286934622a324d61729cfa50b75bf45f8be22da97aede4ae62e0a8863bd'
  AND content_json = '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"欢迎来到 StillNote"}]},{"type":"paragraph","content":[{"type":"text","text":"这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。"}]},{"type":"paragraph","content":[{"type":"text","text":"接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。"}]}]}'
  AND content_markdown = '## 欢迎来到 StillNote\n\n这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。\n\n接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。'
  AND content_text = '欢迎来到 StillNote 这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。 接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。'
  AND NOT EXISTS (SELECT 1 FROM memo_revisions WHERE memo_id = 'memo_welcome')
  AND EXISTS (
    SELECT 1 FROM memos
    WHERE id = 'memo_welcome' AND workspace_id = 'ws_default'
      AND title = '欢迎来到 StillNote'
      AND created_by = 'system' AND updated_by = 'system' AND is_deleted = 0
  ));

UPDATE memo_contents
SET content_markdown = replace(content_markdown, '\n', char(10)),
    content_hash = '253da40ec4cad527bfe05080c78c55b9275b352705d40755946f999c402314c3',
    revision = revision + 1,
    updated_at = (SELECT updated_at FROM memos WHERE id = 'memo_welcome')
WHERE memo_id = 'memo_welcome'
  AND revision = 0
  AND content_hash = 'b1b22286934622a324d61729cfa50b75bf45f8be22da97aede4ae62e0a8863bd'
  AND content_json = '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"欢迎来到 StillNote"}]},{"type":"paragraph","content":[{"type":"text","text":"这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。"}]},{"type":"paragraph","content":[{"type":"text","text":"接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。"}]}]}'
  AND content_markdown = '## 欢迎来到 StillNote\n\n这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。\n\n接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。'
  AND content_text = '欢迎来到 StillNote 这是第一条 StillNote 笔记，三栏、边缘、Agent-ready。 接下来可以创建笔记本、写笔记、搜索内容，并把多条笔记合并成一条新的长期笔记。'
  AND NOT EXISTS (SELECT 1 FROM memo_revisions WHERE memo_id = 'memo_welcome')
  AND EXISTS (
    SELECT 1 FROM memos
    WHERE id = 'memo_welcome' AND workspace_id = 'ws_default'
      AND title = '欢迎来到 StillNote'
      AND created_by = 'system' AND updated_by = 'system' AND is_deleted = 0
  );
