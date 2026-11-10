-- Migrate persisted note documents, markdown fallbacks, templates, and revision
-- snapshots from legacy EdgeEver node types, markers, classes, and resource URL
-- schemes to their StillNote equivalents in shallow batches compatible with
-- standard SQLite parser stack limits.
PRAGMA foreign_keys = ON;

-- 1. memo_contents.content_json
UPDATE memo_contents
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeeverImageGallery', 'stillnoteImageGallery'),
  'edgeeverThemeBlock', 'stillnoteThemeBlock'),
  'edgeeverMergeDivider', 'stillnoteMergeDivider'),
  'edgeeverVideoNote', 'stillnoteVideoNote'),
  'edgeeverPdfAttachment', 'stillnotePdfAttachment'),
  'edgeeverFileAttachment', 'stillnoteFileAttachment'),
  'edgeeverPluginEmbed', 'stillnotePluginEmbed'),
  'edgeeverEmptyExternalLink', 'stillnoteEmptyExternalLink')
WHERE content_json LIKE '%edgeeverImageGallery%'
   OR content_json LIKE '%edgeeverThemeBlock%'
   OR content_json LIKE '%edgeeverMergeDivider%'
   OR content_json LIKE '%edgeeverVideoNote%'
   OR content_json LIKE '%edgeeverPdfAttachment%'
   OR content_json LIKE '%edgeeverFileAttachment%'
   OR content_json LIKE '%edgeeverPluginEmbed%'
   OR content_json LIKE '%edgeeverEmptyExternalLink%';

UPDATE memo_contents
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeeverUnsupportedBlock', 'stillnoteUnsupportedBlock'),
  'edgeeverUnsupportedInline', 'stillnoteUnsupportedInline'),
  'edgeeverUnsupportedMark', 'stillnoteUnsupportedMark'),
  'edgeever-attachment-link', 'stillnote-attachment-link'),
  'edgeever-attachment-kind-', 'stillnote-attachment-kind-'),
  'edgeever-empty-external-link', 'stillnote-empty-external-link'),
  'data-edgeever-empty-link', 'data-stillnote-empty-link'),
  'data-edgeever-image-gallery', 'data-stillnote-image-gallery'),
  'data-edgeever-merge-divider', 'data-stillnote-merge-divider')
WHERE content_json LIKE '%edgeeverUnsupported%'
   OR content_json LIKE '%edgeever-attachment-%'
   OR content_json LIKE '%edgeever-empty-external-link%'
   OR content_json LIKE '%data-edgeever-%';

UPDATE memo_contents
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeever-file-attachment', 'stillnote-file-attachment'),
  'edgeever-pdf-attachment', 'stillnote-pdf-attachment'),
  'edgeever-plugin-embed', 'stillnote-plugin-embed'),
  'edgeever:image-gallery', 'stillnote:image-gallery'),
  'edgeever:merge-divider', 'stillnote:merge-divider'),
  'edgeever-diagram-v1:', 'stillnote-diagram-v1:')
WHERE content_json LIKE '%edgeever-file-attachment%'
   OR content_json LIKE '%edgeever-pdf-attachment%'
   OR content_json LIKE '%edgeever-plugin-embed%'
   OR content_json LIKE '%edgeever:image-gallery%'
   OR content_json LIKE '%edgeever:merge-divider%'
   OR content_json LIKE '%edgeever-diagram-v1:%';

UPDATE memo_contents
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeever-infographic-v1:', 'stillnote-infographic-v1:'),
  'edgeever-poster-v1:', 'stillnote-poster-v1:'),
  'edgeever-table-v1:', 'stillnote-table-v1:'),
  'edgeever-resource://', 'stillnote-resource://'),
  'edgeever-staged://', 'stillnote-staged://'),
  'edgeever-image-upload://', 'stillnote-image-upload://')
WHERE content_json LIKE '%edgeever-infographic-v1:%'
   OR content_json LIKE '%edgeever-poster-v1:%'
   OR content_json LIKE '%edgeever-table-v1:%'
   OR content_json LIKE '%edgeever-resource://%'
   OR content_json LIKE '%edgeever-staged://%'
   OR content_json LIKE '%edgeever-image-upload://%';

-- 2. memo_contents.content_markdown
UPDATE memo_contents
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever:image-gallery', 'stillnote:image-gallery'),
  'edgeever:merge-divider', 'stillnote:merge-divider'),
  'edgeever-diagram-v1:', 'stillnote-diagram-v1:'),
  'edgeever-infographic-v1:', 'stillnote-infographic-v1:'),
  'edgeever-poster-v1:', 'stillnote-poster-v1:'),
  'edgeever-table-v1:', 'stillnote-table-v1:')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever:image-gallery%'
    OR content_markdown LIKE '%edgeever:merge-divider%'
    OR content_markdown LIKE '%edgeever-diagram-v1:%'
    OR content_markdown LIKE '%edgeever-infographic-v1:%'
    OR content_markdown LIKE '%edgeever-poster-v1:%'
    OR content_markdown LIKE '%edgeever-table-v1:%'
  );

UPDATE memo_contents
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever-plugin-embed', 'stillnote-plugin-embed'),
  'edgeever-file-attachment', 'stillnote-file-attachment'),
  'edgeever-pdf-attachment', 'stillnote-pdf-attachment'),
  'edgeever-resource://', 'stillnote-resource://'),
  'edgeever-staged://', 'stillnote-staged://'),
  'edgeever-image-upload://', 'stillnote-image-upload://')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever-plugin-embed%'
    OR content_markdown LIKE '%edgeever-file-attachment%'
    OR content_markdown LIKE '%edgeever-pdf-attachment%'
    OR content_markdown LIKE '%edgeever-resource://%'
    OR content_markdown LIKE '%edgeever-staged://%'
    OR content_markdown LIKE '%edgeever-image-upload://%'
  );

UPDATE memo_contents
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever-attachment-link', 'stillnote-attachment-link'),
  'edgeever-attachment-kind-', 'stillnote-attachment-kind-'),
  'edgeever-empty-external-link', 'stillnote-empty-external-link'),
  'data-edgeever-empty-link', 'data-stillnote-empty-link'),
  'data-edgeever-image-gallery', 'data-stillnote-image-gallery'),
  'data-edgeever-merge-divider', 'data-stillnote-merge-divider')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever-attachment-%'
    OR content_markdown LIKE '%edgeever-empty-external-link%'
    OR content_markdown LIKE '%data-edgeever-%'
  );

-- 3. memo_contents.content_text
UPDATE memo_contents
SET content_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_text,
  'edgeever:image-gallery', 'stillnote:image-gallery'),
  'edgeever:merge-divider', 'stillnote:merge-divider'),
  'edgeever-diagram-v1:', 'stillnote-diagram-v1:'),
  'edgeever-infographic-v1:', 'stillnote-infographic-v1:'),
  'edgeever-poster-v1:', 'stillnote-poster-v1:'),
  'edgeever-table-v1:', 'stillnote-table-v1:'),
  'edgeever-plugin-embed', 'stillnote-plugin-embed')
WHERE content_text IS NOT NULL
  AND (
    content_text LIKE '%edgeever:image-gallery%'
    OR content_text LIKE '%edgeever:merge-divider%'
    OR content_text LIKE '%edgeever-diagram-v1:%'
    OR content_text LIKE '%edgeever-infographic-v1:%'
    OR content_text LIKE '%edgeever-poster-v1:%'
    OR content_text LIKE '%edgeever-table-v1:%'
    OR content_text LIKE '%edgeever-plugin-embed%'
  );

UPDATE memo_contents
SET content_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_text,
  'edgeever-resource://', 'stillnote-resource://'),
  'edgeever-staged://', 'stillnote-staged://'),
  'edgeever-image-upload://', 'stillnote-image-upload://'),
  'edgeever-attachment-link', 'stillnote-attachment-link'),
  'edgeever-attachment-kind-', 'stillnote-attachment-kind-'),
  'edgeever-empty-external-link', 'stillnote-empty-external-link')
WHERE content_text IS NOT NULL
  AND (
    content_text LIKE '%edgeever-resource://%'
    OR content_text LIKE '%edgeever-staged://%'
    OR content_text LIKE '%edgeever-image-upload://%'
    OR content_text LIKE '%edgeever-attachment-%'
    OR content_text LIKE '%edgeever-empty-external-link%'
  );

-- 4. memo_revisions
UPDATE memo_revisions
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeeverImageGallery', 'stillnoteImageGallery'),
  'edgeeverThemeBlock', 'stillnoteThemeBlock'),
  'edgeeverMergeDivider', 'stillnoteMergeDivider'),
  'edgeeverVideoNote', 'stillnoteVideoNote'),
  'edgeeverPdfAttachment', 'stillnotePdfAttachment'),
  'edgeeverFileAttachment', 'stillnoteFileAttachment'),
  'edgeeverPluginEmbed', 'stillnotePluginEmbed'),
  'edgeeverEmptyExternalLink', 'stillnoteEmptyExternalLink')
WHERE content_json LIKE '%edgeeverImageGallery%'
   OR content_json LIKE '%edgeeverThemeBlock%'
   OR content_json LIKE '%edgeeverMergeDivider%'
   OR content_json LIKE '%edgeeverVideoNote%'
   OR content_json LIKE '%edgeeverPdfAttachment%'
   OR content_json LIKE '%edgeeverFileAttachment%'
   OR content_json LIKE '%edgeeverPluginEmbed%'
   OR content_json LIKE '%edgeeverEmptyExternalLink%';

UPDATE memo_revisions
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeeverUnsupportedBlock', 'stillnoteUnsupportedBlock'),
  'edgeeverUnsupportedInline', 'stillnoteUnsupportedInline'),
  'edgeeverUnsupportedMark', 'stillnoteUnsupportedMark'),
  'edgeever-attachment-link', 'stillnote-attachment-link'),
  'edgeever-attachment-kind-', 'stillnote-attachment-kind-'),
  'edgeever-empty-external-link', 'stillnote-empty-external-link'),
  'data-edgeever-empty-link', 'data-stillnote-empty-link'),
  'data-edgeever-image-gallery', 'data-stillnote-image-gallery'),
  'data-edgeever-merge-divider', 'data-stillnote-merge-divider')
WHERE content_json LIKE '%edgeeverUnsupported%'
   OR content_json LIKE '%edgeever-attachment-%'
   OR content_json LIKE '%edgeever-empty-external-link%'
   OR content_json LIKE '%data-edgeever-%';

UPDATE memo_revisions
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeever-file-attachment', 'stillnote-file-attachment'),
  'edgeever-pdf-attachment', 'stillnote-pdf-attachment'),
  'edgeever-plugin-embed', 'stillnote-plugin-embed'),
  'edgeever:image-gallery', 'stillnote:image-gallery'),
  'edgeever:merge-divider', 'stillnote:merge-divider'),
  'edgeever-diagram-v1:', 'stillnote-diagram-v1:')
WHERE content_json LIKE '%edgeever-file-attachment%'
   OR content_json LIKE '%edgeever-pdf-attachment%'
   OR content_json LIKE '%edgeever-plugin-embed%'
   OR content_json LIKE '%edgeever:image-gallery%'
   OR content_json LIKE '%edgeever:merge-divider%'
   OR content_json LIKE '%edgeever-diagram-v1:%';

UPDATE memo_revisions
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeever-infographic-v1:', 'stillnote-infographic-v1:'),
  'edgeever-poster-v1:', 'stillnote-poster-v1:'),
  'edgeever-table-v1:', 'stillnote-table-v1:'),
  'edgeever-resource://', 'stillnote-resource://'),
  'edgeever-staged://', 'stillnote-staged://'),
  'edgeever-image-upload://', 'stillnote-image-upload://')
WHERE content_json LIKE '%edgeever-infographic-v1:%'
   OR content_json LIKE '%edgeever-poster-v1:%'
   OR content_json LIKE '%edgeever-table-v1:%'
   OR content_json LIKE '%edgeever-resource://%'
   OR content_json LIKE '%edgeever-staged://%'
   OR content_json LIKE '%edgeever-image-upload://%';

UPDATE memo_revisions
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever:image-gallery', 'stillnote:image-gallery'),
  'edgeever:merge-divider', 'stillnote:merge-divider'),
  'edgeever-diagram-v1:', 'stillnote-diagram-v1:'),
  'edgeever-infographic-v1:', 'stillnote-infographic-v1:'),
  'edgeever-poster-v1:', 'stillnote-poster-v1:'),
  'edgeever-table-v1:', 'stillnote-table-v1:')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever:image-gallery%'
    OR content_markdown LIKE '%edgeever:merge-divider%'
    OR content_markdown LIKE '%edgeever-diagram-v1:%'
    OR content_markdown LIKE '%edgeever-infographic-v1:%'
    OR content_markdown LIKE '%edgeever-poster-v1:%'
    OR content_markdown LIKE '%edgeever-table-v1:%'
  );

UPDATE memo_revisions
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever-plugin-embed', 'stillnote-plugin-embed'),
  'edgeever-file-attachment', 'stillnote-file-attachment'),
  'edgeever-pdf-attachment', 'stillnote-pdf-attachment'),
  'edgeever-resource://', 'stillnote-resource://'),
  'edgeever-staged://', 'stillnote-staged://'),
  'edgeever-image-upload://', 'stillnote-image-upload://')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever-plugin-embed%'
    OR content_markdown LIKE '%edgeever-file-attachment%'
    OR content_markdown LIKE '%edgeever-pdf-attachment%'
    OR content_markdown LIKE '%edgeever-resource://%'
    OR content_markdown LIKE '%edgeever-staged://%'
    OR content_markdown LIKE '%edgeever-image-upload://%'
  );

UPDATE memo_revisions
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever-attachment-link', 'stillnote-attachment-link'),
  'edgeever-attachment-kind-', 'stillnote-attachment-kind-'),
  'edgeever-empty-external-link', 'stillnote-empty-external-link'),
  'data-edgeever-empty-link', 'data-stillnote-empty-link'),
  'data-edgeever-image-gallery', 'data-stillnote-image-gallery'),
  'data-edgeever-merge-divider', 'data-stillnote-merge-divider')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever-attachment-%'
    OR content_markdown LIKE '%edgeever-empty-external-link%'
    OR content_markdown LIKE '%data-edgeever-%'
  );

UPDATE memo_revisions
SET content_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_text,
  'edgeever:image-gallery', 'stillnote:image-gallery'),
  'edgeever:merge-divider', 'stillnote:merge-divider'),
  'edgeever-diagram-v1:', 'stillnote-diagram-v1:'),
  'edgeever-infographic-v1:', 'stillnote-infographic-v1:'),
  'edgeever-poster-v1:', 'stillnote-poster-v1:'),
  'edgeever-table-v1:', 'stillnote-table-v1:'),
  'edgeever-plugin-embed', 'stillnote-plugin-embed')
WHERE content_text IS NOT NULL
  AND (
    content_text LIKE '%edgeever:image-gallery%'
    OR content_text LIKE '%edgeever:merge-divider%'
    OR content_text LIKE '%edgeever-diagram-v1:%'
    OR content_text LIKE '%edgeever-infographic-v1:%'
    OR content_text LIKE '%edgeever-poster-v1:%'
    OR content_text LIKE '%edgeever-table-v1:%'
    OR content_text LIKE '%edgeever-plugin-embed%'
  );

UPDATE memo_revisions
SET content_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_text,
  'edgeever-resource://', 'stillnote-resource://'),
  'edgeever-staged://', 'stillnote-staged://'),
  'edgeever-image-upload://', 'stillnote-image-upload://'),
  'edgeever-attachment-link', 'stillnote-attachment-link'),
  'edgeever-attachment-kind-', 'stillnote-attachment-kind-'),
  'edgeever-empty-external-link', 'stillnote-empty-external-link')
WHERE content_text IS NOT NULL
  AND (
    content_text LIKE '%edgeever-resource://%'
    OR content_text LIKE '%edgeever-staged://%'
    OR content_text LIKE '%edgeever-image-upload://%'
    OR content_text LIKE '%edgeever-attachment-%'
    OR content_text LIKE '%edgeever-empty-external-link%'
  );

-- 5. memo_templates
UPDATE memo_templates
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeeverImageGallery', 'stillnoteImageGallery'),
  'edgeeverThemeBlock', 'stillnoteThemeBlock'),
  'edgeeverMergeDivider', 'stillnoteMergeDivider'),
  'edgeeverVideoNote', 'stillnoteVideoNote'),
  'edgeeverPdfAttachment', 'stillnotePdfAttachment'),
  'edgeeverFileAttachment', 'stillnoteFileAttachment'),
  'edgeeverPluginEmbed', 'stillnotePluginEmbed'),
  'edgeeverEmptyExternalLink', 'stillnoteEmptyExternalLink')
WHERE content_json LIKE '%edgeeverImageGallery%'
   OR content_json LIKE '%edgeeverThemeBlock%'
   OR content_json LIKE '%edgeeverMergeDivider%'
   OR content_json LIKE '%edgeeverVideoNote%'
   OR content_json LIKE '%edgeeverPdfAttachment%'
   OR content_json LIKE '%edgeeverFileAttachment%'
   OR content_json LIKE '%edgeeverPluginEmbed%'
   OR content_json LIKE '%edgeeverEmptyExternalLink%';

UPDATE memo_templates
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeeverUnsupportedBlock', 'stillnoteUnsupportedBlock'),
  'edgeeverUnsupportedInline', 'stillnoteUnsupportedInline'),
  'edgeeverUnsupportedMark', 'stillnoteUnsupportedMark'),
  'edgeever-attachment-link', 'stillnote-attachment-link'),
  'edgeever-attachment-kind-', 'stillnote-attachment-kind-'),
  'edgeever-empty-external-link', 'stillnote-empty-external-link'),
  'data-edgeever-empty-link', 'data-stillnote-empty-link'),
  'data-edgeever-image-gallery', 'data-stillnote-image-gallery'),
  'data-edgeever-merge-divider', 'data-stillnote-merge-divider')
WHERE content_json LIKE '%edgeeverUnsupported%'
   OR content_json LIKE '%edgeever-attachment-%'
   OR content_json LIKE '%edgeever-empty-external-link%'
   OR content_json LIKE '%data-edgeever-%';

UPDATE memo_templates
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeever-file-attachment', 'stillnote-file-attachment'),
  'edgeever-pdf-attachment', 'stillnote-pdf-attachment'),
  'edgeever-plugin-embed', 'stillnote-plugin-embed'),
  'edgeever:image-gallery', 'stillnote:image-gallery'),
  'edgeever:merge-divider', 'stillnote:merge-divider'),
  'edgeever-diagram-v1:', 'stillnote-diagram-v1:')
WHERE content_json LIKE '%edgeever-file-attachment%'
   OR content_json LIKE '%edgeever-pdf-attachment%'
   OR content_json LIKE '%edgeever-plugin-embed%'
   OR content_json LIKE '%edgeever:image-gallery%'
   OR content_json LIKE '%edgeever:merge-divider%'
   OR content_json LIKE '%edgeever-diagram-v1:%';

UPDATE memo_templates
SET content_json = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_json,
  'edgeever-infographic-v1:', 'stillnote-infographic-v1:'),
  'edgeever-poster-v1:', 'stillnote-poster-v1:'),
  'edgeever-table-v1:', 'stillnote-table-v1:'),
  'edgeever-resource://', 'stillnote-resource://'),
  'edgeever-staged://', 'stillnote-staged://'),
  'edgeever-image-upload://', 'stillnote-image-upload://')
WHERE content_json LIKE '%edgeever-infographic-v1:%'
   OR content_json LIKE '%edgeever-poster-v1:%'
   OR content_json LIKE '%edgeever-table-v1:%'
   OR content_json LIKE '%edgeever-resource://%'
   OR content_json LIKE '%edgeever-staged://%'
   OR content_json LIKE '%edgeever-image-upload://%';

UPDATE memo_templates
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever:image-gallery', 'stillnote:image-gallery'),
  'edgeever:merge-divider', 'stillnote:merge-divider'),
  'edgeever-diagram-v1:', 'stillnote-diagram-v1:'),
  'edgeever-infographic-v1:', 'stillnote-infographic-v1:'),
  'edgeever-poster-v1:', 'stillnote-poster-v1:'),
  'edgeever-table-v1:', 'stillnote-table-v1:')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever:image-gallery%'
    OR content_markdown LIKE '%edgeever:merge-divider%'
    OR content_markdown LIKE '%edgeever-diagram-v1:%'
    OR content_markdown LIKE '%edgeever-infographic-v1:%'
    OR content_markdown LIKE '%edgeever-poster-v1:%'
    OR content_markdown LIKE '%edgeever-table-v1:%'
  );

UPDATE memo_templates
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever-plugin-embed', 'stillnote-plugin-embed'),
  'edgeever-file-attachment', 'stillnote-file-attachment'),
  'edgeever-pdf-attachment', 'stillnote-pdf-attachment'),
  'edgeever-resource://', 'stillnote-resource://'),
  'edgeever-staged://', 'stillnote-staged://'),
  'edgeever-image-upload://', 'stillnote-image-upload://')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever-plugin-embed%'
    OR content_markdown LIKE '%edgeever-file-attachment%'
    OR content_markdown LIKE '%edgeever-pdf-attachment%'
    OR content_markdown LIKE '%edgeever-resource://%'
    OR content_markdown LIKE '%edgeever-staged://%'
    OR content_markdown LIKE '%edgeever-image-upload://%'
  );

UPDATE memo_templates
SET content_markdown = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content_markdown,
  'edgeever-attachment-link', 'stillnote-attachment-link'),
  'edgeever-attachment-kind-', 'stillnote-attachment-kind-'),
  'edgeever-empty-external-link', 'stillnote-empty-external-link'),
  'data-edgeever-empty-link', 'data-stillnote-empty-link'),
  'data-edgeever-image-gallery', 'data-stillnote-image-gallery'),
  'data-edgeever-merge-divider', 'data-stillnote-merge-divider')
WHERE content_markdown IS NOT NULL
  AND (
    content_markdown LIKE '%edgeever-attachment-%'
    OR content_markdown LIKE '%edgeever-empty-external-link%'
    OR content_markdown LIKE '%data-edgeever-%'
  );
