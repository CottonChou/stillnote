import type { DatabaseAdapter, PreparedStatementAdapter } from "./storage-contract";

// Cap indexed body text per note so occasional long clipped articles cannot blow up
// the FTS5 inverted index or D1 read/write quotas on update/delete. Full text remains
// intact in memo_contents.content_text.
export const MAX_SEARCH_DOCUMENT_CONTENT_CHARS = 32_768;

export const normalizeSearchDocumentContent = (contentText: string) =>
  contentText.length <= MAX_SEARCH_DOCUMENT_CONTENT_CHARS
    ? contentText
    : contentText.slice(0, MAX_SEARCH_DOCUMENT_CONTENT_CHARS);

export const upsertMemoSearchDocumentStatement = (
  database: DatabaseAdapter,
  memoId: string,
  title: string | null,
  contentText: string,
  tags: string,
): PreparedStatementAdapter => database.prepare(
  `INSERT INTO memo_search_documents (memo_id, title, content_text, tags)
   VALUES (?, ?, ?, ?)
   ON CONFLICT(memo_id) DO UPDATE SET
     title = excluded.title,
     content_text = excluded.content_text,
     tags = excluded.tags
   WHERE memo_search_documents.title IS NOT excluded.title
      OR memo_search_documents.content_text IS NOT excluded.content_text
      OR memo_search_documents.tags IS NOT excluded.tags`,
).bind(memoId, title, normalizeSearchDocumentContent(contentText), tags);

export const deleteMemoSearchDocumentsStatement = (
  database: DatabaseAdapter,
  memoIds: string[],
): PreparedStatementAdapter => {
  const placeholders = memoIds.map(() => "?").join(", ");
  return database.prepare(
    `DELETE FROM memo_search_documents WHERE memo_id IN (${placeholders})`,
  ).bind(...memoIds);
};
