import { describe, expect, test } from "bun:test";
import {
  docToMarkdown,
  hasDiagramDocumentMarker,
  hasInfographicDocumentMarker,
  hasPosterDocumentMarker,
  hasTableDocumentMarker,
  IMAGE_GALLERY_NODE_TYPE,
  markdownToDoc,
  parseDiagramDocument,
  parseInfographicDocument,
  parsePosterDocument,
  parseTableDocument,
  resolveMemoContentDoc,
  serializeDiagramDocument,
  serializeInfographicDocument,
  serializePosterDocument,
  serializeTableDocument,
  createDefaultDiagramDocument,
  createDefaultInfographicDocument,
  createDefaultTableDocument,
  createPosterDocument,
  upgradeLegacyEdgeEverDoc,
  upgradeLegacyEdgeEverMarkdown,
} from "./index.ts";

describe("legacy EdgeEver document compatibility", () => {
  test("upgrades edgeeverImageGallery multi-image notes so all images survive resolveMemoContentDoc", () => {
    const legacyDoc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "小红书图文笔记" }] },
        {
          type: "edgeeverImageGallery",
          attrs: { layout: "auto", fit: "width" },
          content: [
            { type: "image", attrs: { src: "edgeever-resource://resource/res_1", alt: "图1", width: 100 } },
            { type: "image", attrs: { src: "/api/v1/resources/res_2/blob", alt: "图2", width: 100 } },
          ],
        },
      ],
    };

    const resolved = resolveMemoContentDoc(legacyDoc, "小红书图文笔记\n\nfallback");
    expect(resolved.content[1]?.type).toBe(IMAGE_GALLERY_NODE_TYPE);
    expect(resolved.content[1]?.content).toHaveLength(2);
    expect(resolved.content[1]?.content?.[0]?.attrs?.src).toBe("stillnote-resource://resource/res_1");
    expect(docToMarkdown(resolved)).toContain("stillnote-resource://resource/res_1");
    expect(docToMarkdown(resolved)).toContain("/api/v1/resources/res_2/blob");
  });

  test("upgrades all legacy node, mark, class, scheme, and fallback attributes", () => {
    const legacy = {
      type: "doc",
      content: [
        {
          type: "edgeeverThemeBlock",
          attrs: { kind: "intro" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Attachment: doc.pdf",
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href: "edgeever-resource://resource/res_pdf",
                        class: "edgeever-attachment-link edgeever-attachment-kind-pdf",
                      },
                    },
                    {
                      type: "edgeeverUnsupportedMark",
                      attrs: { originalType: "edgeeverUnsupportedMark" },
                    },
                  ],
                },
                { type: "edgeeverEmptyExternalLink", attrs: { href: "https://example.com" } },
                {
                  type: "edgeeverPdfAttachment",
                  attrs: { url: "edgeever-staged://stage_1", label: "spec.pdf" },
                },
                {
                  type: "edgeeverFileAttachment",
                  attrs: { url: "edgeever-resource://resource/res_zip", label: "files.zip" },
                },
              ],
            },
          ],
        },
        { type: "edgeeverMergeDivider" },
        { type: "edgeeverVideoNote", attrs: { src: "edgeever-resource://resource/res_vid" } },
        {
          type: "edgeeverPluginEmbed",
          attrs: { id: "emb_1", pluginId: "org.stillnote.test", type: "card", resourceId: "res_p", dataJson: "{}" },
        },
        {
          type: "edgeeverUnsupportedBlock",
          attrs: {
            originalType: "edgeeverThemeBlock",
            originalNode: JSON.stringify({ type: "edgeeverThemeBlock", content: [] }),
          },
        },
      ],
    };

    const upgraded = upgradeLegacyEdgeEverDoc(legacy);
    expect(upgraded.content[0].type).toBe("stillnoteThemeBlock");
    const textNode = upgraded.content[0].content?.[0].content?.[0];
    expect(textNode?.marks?.[0].attrs?.href).toBe("stillnote-resource://resource/res_pdf");
    expect(textNode?.marks?.[0].attrs?.class).toBe("stillnote-attachment-link stillnote-attachment-kind-pdf");
    expect(textNode?.marks?.[1].type).toBe("stillnoteUnsupportedMark");
    expect(upgraded.content[0].content?.[0].content?.[1].type).toBe("stillnoteEmptyExternalLink");
    expect(upgraded.content[0].content?.[0].content?.[2].type).toBe("stillnotePdfAttachment");
    expect(upgraded.content[0].content?.[0].content?.[2].attrs?.url).toBe("stillnote-staged://stage_1");
    expect(upgraded.content[0].content?.[0].content?.[3].type).toBe("stillnoteFileAttachment");
    expect(upgraded.content[1].type).toBe("stillnoteMergeDivider");
    expect(upgraded.content[2].type).toBe("stillnoteVideoNote");
    expect(upgraded.content[3].type).toBe("stillnotePluginEmbed");
    expect(upgraded.content[4].type).toBe("stillnoteUnsupportedBlock");
    expect(upgraded.content[4].attrs?.originalType).toBe("stillnoteThemeBlock");
    expect(upgraded.content[4].attrs?.originalNode).toContain("stillnoteThemeBlock");

    // Copy-on-write leaves modern docs untouched by reference.
    expect(upgradeLegacyEdgeEverDoc(upgraded)).toBe(upgraded);
  });

  test("upgrades legacy markdown comments and plugin-embed fences and parses legacy special notes", () => {
    const galleryMd = [
      "<!-- edgeever:image-gallery fit=height layout=2 -->",
      "",
      "![a](edgeever-resource://resource/res_a)",
      "",
      "![b](/api/v1/resources/res_b/blob)",
      "",
      "<!-- /edgeever:image-gallery -->",
      "",
      "<!-- edgeever:merge-divider -->",
      "",
      "```edgeever-plugin-embed",
      JSON.stringify({ id: "p1", pluginId: "org.stillnote.demo", type: "board", resourceId: "res_1" }),
      "```",
    ].join("\n");

    expect(upgradeLegacyEdgeEverMarkdown(galleryMd)).toContain("<!-- stillnote:image-gallery fit=height layout=2 -->");
    const parsedDoc = markdownToDoc(galleryMd);
    expect(parsedDoc.content[0]?.type).toBe(IMAGE_GALLERY_NODE_TYPE);
    expect(parsedDoc.content[0]?.attrs).toEqual({ fit: "height", layout: "2" });
    expect(parsedDoc.content[0]?.content?.[0]?.attrs?.src).toBe("stillnote-resource://resource/res_a");
    expect(parsedDoc.content.some((n) => n.type === "stillnoteMergeDivider")).toBe(true);
    expect(parsedDoc.content.some((n) => n.type === "stillnotePluginEmbed")).toBe(true);

    const legacyDiagramMd = serializeDiagramDocument(createDefaultDiagramDocument("mind-map"))
      .replace("stillnote-diagram-v1:", "edgeever-diagram-v1:");
    expect(hasDiagramDocumentMarker(legacyDiagramMd)).toBe(true);
    expect(parseDiagramDocument(legacyDiagramMd)?.kind).toBe("mind-map");

    const legacyTableMd = serializeTableDocument(createDefaultTableDocument())
      .replace("stillnote-table-v1:", "edgeever-table-v1:");
    expect(hasTableDocumentMarker(legacyTableMd)).toBe(true);
    expect(parseTableDocument(legacyTableMd)?.fields.length).toBeGreaterThan(0);

    const legacyInfoMd = serializeInfographicDocument(createDefaultInfographicDocument())
      .replace("stillnote-infographic-v1:", "edgeever-infographic-v1:");
    expect(hasInfographicDocumentMarker(legacyInfoMd)).toBe(true);
    expect(parseInfographicDocument(legacyInfoMd)?.schemaVersion).toBe(1);

    const legacyPosterMd = serializePosterDocument(
      createPosterDocument("Legacy Poster", "Subtitle"),
    ).replace("stillnote-poster-v1:", "edgeever-poster-v1:");
    expect(hasPosterDocumentMarker(legacyPosterMd)).toBe(true);
    expect(parsePosterDocument(legacyPosterMd)?.elements.length).toBeGreaterThan(0);
  });
});
