import { createStillNoteZipStream } from "@stillnote/shared/backup-archive";
import type { JsonBackupSource, StillNoteZipProgress } from "@stillnote/shared/backup-archive";
export * from "@stillnote/shared/backup-archive";

const ZIP_MIME_TYPE = "application/zip";
const MAX_BUFFERED_ZIP_BYTES = 128 * 1024 * 1024;

export class StillNoteZipMemoryLimitError extends Error {
  constructor() {
    super("This backup is too large for an in-memory export. Use a browser that supports streaming file saves.");
    this.name = "StillNoteZipMemoryLimitError";
  }
}

const bufferedZipBlob = async (stream: ReadableStream<Uint8Array>) => {
  const reader = stream.getReader();
  const chunks: ArrayBuffer[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_BUFFERED_ZIP_BYTES) {
        await reader.cancel();
        throw new StillNoteZipMemoryLimitError();
      }
      const copy = new Uint8Array(next.value.byteLength);
      copy.set(next.value);
      chunks.push(copy.buffer);
    }
  } finally {
    reader.releaseLock();
  }
  return new Blob(chunks, { type: ZIP_MIME_TYPE });
};

type StreamingFileHandle = {
  createWritable: () => Promise<WritableStream<Uint8Array>>;
  getFile?: () => Promise<File>;
};

export const saveStillNoteZip = async (
  source: JsonBackupSource,
  version: { stillnoteVersion: string; buildId: string },
  onProgress?: (progress: StillNoteZipProgress) => void,
) => {
  const filename = `stillnote-export-${new Date().toISOString().slice(0, 10)}.zip`;
  const savePicker = (window as Window & {
    showSaveFilePicker?: (options: { suggestedName: string }) => Promise<StreamingFileHandle>;
  }).showSaveFilePicker;
  if (savePicker) {
    const handle = await savePicker.call(window, { suggestedName: filename });
    const stream = await createStillNoteZipStream(source, version, onProgress);
    await stream.pipeTo(await handle.createWritable());
    return { filename, streamed: true as const };
  }

  const stream = await createStillNoteZipStream(source, version, onProgress);
  downloadStillNoteZip(await bufferedZipBlob(stream), filename);
  return { filename, streamed: false as const };
};

export const createStillNoteZipTemporaryFile = async (
  source: JsonBackupSource,
  version: { stillnoteVersion: string; buildId: string },
  onProgress?: (progress: StillNoteZipProgress) => void,
) => {
  const storage = navigator.storage as StorageManager & {
    getDirectory?: () => Promise<{
      getFileHandle: (name: string, options: { create: true }) => Promise<StreamingFileHandle>;
      removeEntry: (name: string) => Promise<void>;
    }>;
  };
  if (!storage.getDirectory) {
    const stream = await createStillNoteZipStream(source, version, onProgress);
    return { file: await bufferedZipBlob(stream), cleanup: async () => {} };
  }

  const root = await storage.getDirectory();
  const name = `stillnote-backup-${crypto.randomUUID()}.zip`;
  const handle = await root.getFileHandle(name, { create: true });
  const stream = await createStillNoteZipStream(source, version, onProgress);
  try {
    await stream.pipeTo(await handle.createWritable());
    if (!handle.getFile) throw new Error("The temporary backup file is unavailable");
    return {
      file: await handle.getFile(),
      cleanup: () => root.removeEntry(name).catch(() => {}),
    };
  } catch (error) {
    await root.removeEntry(name).catch(() => {});
    throw error;
  }
};

export const downloadStillNoteZip = (
  blob: Blob,
  filename = `stillnote-export-${new Date().toISOString().slice(0, 10)}.zip`,
) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
};
