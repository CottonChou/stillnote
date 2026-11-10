import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { globSync, readFileSync } from "node:fs";

describe("migration 0089 stillnote content rename", () => {
  test("upgrades legacy node types, markers, classes, and URL schemes without altering prose", () => {
    const sqlite = new Database(":memory:");
    try {
      const migrations = globSync("migrations/*.sql").sort();
      for (const path of migrations.filter((item) => item < "migrations/0089")) {
        sqlite.exec(readFileSync(path, "utf8"));
      }

      const inbox = sqlite
        .query("SELECT id FROM notebooks WHERE workspace_id = 'ws_default' AND slug = 'inbox'")
        .get();

      const legacyJson = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "edgeeverImageGallery",
            attrs: { layout: 2, fit: "cover" },
            content: [
              { type: "image", attrs: { src: "edgeever-resource://resource/res_1", alt: "图1" } },
              { type: "image", attrs: { src: "edgeever-staged://stage_1", alt: "图2" } },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "paper.pdf",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: "edgeever-resource://resource/res_pdf",
                      class: "edgeever-attachment-link edgeever-attachment-kind-pdf",
                    },
                  },
                ],
              },
              { type: "edgeeverPdfAttachment", attrs: { url: "edgeever-resource://resource/res_pdf" } },
              { type: "edgeeverFileAttachment", attrs: { url: "edgeever-resource://resource/res_zip" } },
            ],
          },
          { type: "edgeeverMergeDivider" },
          { type: "edgeeverPluginEmbed", attrs: { url: "https://example.com" } },
          { type: "paragraph", content: [{ type: "text", text: "Plain prose mentioning EdgeEver." }] },
        ],
      });

      const legacyMarkdown = [
        "<!-- edgeever:image-gallery fit=cover layout=2 -->",
        "![图1](edgeever-resource://resource/res_1)",
        "![图2](edgeever-staged://stage_1)",
        "<!-- /edgeever:image-gallery -->",
        "<!-- edgeever:merge-divider -->",
        "<!-- edgeever-diagram-v1:abc -->",
        "<!-- edgeever-table-v1:def -->",
        "<!-- edgeever-infographic-v1:ghi -->",
        "<!-- edgeever-poster-v1:jkl -->",
        "```edgeever-plugin-embed",
        '{"url":"https://example.com"}',
        "```",
        "[edgeever-attachment-demo.zip](edgeever-resource://resource/res_demo)",
        "[edgeever-product-brief.pdf](edgeever-resource://resource/res_pdf)",
        "![icon](edgeever-resource://resource/res_icon)",
        "Plain prose mentioning EdgeEver.",
      ].join("\n");

      sqlite
        .query(
          `INSERT INTO memos (id, workspace_id, notebook_id, title, excerpt, tags_json, created_by, updated_by)
           VALUES ('memo_legacy', 'ws_default', ?, 'XHS Gallery', 'Excerpt', '[]', 'admin', 'admin')`,
        )
        .run(inbox.id);

      sqlite
        .query(
          `INSERT INTO resources (id, memo_id, bucket_name, object_key, kind, filename, mime_type, byte_size, sha256)
           VALUES ('res_demo', 'memo_legacy', 'edgeever-resources', 'k', 'attachment', 'edgeever-attachment-demo.zip', 'application/zip', 12, 's')`,
        )
        .run();

      sqlite
        .query(
          `INSERT INTO memo_contents (memo_id, content_json, content_markdown, content_text, content_hash, revision)
           VALUES ('memo_legacy', ?, ?, 'edgeever-diagram-v1:abc edgeever-attachment-demo.zip EdgeEver', 'hash_1', 1)`,
        )
        .run(legacyJson, legacyMarkdown);

      sqlite
        .query(
          `INSERT INTO memo_revisions (id, memo_id, revision, title, content_json, content_markdown, content_text, content_hash, created_by)
           VALUES ('rev_legacy', 'memo_legacy', 1, 'XHS Gallery', ?, ?, 'edgeever-table-v1:def edgeever-attachment-demo.zip EdgeEver', 'hash_1', 'admin')`,
        )
        .run(legacyJson, legacyMarkdown);

      sqlite
        .query(
          `INSERT INTO memo_templates (id, workspace_id, name, description, title, content_json, content_markdown, tags_json)
           VALUES ('tpl_legacy', 'ws_default', 'Tpl', 'Desc', 'Title', ?, ?, '[]')`,
        )
        .run(legacyJson, legacyMarkdown);

      sqlite.exec(readFileSync("migrations/0089_stillnote_content_rename.sql", "utf8"));
      sqlite.exec(readFileSync("migrations/0090_stillnote_demo_attachment_rename.sql", "utf8"));
      sqlite.exec(readFileSync("migrations/0091_stillnote_demo_asset_rename.sql", "utf8"));
      sqlite.exec(readFileSync("migrations/0092_stillnote_resource_bucket_rename.sql", "utf8"));

      const updatedContent = sqlite
        .query("SELECT content_json, content_markdown, content_text FROM memo_contents WHERE memo_id = 'memo_legacy'")
        .get();

      expect(updatedContent.content_json).toContain('"stillnoteImageGallery"');
      expect(updatedContent.content_json).toContain('"stillnotePdfAttachment"');
      expect(updatedContent.content_json).toContain('"stillnoteFileAttachment"');
      expect(updatedContent.content_json).toContain('"stillnoteMergeDivider"');
      expect(updatedContent.content_json).toContain('"stillnotePluginEmbed"');
      expect(updatedContent.content_json).toContain("stillnote-resource://resource/res_1");
      expect(updatedContent.content_json).toContain("stillnote-staged://stage_1");
      expect(updatedContent.content_json).toContain("stillnote-attachment-link stillnote-attachment-kind-pdf");
      expect(updatedContent.content_json).toContain("Plain prose mentioning EdgeEver.");
      expect(updatedContent.content_json).not.toContain("edgeever");

      expect(updatedContent.content_markdown).toContain("<!-- stillnote:image-gallery fit=cover layout=2 -->");
      expect(updatedContent.content_markdown).toContain("<!-- /stillnote:image-gallery -->");
      expect(updatedContent.content_markdown).toContain("<!-- stillnote:merge-divider -->");
      expect(updatedContent.content_markdown).toContain("<!-- stillnote-diagram-v1:abc -->");
      expect(updatedContent.content_markdown).toContain("<!-- stillnote-table-v1:def -->");
      expect(updatedContent.content_markdown).toContain("<!-- stillnote-infographic-v1:ghi -->");
      expect(updatedContent.content_markdown).toContain("<!-- stillnote-poster-v1:jkl -->");
      expect(updatedContent.content_markdown).toContain("```stillnote-plugin-embed");
      expect(updatedContent.content_markdown).toContain("[stillnote-attachment-demo.zip](stillnote-resource://resource/res_demo)");
      expect(updatedContent.content_markdown).toContain("[stillnote-product-brief.pdf](stillnote-resource://resource/res_pdf)");
      expect(updatedContent.content_markdown).toContain("![icon](stillnote-resource://resource/res_icon)");
      expect(updatedContent.content_markdown).toContain("Plain prose mentioning EdgeEver.");
      expect(updatedContent.content_markdown).not.toContain("edgeever");

      expect(updatedContent.content_text).toBe("stillnote-diagram-v1:abc stillnote-attachment-demo.zip EdgeEver");

      const updatedResource = sqlite
        .query("SELECT filename, bucket_name FROM resources WHERE id = 'res_demo'")
        .get();
      expect(updatedResource.filename).toBe("stillnote-attachment-demo.zip");
      expect(updatedResource.bucket_name).toBe("stillnote-resources");

      const updatedRevision = sqlite
        .query("SELECT content_json, content_markdown, content_text FROM memo_revisions WHERE id = 'rev_legacy'")
        .get();
      expect(updatedRevision.content_json).toContain('"stillnoteImageGallery"');
      expect(updatedRevision.content_json).not.toContain("edgeever");
      expect(updatedRevision.content_markdown).not.toContain("edgeever");
      expect(updatedRevision.content_text).toBe("stillnote-table-v1:def stillnote-attachment-demo.zip EdgeEver");

      const updatedTemplate = sqlite
        .query("SELECT content_json, content_markdown FROM memo_templates WHERE id = 'tpl_legacy'")
        .get();
      expect(updatedTemplate.content_json).toContain('"stillnoteImageGallery"');
      expect(updatedTemplate.content_json).not.toContain("edgeever");
      expect(updatedTemplate.content_markdown).not.toContain("edgeever");
    } finally {
      sqlite.close();
    }
  });
});
