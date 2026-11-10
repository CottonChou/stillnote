import type { TiptapDoc, TiptapMark, TiptapNode, TiptapTextNode } from "./content";

const LEGACY_NODE_TYPE_MAP: Record<string, string> = {
  edgeeverImageGallery: "stillnoteImageGallery",
  edgeeverThemeBlock: "stillnoteThemeBlock",
  edgeeverMergeDivider: "stillnoteMergeDivider",
  edgeeverVideoNote: "stillnoteVideoNote",
  edgeeverPdfAttachment: "stillnotePdfAttachment",
  edgeeverFileAttachment: "stillnoteFileAttachment",
  edgeeverPluginEmbed: "stillnotePluginEmbed",
  edgeeverEmptyExternalLink: "stillnoteEmptyExternalLink",
  edgeeverUnsupportedBlock: "stillnoteUnsupportedBlock",
  edgeeverUnsupportedInline: "stillnoteUnsupportedInline",
};

const LEGACY_MARK_TYPE_MAP: Record<string, string> = {
  edgeeverUnsupportedMark: "stillnoteUnsupportedMark",
};

const LEGACY_SCHEME_PREFIX = /^edgeever-(resource|staged|image-upload):\/\//;
const LEGACY_MARKDOWN_SCHEME = /edgeever-(resource|staged|image-upload):\/\//g;

export function upgradeLegacyEdgeEverResourceUrl(value: string): string {
  return LEGACY_SCHEME_PREFIX.test(value)
    ? value.replace(LEGACY_SCHEME_PREFIX, "stillnote-$1://")
    : value;
}

function upgradeLegacyClassName(value: string): string {
  if (!value.includes("edgeever-")) return value;
  return value
    .replace(/\bedgeever-attachment-link\b/g, "stillnote-attachment-link")
    .replace(/\bedgeever-attachment-kind-/g, "stillnote-attachment-kind-")
    .replace(/\bedgeever-empty-external-link\b/g, "stillnote-empty-external-link");
}

function upgradeOriginalNodeJson(value: string): string {
  if (!value.includes("edgeever")) return value;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return value;
    const upgraded = upgradeLegacyNode(parsed as TiptapNode);
    return upgraded === parsed ? value : JSON.stringify(upgraded);
  } catch {
    return value;
  }
}

function upgradeLegacyAttrs(
  attrs: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!attrs) return attrs;

  let next: Record<string, unknown> | undefined;
  const setAttr = (key: string, value: unknown) => {
    if (!next) next = { ...attrs };
    next[key] = value;
  };

  for (const key of ["src", "href", "url"] as const) {
    const raw = attrs[key];
    if (typeof raw === "string") {
      const upgraded = upgradeLegacyEdgeEverResourceUrl(raw);
      if (upgraded !== raw) setAttr(key, upgraded);
    }
  }

  if (typeof attrs.class === "string") {
    const upgraded = upgradeLegacyClassName(attrs.class);
    if (upgraded !== attrs.class) setAttr("class", upgraded);
  }

  if (typeof attrs.originalType === "string") {
    const upgraded = LEGACY_NODE_TYPE_MAP[attrs.originalType] ?? LEGACY_MARK_TYPE_MAP[attrs.originalType];
    if (upgraded) setAttr("originalType", upgraded);
  }

  if (typeof attrs.originalNode === "string") {
    const upgraded = upgradeOriginalNodeJson(attrs.originalNode);
    if (upgraded !== attrs.originalNode) setAttr("originalNode", upgraded);
  }

  return next ?? attrs;
}

function upgradeLegacyMark(mark: TiptapMark): TiptapMark {
  const mappedType = LEGACY_MARK_TYPE_MAP[mark.type] ?? mark.type;
  const nextAttrs = upgradeLegacyAttrs(mark.attrs);
  if (mappedType === mark.type && nextAttrs === mark.attrs) {
    return mark;
  }
  return {
    ...mark,
    type: mappedType,
    ...(nextAttrs !== undefined ? { attrs: nextAttrs } : {}),
  };
}

function upgradeLegacyNode(node: TiptapNode | TiptapTextNode): TiptapNode | TiptapTextNode {
  if (node.type === "text" && "text" in node) {
    const marks = node.marks;
    if (!marks || marks.length === 0) return node;
    const nextMarks = marks.map(upgradeLegacyMark);
    const changed = nextMarks.some((mark, index) => mark !== marks[index]);
    return changed ? { ...node, marks: nextMarks } : node;
  }

  const elementNode = node as TiptapNode;
  const mappedType = LEGACY_NODE_TYPE_MAP[elementNode.type] ?? elementNode.type;
  const nextAttrs = upgradeLegacyAttrs(elementNode.attrs);
  const rawContent = elementNode.content;
  const nextContent = Array.isArray(rawContent)
    ? rawContent.map(upgradeLegacyNode)
    : rawContent;
  const contentChanged =
    Array.isArray(rawContent) &&
    Array.isArray(nextContent) &&
    nextContent.some((child, index) => child !== rawContent[index]);

  if (mappedType === elementNode.type && nextAttrs === elementNode.attrs && !contentChanged) {
    return elementNode;
  }

  return {
    ...elementNode,
    type: mappedType,
    ...(nextAttrs !== undefined ? { attrs: nextAttrs } : {}),
    ...(contentChanged ? { content: nextContent } : {}),
  };
}

/**
 * Normalizes legacy EdgeEver TipTap node types, attachment mark classes, and
 * internal URL schemes in place (copy-on-write) so upgraded notes render cleanly.
 */
export function upgradeLegacyEdgeEverDoc<T extends TiptapDoc>(doc: T): T;
export function upgradeLegacyEdgeEverDoc(doc: TiptapDoc | null | undefined): TiptapDoc | null | undefined;
export function upgradeLegacyEdgeEverDoc(doc: TiptapDoc | null | undefined): TiptapDoc | null | undefined {
  if (!doc || !Array.isArray(doc.content)) {
    return doc;
  }
  const nextContent = doc.content.map((node) => upgradeLegacyNode(node) as TiptapNode);
  const changed = nextContent.some((node, index) => node !== doc.content[index]);
  return changed ? { ...doc, content: nextContent } : doc;
}

/**
 * Rewrites legacy EdgeEver Markdown comment markers, plugin-embed fence names,
 * and internal resource URL schemes into their current StillNote equivalents.
 */
export function upgradeLegacyEdgeEverMarkdown(markdown: string): string;
export function upgradeLegacyEdgeEverMarkdown(markdown: string | null | undefined): string | null | undefined;
export function upgradeLegacyEdgeEverMarkdown(markdown: string | null | undefined): string | null | undefined {
  if (!markdown || !markdown.includes("edgeever")) {
    return markdown;
  }
  return markdown
    .replace(/<!--(\s*)edgeever:image-gallery\b/g, "<!--$1stillnote:image-gallery")
    .replace(/<!--(\s*)\/edgeever:image-gallery(\s*)-->/g, "<!--$1/stillnote:image-gallery$2-->")
    .replace(/<!--(\s*)edgeever:merge-divider(\s*)-->/g, "<!--$1stillnote:merge-divider$2-->")
    .replace(/<!--(\s*)edgeever-(diagram|infographic|poster|table)-v1:/g, "<!--$1stillnote-$2-v1:")
    .replace(/(^|\n)(`{3,}|~{3,})edgeever-plugin-embed(?=[ \t]*(?:\n|$))/g, "$1$2stillnote-plugin-embed")
    .replace(LEGACY_MARKDOWN_SCHEME, "stillnote-$1://");
}
