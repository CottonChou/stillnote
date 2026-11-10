-- Rename remaining legacy EdgeEver demo resource filenames to StillNote.
PRAGMA foreign_keys = ON;

UPDATE resources
SET filename = REPLACE(REPLACE(REPLACE(
  filename,
  'edgeever-meeting-notes', 'stillnote-meeting-notes'),
  'edgeever-product-brief', 'stillnote-product-brief'),
  'edgeever-icon', 'stillnote-icon')
WHERE filename LIKE '%edgeever-meeting-notes%'
   OR filename LIKE '%edgeever-product-brief%'
   OR filename LIKE '%edgeever-icon%';

UPDATE memo_contents
SET
  content_json = REPLACE(REPLACE(REPLACE(
    content_json,
    'edgeever-meeting-notes', 'stillnote-meeting-notes'),
    'edgeever-product-brief', 'stillnote-product-brief'),
    'edgeever-icon', 'stillnote-icon'),
  content_markdown = CASE
    WHEN content_markdown IS NOT NULL THEN REPLACE(REPLACE(REPLACE(
      content_markdown,
      'edgeever-meeting-notes', 'stillnote-meeting-notes'),
      'edgeever-product-brief', 'stillnote-product-brief'),
      'edgeever-icon', 'stillnote-icon')
    ELSE NULL
  END,
  content_text = CASE
    WHEN content_text IS NOT NULL THEN REPLACE(REPLACE(REPLACE(
      content_text,
      'edgeever-meeting-notes', 'stillnote-meeting-notes'),
      'edgeever-product-brief', 'stillnote-product-brief'),
      'edgeever-icon', 'stillnote-icon')
    ELSE NULL
  END
WHERE content_json LIKE '%edgeever-meeting-notes%'
   OR content_json LIKE '%edgeever-product-brief%'
   OR content_json LIKE '%edgeever-icon%'
   OR content_markdown LIKE '%edgeever-meeting-notes%'
   OR content_markdown LIKE '%edgeever-product-brief%'
   OR content_markdown LIKE '%edgeever-icon%'
   OR content_text LIKE '%edgeever-meeting-notes%'
   OR content_text LIKE '%edgeever-product-brief%'
   OR content_text LIKE '%edgeever-icon%';

UPDATE memo_revisions
SET
  content_json = REPLACE(REPLACE(REPLACE(
    content_json,
    'edgeever-meeting-notes', 'stillnote-meeting-notes'),
    'edgeever-product-brief', 'stillnote-product-brief'),
    'edgeever-icon', 'stillnote-icon'),
  content_markdown = CASE
    WHEN content_markdown IS NOT NULL THEN REPLACE(REPLACE(REPLACE(
      content_markdown,
      'edgeever-meeting-notes', 'stillnote-meeting-notes'),
      'edgeever-product-brief', 'stillnote-product-brief'),
      'edgeever-icon', 'stillnote-icon')
    ELSE NULL
  END,
  content_text = CASE
    WHEN content_text IS NOT NULL THEN REPLACE(REPLACE(REPLACE(
      content_text,
      'edgeever-meeting-notes', 'stillnote-meeting-notes'),
      'edgeever-product-brief', 'stillnote-product-brief'),
      'edgeever-icon', 'stillnote-icon')
    ELSE NULL
  END
WHERE content_json LIKE '%edgeever-meeting-notes%'
   OR content_json LIKE '%edgeever-product-brief%'
   OR content_json LIKE '%edgeever-icon%'
   OR content_markdown LIKE '%edgeever-meeting-notes%'
   OR content_markdown LIKE '%edgeever-product-brief%'
   OR content_markdown LIKE '%edgeever-icon%'
   OR content_text LIKE '%edgeever-meeting-notes%'
   OR content_text LIKE '%edgeever-product-brief%'
   OR content_text LIKE '%edgeever-icon%';

UPDATE memo_templates
SET
  content_json = REPLACE(REPLACE(REPLACE(
    content_json,
    'edgeever-meeting-notes', 'stillnote-meeting-notes'),
    'edgeever-product-brief', 'stillnote-product-brief'),
    'edgeever-icon', 'stillnote-icon'),
  content_markdown = CASE
    WHEN content_markdown IS NOT NULL THEN REPLACE(REPLACE(REPLACE(
      content_markdown,
      'edgeever-meeting-notes', 'stillnote-meeting-notes'),
      'edgeever-product-brief', 'stillnote-product-brief'),
      'edgeever-icon', 'stillnote-icon')
    ELSE NULL
  END
WHERE content_json LIKE '%edgeever-meeting-notes%'
   OR content_json LIKE '%edgeever-product-brief%'
   OR content_json LIKE '%edgeever-icon%'
   OR content_markdown LIKE '%edgeever-meeting-notes%'
   OR content_markdown LIKE '%edgeever-product-brief%'
   OR content_markdown LIKE '%edgeever-icon%';

UPDATE memo_search_documents
SET content_text = REPLACE(REPLACE(REPLACE(
  content_text,
  'edgeever-meeting-notes', 'stillnote-meeting-notes'),
  'edgeever-product-brief', 'stillnote-product-brief'),
  'edgeever-icon', 'stillnote-icon')
WHERE content_text LIKE '%edgeever-meeting-notes%'
   OR content_text LIKE '%edgeever-product-brief%'
   OR content_text LIKE '%edgeever-icon%';
