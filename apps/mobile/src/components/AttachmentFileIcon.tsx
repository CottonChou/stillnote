import { resolveAttachmentKind } from "@stillnote/shared";
import {
  Code,
  Database,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  KeyRound,
  LayoutTemplate,
  MonitorSmartphone,
  Music,
  Video,
} from "./icons";

interface AttachmentFileIconProps {
  color?: string;
  filename?: string | null;
  mimeType?: string | null;
  size?: number;
}

export const AttachmentFileIcon = ({
  color,
  filename,
  mimeType,
  size = 28,
}: AttachmentFileIconProps) => {
  const kind = resolveAttachmentKind(mimeType, filename);

  switch (kind) {
    case "image":
      return <ImageIcon color={color ?? "#10b981"} size={size} />;
    case "audio":
      return <Music color={color ?? "#0ea5e9"} size={size} />;
    case "video":
      return <Video color={color ?? "#f43f5e"} size={size} />;
    case "pdf":
      return <FileText color={color ?? "#e11d48"} size={size} />;
    case "spreadsheet":
      return <FileSpreadsheet color={color ?? "#16a34a"} size={size} />;
    case "document":
      return <FileText color={color ?? "#2563eb"} size={size} />;
    case "presentation":
      return <LayoutTemplate color={color ?? "#f97316"} size={size} />;
    case "archive":
      return <FileArchive color={color ?? "#f59e0b"} size={size} />;
    case "code":
    case "script":
      return <Code color={color ?? "#8b5cf6"} size={size} />;
    case "text":
    case "log":
      return <FileText color={color ?? "#64748b"} size={size} />;
    case "apk":
      return <MonitorSmartphone color={color ?? "#10b981"} size={size} />;
    case "database":
      return <Database color={color ?? "#c026d3"} size={size} />;
    case "certificate":
      return <KeyRound color={color ?? "#d97706"} size={size} />;
    default:
      return <File color={color ?? "#94a3b8"} size={size} />;
  }
};
