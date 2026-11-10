-- Rename legacy EdgeEver demo attachment filename references to StillNote.
PRAGMA foreign_keys = ON;

UPDATE resources
SET filename = REPLACE(filename, 'edgeever-attachment-demo', 'stillnote-attachment-demo')
WHERE filename LIKE '%edgeever-attachment-demo%';

UPDATE memo_contents
SET
  content_json = REPLACE(content_json, 'edgeever-attachment-demo', 'stillnote-attachment-demo'),
  content_markdown = CASE
    WHEN content_markdown IS NOT NULL THEN REPLACE(content_markdown, 'edgeever-attachment-demo', 'stillnote-attachment-demo')
    ELSE NULL
  END,
  content_text = CASE
    WHEN content_text IS NOT NULL THEN REPLACE(content_text, 'edgeever-attachment-demo', 'stillnote-attachment-demo')
    ELSE NULL
  END
WHERE content_json LIKE '%edgeever-attachment-demo%'
   OR content_markdown LIKE '%edgeever-attachment-demo%'
   OR content_text LIKE '%edgeever-attachment-demo%';

UPDATE memo_revisions
SET
  content_json = REPLACE(content_json, 'edgeever-attachment-demo', 'stillnote-attachment-demo'),
  content_markdown = CASE
    WHEN content_markdown IS NOT NULL THEN REPLACE(content_markdown, 'edgeever-attachment-demo', 'stillnote-attachment-demo')
    ELSE NULL
  END,
  content_text = CASE
    WHEN content_text IS NOT NULL THEN REPLACE(content_text, 'edgeever-attachment-demo', 'stillnote-attachment-demo')
    ELSE NULL
  END
WHERE content_json LIKE '%edgeever-attachment-demo%'
   OR content_markdown LIKE '%edgeever-attachment-demo%'
   OR content_text LIKE '%edgeever-attachment-demo%';

UPDATE memo_templates
SET
  content_json = REPLACE(content_json, 'edgeever-attachment-demo', 'stillnote-attachment-demo'),
  content_markdown = CASE
    WHEN content_markdown IS NOT NULL THEN REPLACE(content_markdown, 'edgeever-attachment-demo', 'stillnote-attachment-demo')
    ELSE NULL
  END
WHERE content_json LIKE '%edgeever-attachment-demo%'
   OR content_markdown LIKE '%edgeever-attachment-demo%';

UPDATE memo_search_documents
SET content_text = REPLACE(content_text, 'edgeever-attachment-demo', 'stillnote-attachment-demo')
WHERE content_text LIKE '%edgeever-attachment-demo%';
