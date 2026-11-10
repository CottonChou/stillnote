import type { AnyExtension } from "@tiptap/core";
import { StillNoteImage as Image, ImageAlignmentAttributes } from "./image-alignment";
import { ImageLinkAttributes } from "./image-link";
import { TaskList } from "@tiptap/extension-list";
import { StillNoteTableKit as TableKit } from "./markdown-table";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { createStillNoteDetailsExtensions } from "./details";
import { FileAttachment } from "./file-attachment";
import { ImageGallery } from "./image-gallery";
import { MergeDivider } from "./merge-divider";
import { PdfAttachment } from "./pdf-attachment";
import { PluginEmbed } from "./plugin-embed";
import { EmptyExternalLink } from "./empty-external-link";
import { StillNoteLink } from "./editor-link";
import { createStillNoteTaskItem } from "./task-item-input";
import { MathCodeFence } from "./mathematics-markdown";
import { createStillNoteMarked } from "./markdown-options";

export type CreateStillNoteDocumentExtensionsOptions = {
  mathematics: AnyExtension[];
  starterKit?: Parameters<typeof StarterKit.configure>[0];
  image?: AnyExtension | false;
  gallery?: AnyExtension | false;
  pdf?: AnyExtension | false;
  file?: AnyExtension | false;
  pluginEmbed?: AnyExtension | false;
  table?: Parameters<typeof TableKit.configure>[0];
  markdown?: boolean;
};

const withOptional = (value: AnyExtension | false | undefined, fallback: AnyExtension) => {
  if (value === false) return [];
  return [value ?? fallback];
};

/**
 * Document-schema TipTap extensions shared by Markdown codecs and editors.
 * Pass KaTeX math from `@stillnote/shared/mathematics` in browsers; Worker
 * codecs must keep using `createStillNoteMarkdownMathematics()`.
 */
export const createStillNoteDocumentExtensions = (
  options: CreateStillNoteDocumentExtensionsOptions,
): AnyExtension[] => [
  options.markdown
    ? StarterKit.configure({ ...options.starterKit, link: false })
    : options.starterKit === undefined ? StarterKit : StarterKit.configure(options.starterKit),
  ...(options.markdown ? [StillNoteLink] : []),
  EmptyExternalLink,
  TaskList,
  createStillNoteTaskItem(),
  options.table === undefined ? TableKit : TableKit.configure(options.table),
  ...withOptional(options.image, Image),
  ImageAlignmentAttributes,
  ImageLinkAttributes,
  ...withOptional(options.gallery, ImageGallery),
  ...withOptional(options.pdf, PdfAttachment),
  ...withOptional(options.file, FileAttachment),
  MergeDivider,
  ...createStillNoteDetailsExtensions(),
  ...withOptional(options.pluginEmbed, PluginEmbed),
  ...options.mathematics,
  MathCodeFence,
  ...(options.markdown
    ? [Markdown.configure({ marked: createStillNoteMarked(), markedOptions: { gfm: true } })]
    : []),
];
